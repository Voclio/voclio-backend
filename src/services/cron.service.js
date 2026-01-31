import cron from 'node-cron';
import { Op } from 'sequelize';
import { Reminder, User, Task, Notification, OTP, Session } from '../models/orm/index.js';
import emailService from './email.service.js';

class CronService {
  constructor() {
    this.jobs = [];
  }

  // Start all cron jobs
  start() {
    console.log('🕐 Starting cron jobs...');
    
    // Check for reminders every minute
    this.jobs.push(
      cron.schedule('* * * * *', () => {
        this.checkReminders();
      })
    );

    // Clean up expired OTPs every hour
    this.jobs.push(
      cron.schedule('0 * * * *', () => {
        this.cleanupExpiredOTPs();
      })
    );

    // Clean up old sessions every day at midnight
    this.jobs.push(
      cron.schedule('0 0 * * *', () => {
        this.cleanupExpiredSessions();
      })
    );

    console.log('✅ Cron jobs started successfully');
  }

  // Stop all cron jobs
  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('⏹️  Cron jobs stopped');
  }

  // Check and send due reminders
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
        console.log(`📬 Processed ${reminders.length} reminders`);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  // Send a single reminder
  async sendReminder(reminder) {
    try {
      const user = reminder.user;
      const task = reminder.task;
      const notificationTypes = reminder.notification_types || [];

      // Send email notification
      if (notificationTypes.includes('email')) {
        try {
          await emailService.sendReminder(user.email, {
            title: task?.title || 'Reminder',
            message: task?.description || 'You have a reminder',
            reminder_time: reminder.reminder_time
          });
        } catch (emailError) {
          console.error('Failed to send email reminder:', emailError);
          // Don't fail the whole reminder if email fails
        }
      }

      // Create in-app notification
      if (notificationTypes.includes('push')) {
        try {
          await Notification.create({
            user_id: user.user_id,
            title: '⏰ Reminder',
            message: task?.title || 'You have a reminder',
            type: 'reminder',
            data: { related_id: reminder.reminder_id }
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }

      // Mark reminder as sent
      await reminder.update({
        status: 'sent',
        sent_at: new Date()
      });

      console.log(`✅ Reminder sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      
      // Mark as failed and retry later
      try {
        await reminder.update({ status: 'failed' });
      } catch (updateError) {
        console.error('Failed to update reminder status:', updateError);
      }
    }
  }

  // Clean up expired OTP codes
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
        console.log(`🧹 Cleaned up ${result} expired OTP codes`);
      }
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
    }
  }

  // Clean up expired sessions
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
        console.log(`🧹 Cleaned up ${result} expired sessions`);
      }
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  }
}

export default new CronService();
