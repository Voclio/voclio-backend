import NotificationModel from '../models/notification.model.js';
import SettingsModel from '../models/settings.model.js';
import PushNotificationService from './pushNotification.service.js';
import { Notification } from '../models/orm/index.js';
import { notificationCopy } from '../i18n/notification.messages.js';

class NotificationService {
  static async getUserLanguage(userId) {
    const settings = await SettingsModel.findByUserId(userId);
    return settings?.language === 'ar' ? 'ar' : 'en';
  }

  /**
   * Create and send notification to user
   * @param {number} userId - User ID
   * @param {object} notificationData - Notification details
   */
  static async createNotification(userId, notificationData) {
    try {
      const {
        title,
        message,
        type = 'general',
        priority = 'normal',
        related_id = null,
        bypassPushPreference = false,
        skipPush = false
      } = notificationData;

      if (!bypassPushPreference && type !== 'system') {
        const settings = await SettingsModel.findByUserId(userId);
        if (settings?.push_enabled === false) {
          return null;
        }
      }

      const notification = await NotificationModel.create(userId, {
        title,
        message,
        type,
        priority,
        related_id: related_id ?? null
      });

      let pushDelivery = null;
      if (!skipPush) {
        pushDelivery = await PushNotificationService.sendToUser(userId, {
          title,
          body: message,
          type,
          priority,
          related_id: related_id ?? null,
          notification_id: notification?.notification_id ?? null
        }).catch(error => {
          console.error('Push notification delivery failed:', error);
          return { sent: 0, failed: 1, error: error.message };
        });
      }

      console.log(`📬 Notification created for user ${userId}: ${title}`);
      return {
        ...notification,
        push_delivery: pushDelivery
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async createLocalizedNotification(userId, type, data, options = {}) {
    const language = await this.getUserLanguage(userId);
    const { title, message } = notificationCopy(type, language, data);
    return this.createNotification(userId, {
      title,
      message,
      ...options
    });
  }

  /**
   * Task related notifications
   */
  static async notifyTaskCreated(userId, task) {
    return this.createLocalizedNotification(
      userId,
      'taskCreated',
      { task },
      {
        type: 'task',
        priority: task.priority === 'high' || task.priority === 'urgent' ? 'high' : 'normal',
        related_id: task.task_id
      }
    );
  }

  static async notifyTaskUpdated(userId, task) {
    return this.createLocalizedNotification(
      userId,
      'taskUpdated',
      { task },
      {
        type: 'task',
        priority: 'normal',
        related_id: task.task_id
      }
    );
  }

  static async notifyTaskCompleted(userId, task) {
    return this.createLocalizedNotification(
      userId,
      'taskCompleted',
      { task },
      {
        type: 'task',
        priority: 'normal',
        related_id: task.task_id
      }
    );
  }

  static async notifyTaskDueSoon(userId, task, hoursLeft) {
    return this.createLocalizedNotification(
      userId,
      'taskDueSoon',
      { task, hoursLeft },
      {
        type: 'task',
        priority: 'high',
        related_id: task.task_id
      }
    );
  }

  static async notifyTaskOverdue(userId, task) {
    return this.createLocalizedNotification(
      userId,
      'taskOverdue',
      { task },
      {
        type: 'task',
        priority: 'urgent',
        related_id: task.task_id
      }
    );
  }

  /**
   * Reminder notifications
   */
  static async notifyReminderTriggered(userId, reminder, task) {
    return this.createLocalizedNotification(
      userId,
      'reminderTriggered',
      { task },
      {
        type: 'reminder',
        priority: 'high',
        related_id: task?.task_id ?? reminder.task_id ?? null
      }
    );
  }

  static async notifyReminderCreated(userId, reminder, task = null) {
    return this.createLocalizedNotification(
      userId,
      'reminderCreated',
      {},
      {
        type: 'reminder',
        priority: 'normal',
        related_id: task?.task_id ?? reminder.task_id ?? null
      }
    );
  }

  /**
   * Note notifications
   */
  static async notifyNoteCreated(userId, note) {
    return this.createLocalizedNotification(
      userId,
      'noteCreated',
      { note },
      {
        type: 'general',
        priority: 'normal',
        related_id: note.note_id
      }
    );
  }

  /**
   * Voice recording notifications
   */
  static async notifyVoiceProcessed(userId, recording) {
    return this.createLocalizedNotification(
      userId,
      'voiceProcessed',
      {},
      {
        type: 'general',
        priority: 'normal',
        related_id: recording.recording_id
      }
    );
  }

  static async notifyVoiceToTaskCreated(userId, task) {
    return this.createLocalizedNotification(
      userId,
      'voiceToTaskCreated',
      { task },
      {
        type: 'task',
        priority: 'normal',
        related_id: task.task_id
      }
    );
  }

  /**
   * Achievement notifications
   */
  static async notifyAchievementEarned(userId, achievement) {
    return this.createLocalizedNotification(
      userId,
      'achievementEarned',
      { achievement },
      {
        type: 'achievement',
        priority: 'high',
        related_id: achievement.achievement_id
      }
    );
  }

  static async notifyStreakMilestone(userId, streak) {
    return this.createLocalizedNotification(
      userId,
      'streakMilestone',
      { streak },
      {
        type: 'achievement',
        priority: 'high',
        related_id: streak.streak_id
      }
    );
  }

  /**
   * Focus session notifications
   */
  static async notifyFocusSessionCompleted(userId, session) {
    return this.createLocalizedNotification(
      userId,
      'focusSessionCompleted',
      { session },
      {
        type: 'general',
        priority: 'normal',
        related_id: session.session_id
      }
    );
  }

  /**
   * System notifications
   */
  static async notifyWelcome(userId, userName) {
    return this.createLocalizedNotification(
      userId,
      'welcome',
      { userName },
      {
        type: 'system',
        priority: 'normal'
      }
    );
  }

  static async notifyPasswordChanged(userId) {
    return this.createLocalizedNotification(
      userId,
      'passwordChanged',
      {},
      {
        type: 'system',
        priority: 'high'
      }
    );
  }

  static async notifyEmailVerified(userId) {
    return this.createLocalizedNotification(
      userId,
      'emailVerified',
      {},
      {
        type: 'system',
        priority: 'normal'
      }
    );
  }

  /**
   * Bulk notifications
   */
  static async createBulkNotifications(notifications) {
    try {
      const created = await Notification.bulkCreate(notifications);
      console.log(`📬 Created ${created.length} bulk notifications`);
      return created;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(userId) {
    try {
      const total = await NotificationModel.count(userId);
      const unread = await NotificationModel.getUnreadCount(userId);
      const read = total - unread;

      return {
        total,
        unread,
        read,
        unread_percentage: total > 0 ? Math.round((unread / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

export default NotificationService;
