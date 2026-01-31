import NotificationModel from '../models/notification.model.js';
import { Notification } from '../models/orm/index.js';

class NotificationService {
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
        related_id = null
      } = notificationData;

      const notification = await NotificationModel.create(userId, {
        title,
        message,
        type,
        priority,
        related_id
      });

      console.log(`📬 Notification created for user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Task related notifications
   */
  static async notifyTaskCreated(userId, task) {
    return await this.createNotification(userId, {
      title: 'مهمة جديدة',
      message: `تم إنشاء مهمة جديدة: ${task.title}`,
      type: 'task',
      priority: task.priority === 'high' || task.priority === 'urgent' ? 'high' : 'normal',
      related_id: task.task_id
    });
  }

  static async notifyTaskUpdated(userId, task) {
    return await this.createNotification(userId, {
      title: 'تحديث مهمة',
      message: `تم تحديث المهمة: ${task.title}`,
      type: 'task',
      priority: 'normal',
      related_id: task.task_id
    });
  }

  static async notifyTaskCompleted(userId, task) {
    return await this.createNotification(userId, {
      title: '✅ مهمة مكتملة',
      message: `أحسنت! تم إكمال المهمة: ${task.title}`,
      type: 'task',
      priority: 'normal',
      related_id: task.task_id
    });
  }

  static async notifyTaskDueSoon(userId, task, hoursLeft) {
    return await this.createNotification(userId, {
      title: '⏰ موعد المهمة قريب',
      message: `المهمة "${task.title}" موعدها بعد ${hoursLeft} ساعة`,
      type: 'task',
      priority: 'high',
      related_id: task.task_id
    });
  }

  static async notifyTaskOverdue(userId, task) {
    return await this.createNotification(userId, {
      title: '⚠️ مهمة متأخرة',
      message: `المهمة "${task.title}" تجاوزت موعدها`,
      type: 'task',
      priority: 'urgent',
      related_id: task.task_id
    });
  }

  /**
   * Reminder notifications
   */
  static async notifyReminderTriggered(userId, reminder, task) {
    return await this.createNotification(userId, {
      title: '🔔 تذكير',
      message: task ? `تذكير بالمهمة: ${task.title}` : 'لديك تذكير',
      type: 'reminder',
      priority: 'high',
      related_id: reminder.reminder_id
    });
  }

  static async notifyReminderCreated(userId, reminder) {
    return await this.createNotification(userId, {
      title: 'تذكير جديد',
      message: `تم إنشاء تذكير جديد`,
      type: 'reminder',
      priority: 'normal',
      related_id: reminder.reminder_id
    });
  }

  /**
   * Note notifications
   */
  static async notifyNoteCreated(userId, note) {
    return await this.createNotification(userId, {
      title: '📝 ملاحظة جديدة',
      message: `تم إنشاء ملاحظة: ${note.title || 'بدون عنوان'}`,
      type: 'general',
      priority: 'normal',
      related_id: note.note_id
    });
  }

  /**
   * Voice recording notifications
   */
  static async notifyVoiceProcessed(userId, recording) {
    return await this.createNotification(userId, {
      title: '🎤 تم معالجة التسجيل الصوتي',
      message: 'تم تحويل التسجيل الصوتي إلى نص بنجاح',
      type: 'general',
      priority: 'normal',
      related_id: recording.recording_id
    });
  }

  static async notifyVoiceToTaskCreated(userId, task) {
    return await this.createNotification(userId, {
      title: '✨ تم إنشاء مهمة من الصوت',
      message: `تم إنشاء المهمة: ${task.title}`,
      type: 'task',
      priority: 'normal',
      related_id: task.task_id
    });
  }

  /**
   * Achievement notifications
   */
  static async notifyAchievementEarned(userId, achievement) {
    return await this.createNotification(userId, {
      title: '🏆 إنجاز جديد!',
      message: `تهانينا! حصلت على: ${achievement.title}`,
      type: 'achievement',
      priority: 'high',
      related_id: achievement.achievement_id
    });
  }

  static async notifyStreakMilestone(userId, streak) {
    return await this.createNotification(userId, {
      title: '🔥 سلسلة إنجازات!',
      message: `رائع! وصلت إلى ${streak.current_streak} يوم متتالي`,
      type: 'achievement',
      priority: 'high',
      related_id: streak.streak_id
    });
  }

  /**
   * Focus session notifications
   */
  static async notifyFocusSessionCompleted(userId, session) {
    return await this.createNotification(userId, {
      title: '⏱️ جلسة تركيز مكتملة',
      message: `أحسنت! أكملت جلسة تركيز لمدة ${Math.floor(session.timer_duration / 60)} دقيقة`,
      type: 'general',
      priority: 'normal',
      related_id: session.session_id
    });
  }

  /**
   * System notifications
   */
  static async notifyWelcome(userId, userName) {
    return await this.createNotification(userId, {
      title: '👋 مرحباً بك في Voclio',
      message: `أهلاً ${userName}! نحن سعداء بانضمامك`,
      type: 'system',
      priority: 'normal'
    });
  }

  static async notifyPasswordChanged(userId) {
    return await this.createNotification(userId, {
      title: '🔒 تم تغيير كلمة المرور',
      message: 'تم تغيير كلمة المرور الخاصة بك بنجاح',
      type: 'system',
      priority: 'high'
    });
  }

  static async notifyEmailVerified(userId) {
    return await this.createNotification(userId, {
      title: '✅ تم تأكيد البريد الإلكتروني',
      message: 'تم تأكيد بريدك الإلكتروني بنجاح',
      type: 'system',
      priority: 'normal'
    });
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
