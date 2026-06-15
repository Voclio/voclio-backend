import cron from 'node-cron';
import { Op } from 'sequelize';
import { Reminder, User, Task, Notification, OTP, Session } from '../models/orm/index.js';
import emailService from './email.service.js';
import NotificationService from './notification.service.js';
import ScheduledNotificationService from './scheduledNotification.service.js';
import SettingsModel from '../models/settings.model.js';
import logger from '../utils/logger.js';

const ACTIVE_TASK_STATUSES = { [Op.notIn]: ['completed', 'cancelled'] };

class CronService {
  constructor() {
    this.jobs = [];
  }

  start() {
    logger.info('Starting cron jobs...');

    this.jobs.push(
      cron.schedule('* * * * *', () => {
        this.checkReminders();
        this.checkScheduledNotifications();
      })
    );

    this.jobs.push(
      cron.schedule('0 * * * *', () => {
        this.checkTasksDueSoon();
      })
    );

    this.jobs.push(
      cron.schedule('0 * * * *', () => {
        this.cleanupExpiredOTPs();
      })
    );

    this.jobs.push(
      cron.schedule('0 0 * * *', () => {
        this.cleanupExpiredSessions();
      })
    );

    logger.info('Cron jobs started successfully');
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    logger.info('Cron jobs stopped');
  }

  async hasRecentTaskNotification(userId, taskId, hours = 23) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const count = await Notification.count({
      where: {
        user_id: userId,
        type: 'task',
        related_id: taskId,
        created_at: { [Op.gte]: since }
      }
    });
    return count > 0;
  }

  async checkReminders() {
    try {
      const reminders = await Reminder.findAll({
        where: {
          reminder_time: {
            [Op.lte]: new Date()
          },
          status: 'pending',
          is_dismissed: false
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'email', 'name']
          },
          {
            model: Task,
            as: 'task',
            attributes: ['task_id', 'title', 'description'],
            required: false
          }
        ],
        limit: 50
      });

      for (const reminder of reminders) {
        await this.sendReminder(reminder);
      }

      if (reminders.length > 0) {
        logger.info(`Processed ${reminders.length} reminders`);
      }
    } catch (error) {
      logger.error('Error checking reminders', { error: error.message });
    }
  }

  async sendReminder(reminder) {
    try {
      const user = reminder.user;
      const task = reminder.task;
      const notificationTypes = reminder.notification_types || [];
      const userSettings = await SettingsModel.findByUserId(user.user_id);

      if (notificationTypes.includes('email')) {
        const emailAllowed =
          userSettings?.email_enabled !== false &&
          userSettings?.email_for_reminders !== false;
        if (emailAllowed) {
          try {
            await emailService.sendReminder(user.email, {
              title: task?.title || 'Reminder',
              message: task?.description || 'You have a reminder',
              reminder_time: reminder.reminder_time
            });
          } catch (emailError) {
            logger.error('Failed to send email reminder', { error: emailError.message });
          }
        }
      }

      if (notificationTypes.includes('push')) {
        if (userSettings?.push_enabled !== false) {
          try {
            await NotificationService.notifyReminderTriggered(user.user_id, reminder, task);
          } catch (notifError) {
            logger.error('Failed to create notification', { error: notifError.message });
          }
        }
      }

      await reminder.update({
        status: 'sent',
        sent_at: new Date()
      });

      await this.rescheduleRecurringReminder(reminder);

      logger.info(`Reminder sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending reminder', { error: error.message });

      try {
        await reminder.update({ status: 'failed' });
      } catch (updateError) {
        logger.error('Failed to update reminder status', { error: updateError.message });
      }
    }
  }

  computeNextReminderTime(reminderTime, reminderType) {
    const next = new Date(reminderTime);
    switch (reminderType) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        return next;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        return next;
      default:
        return null;
    }
  }

  async rescheduleRecurringReminder(reminder) {
    const reminderType = reminder.reminder_type;
    if (!reminderType || reminderType === 'one_time' || reminderType === 'push') {
      return;
    }

    const nextTime = this.computeNextReminderTime(reminder.reminder_time, reminderType);
    if (!nextTime) {
      return;
    }

    await reminder.update({
      reminder_time: nextTime,
      status: 'pending',
      sent_at: null,
      is_dismissed: false
    });

    logger.info(`Recurring reminder rescheduled`, {
      reminder_id: reminder.reminder_id,
      reminder_type: reminderType,
      next_time: nextTime.toISOString()
    });
  }

  async checkScheduledNotifications() {
    try {
      const processed = await ScheduledNotificationService.processDue(20);
      if (processed > 0) {
        logger.info(`Processed ${processed} scheduled notification campaigns`);
      }
    } catch (error) {
      logger.error('Error checking scheduled notifications', { error: error.message });
    }
  }

  async cleanupExpiredOTPs() {
    try {
      const result = await OTP.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date()
          }
        }
      });

      if (result > 0) {
        logger.info(`Cleaned up ${result} expired OTP codes`);
      }
    } catch (error) {
      logger.error('Error cleaning up OTPs', { error: error.message });
    }
  }

  async cleanupExpiredSessions() {
    try {
      const result = await Session.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date()
          }
        }
      });

      if (result > 0) {
        logger.info(`Cleaned up ${result} expired sessions`);
      }
    } catch (error) {
      logger.error('Error cleaning up sessions', { error: error.message });
    }
  }

  async checkTasksDueSoon() {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const tasksDueSoon = await Task.findAll({
        where: {
          due_date: {
            [Op.between]: [now, in24Hours]
          },
          status: ACTIVE_TASK_STATUSES
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'name']
          }
        ]
      });

      const overdueTasks = await Task.findAll({
        where: {
          due_date: {
            [Op.lt]: now
          },
          status: ACTIVE_TASK_STATUSES
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'name']
          }
        ]
      });

      let dueSoonSent = 0;
      let overdueSent = 0;

      for (const task of tasksDueSoon) {
        try {
          if (await this.hasRecentTaskNotification(task.user_id, task.task_id, 12)) {
            continue;
          }
          const hoursLeft = Math.round((new Date(task.due_date) - now) / (1000 * 60 * 60));
          await NotificationService.notifyTaskDueSoon(task.user_id, task, hoursLeft);
          dueSoonSent++;
        } catch (error) {
          logger.error('Failed to send due soon notification', { error: error.message });
        }
      }

      for (const task of overdueTasks) {
        try {
          if (await this.hasRecentTaskNotification(task.user_id, task.task_id, 23)) {
            continue;
          }
          await NotificationService.notifyTaskOverdue(task.user_id, task);
          overdueSent++;
        } catch (error) {
          logger.error('Failed to send overdue notification', { error: error.message });
        }
      }

      if (dueSoonSent > 0 || overdueSent > 0) {
        logger.info(`Task notifications sent: ${dueSoonSent} due soon, ${overdueSent} overdue`);
      }
    } catch (error) {
      logger.error('Error checking tasks due soon', { error: error.message });
    }
  }
}

export default new CronService();
