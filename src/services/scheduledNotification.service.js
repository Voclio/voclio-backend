import { Op } from 'sequelize';
import NotificationTemplateService from './notificationTemplate.service.js';
import NotificationService from './notification.service.js';
import { ScheduledNotification } from '../models/orm/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function computeNextRunAt(fromDate, recurrence) {
  const next = new Date(fromDate);
  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      return next;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      return next;
    case 'once':
    default:
      return null;
  }
}

class ScheduledNotificationService {
  static async listScheduled() {
    const rows = await ScheduledNotification.findAll({
      order: [['next_run_at', 'ASC']],
      limit: 100
    });
    return rows.map(row => row.toJSON());
  }

  static async createScheduled(payload, adminId) {
    const {
      name,
      template_key: templateKey = null,
      title = null,
      message = null,
      notification_type: notificationType = 'system',
      priority = 'normal',
      audience = 'all_active',
      target_user_id: targetUserId = null,
      recurrence = 'once',
      scheduled_at: scheduledAtInput,
      send_push: sendPush = true
    } = payload;

    if (!name?.trim()) {
      throw new ValidationError('Campaign name is required');
    }

    if (!templateKey && (!title?.trim() || !message?.trim())) {
      throw new ValidationError('Provide a template or both title and message');
    }

    if (templateKey) {
      const defaults = NotificationTemplateService.getTemplateDefaults(templateKey);
      if (!defaults) {
        throw new ValidationError('Unknown template key');
      }
    }

    const scheduledAt = scheduledAtInput ? new Date(scheduledAtInput) : new Date();
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new ValidationError('Invalid scheduled_at');
    }

    const row = await ScheduledNotification.create({
      name: name.trim(),
      template_key: templateKey,
      title: title?.trim() || null,
      message: message?.trim() || null,
      notification_type: notificationType,
      priority,
      audience,
      target_user_id: targetUserId,
      recurrence,
      scheduled_at: scheduledAt,
      next_run_at: scheduledAt,
      send_push: sendPush !== false,
      created_by: adminId
    });

    return row.toJSON();
  }

  static async updateScheduled(id, updates) {
    const row = await ScheduledNotification.findByPk(id);
    if (!row) {
      throw new NotFoundError('Scheduled notification not found');
    }

    const patch = {};
    if (typeof updates.is_active === 'boolean') patch.is_active = updates.is_active;
    if (updates.name?.trim()) patch.name = updates.name.trim();
    if (updates.scheduled_at) {
      const scheduledAt = new Date(updates.scheduled_at);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new ValidationError('Invalid scheduled_at');
      }
      patch.scheduled_at = scheduledAt;
      patch.next_run_at = scheduledAt;
    }

    await row.update(patch);
    return row.toJSON();
  }

  static async deleteScheduled(id) {
    const row = await ScheduledNotification.findByPk(id);
    if (!row) {
      throw new NotFoundError('Scheduled notification not found');
    }
    await row.destroy();
    return { deleted: true };
  }

  static async processDue(limit = 20) {
    const dueRows = await ScheduledNotification.findAll({
      where: {
        is_active: true,
        next_run_at: { [Op.lte]: new Date() }
      },
      order: [['next_run_at', 'ASC']],
      limit
    });

    let processed = 0;
    for (const row of dueRows) {
      await this.processOne(row);
      processed++;
    }
    return processed;
  }

  static async processOne(row) {
    try {
      const audience = row.audience || 'all_active';
      const users = await NotificationTemplateService.resolveAudienceUsers(
        audience,
        row.target_user_id
      );

      let pushSent = 0;
      let pushFailed = 0;
      let created = 0;

      for (const user of users) {
        let title = row.title;
        let message = row.message;
        let relatedId = null;

        if (row.template_key) {
          const templateData = await NotificationTemplateService.buildTemplateData(user.user_id);
          const copy = await NotificationTemplateService.resolveCopyForUser(
            user.user_id,
            row.template_key
          );
          title = copy.title;
          message = copy.message;
          relatedId = await NotificationTemplateService.resolveRelatedId(
            user.user_id,
            row.template_key,
            templateData
          );
        }

        const result = await NotificationService.createNotification(user.user_id, {
          title,
          message,
          type: row.notification_type,
          priority: row.priority,
          related_id: relatedId,
          bypassPushPreference: true,
          skipPush: row.send_push === false
        });

        if (result?.notification_id) {
          created++;
          if (result.push_delivery?.sent > 0) pushSent += result.push_delivery.sent;
          else if (row.send_push !== false && result.push_delivery) pushFailed++;
        }
      }

      const nextRunAt = computeNextRunAt(row.next_run_at, row.recurrence);
      await row.update({
        last_run_at: new Date(),
        run_count: (row.run_count || 0) + 1,
        next_run_at: nextRunAt ?? row.next_run_at,
        is_active: nextRunAt ? row.is_active : false
      });

      logger.info('Scheduled notification processed', {
        id: row.scheduled_notification_id,
        name: row.name,
        recipients: users.length,
        created,
        pushSent,
        pushFailed
      });
    } catch (error) {
      logger.error('Failed to process scheduled notification', {
        id: row.scheduled_notification_id,
        error: error.message
      });
    }
  }
}

export default ScheduledNotificationService;
