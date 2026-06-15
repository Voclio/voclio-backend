import { Op } from 'sequelize';
import { User, DeviceToken } from '../models/orm/index.js';
import NotificationService from './notification.service.js';
import PushNotificationService from './pushNotification.service.js';
import NotificationTemplateService from './notificationTemplate.service.js';
import ScheduledNotificationService from './scheduledNotification.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

class AdminNotificationsService {
  static listTemplates(lang = 'en') {
    return NotificationTemplateService.listTemplates(lang);
  }

  static listScheduled() {
    return ScheduledNotificationService.listScheduled();
  }

  static createScheduled(payload, adminId) {
    return ScheduledNotificationService.createScheduled(payload, adminId);
  }

  static updateScheduled(id, updates) {
    return ScheduledNotificationService.updateScheduled(id, updates);
  }

  static deleteScheduled(id) {
    return ScheduledNotificationService.deleteScheduled(id);
  }

  static async createPresetCampaigns(adminId) {
    const presets = NotificationTemplateService.listTemplates('en').filter(entry =>
      ['engagementMorningMotivation', 'engagementPendingTasks', 'engagementWeeklyDigest', 'reminderTasksDueToday'].includes(
        entry.key
      )
    );

    const created = [];
    for (const preset of presets) {
      const scheduledAt = new Date();
      const [hours, minutes] = (preset.suggestedTime || '09:00').split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);
      if (scheduledAt <= new Date()) {
        scheduledAt.setDate(scheduledAt.getDate() + 1);
      }

      const row = await ScheduledNotificationService.createScheduled(
        {
          name: preset.label,
          template_key: preset.key,
          notification_type: preset.notificationType,
          priority: preset.priority,
          audience: preset.audience,
          recurrence: preset.suggestedRecurrence === 'once' ? 'daily' : preset.suggestedRecurrence,
          scheduled_at: scheduledAt.toISOString(),
          send_push: true
        },
        adminId
      );
      created.push(row);
    }

    return created;
  }
  static async getStats() {
    const [deviceTokens, usersWithTokens, activeUsers] = await Promise.all([
      DeviceToken.count(),
      DeviceToken.count({ distinct: true, col: 'user_id' }),
      User.count({ where: { is_active: true } })
    ]);

    return {
      push_configured: PushNotificationService.isConfigured(),
      device_tokens: deviceTokens,
      users_with_tokens: usersWithTokens,
      active_users: activeUsers
    };
  }

  static async listRecipients({ search = '', limit = 50 } = {}) {
    const where = { is_active: true };
    if (search.trim()) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search.trim()}%` } },
        { name: { [Op.iLike]: `%${search.trim()}%` } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: ['user_id', 'email', 'name', 'is_active'],
      order: [['user_id', 'DESC']],
      limit: Math.min(limit, 100),
      include: [
        {
          model: DeviceToken,
          as: 'deviceTokens',
          attributes: ['device_token_id', 'platform', 'updated_at'],
          required: false
        }
      ]
    });

    return users.map(user => {
      const row = user.toJSON();
      return {
        user_id: row.user_id,
        email: row.email,
        name: row.name,
        is_active: row.is_active,
        device_tokens: row.deviceTokens?.length ?? 0,
        platforms: [...new Set((row.deviceTokens ?? []).map(token => token.platform))]
      };
    });
  }

  static async resolveTargetUsers({ userId, email, broadcast }) {
    if (broadcast) {
      return User.findAll({
        where: { is_active: true },
        attributes: ['user_id', 'email', 'name']
      });
    }

    if (userId) {
      const user = await User.findByPk(userId, {
        attributes: ['user_id', 'email', 'name', 'is_active']
      });
      if (!user) {
        throw new NotFoundError('User not found');
      }
      if (!user.is_active) {
        throw new ValidationError('User is inactive');
      }
      return [user];
    }

    if (email) {
      const user = await User.findOne({
        where: { email: email.trim().toLowerCase() },
        attributes: ['user_id', 'email', 'name', 'is_active']
      });
      if (!user) {
        throw new NotFoundError('User not found');
      }
      if (!user.is_active) {
        throw new ValidationError('User is inactive');
      }
      return [user];
    }

    throw new ValidationError('Provide user_id, email, or set broadcast to true');
  }

  static async sendNotification({
    userId = null,
    email = null,
    broadcast = false,
    audience = null,
    templateKey = null,
    title,
    message,
    type = 'system',
    priority = 'normal',
    sendPush = true
  }) {
    const templateDefaults = templateKey
      ? NotificationTemplateService.getTemplateDefaults(templateKey)
      : null;

    if (templateKey && !templateDefaults) {
      throw new ValidationError('Unknown template key');
    }

    if (!templateKey && (!title?.trim() || !message?.trim())) {
      throw new ValidationError('Title and message are required when no template is selected');
    }

    let users;
    if (audience && audience !== 'single_user') {
      users = await NotificationTemplateService.resolveAudienceUsers(audience, userId);
    } else {
      users = await this.resolveTargetUsers({ userId, email, broadcast });
    }

    if (!users.length) {
      throw new ValidationError('No recipients found');
    }

    const notificationType = templateDefaults?.notificationType ?? type;
    const notificationPriority = templateDefaults?.priority ?? priority;

    const results = [];
    let pushSent = 0;
    let pushFailed = 0;

    for (const user of users) {
      let resolvedTitle = title?.trim();
      let resolvedMessage = message?.trim();
      let relatedId = null;

      if (templateKey) {
        const templateData = await NotificationTemplateService.buildTemplateData(user.user_id);
        const copy = await NotificationTemplateService.resolveCopyForUser(
          user.user_id,
          templateKey
        );
        resolvedTitle = copy.title;
        resolvedMessage = copy.message;
        relatedId = await NotificationTemplateService.resolveRelatedId(
          user.user_id,
          templateKey,
          templateData
        );
      }

      const notification = await NotificationService.createNotification(user.user_id, {
        title: resolvedTitle,
        message: resolvedMessage,
        type: notificationType,
        priority: notificationPriority,
        related_id: relatedId,
        bypassPushPreference: true,
        skipPush: !sendPush
      });

      if (!notification || notification.status === 'skipped') {
        results.push({
          user_id: user.user_id,
          email: user.email,
          status: 'skipped'
        });
        continue;
      }

      const pushDelivery = notification.push_delivery;
      if (sendPush) {
        if (pushDelivery?.sent > 0) {
          pushSent += pushDelivery.sent;
        } else if (pushDelivery && !pushDelivery.skipped) {
          pushFailed += 1;
        } else if (pushDelivery?.skipped && pushDelivery.reason === 'no_device_tokens') {
          pushFailed += 1;
        }
      }

      results.push({
        user_id: user.user_id,
        email: user.email,
        notification_id: notification.notification_id,
        push_delivery: pushDelivery
      });
    }

    return {
      recipients: users.length,
      notifications_created: results.filter(item => item.notification_id).length,
      push_sent: pushSent,
      push_failed: pushFailed,
      results
    };
  }
}

export default AdminNotificationsService;
