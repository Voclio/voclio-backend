import AdminNotificationsService from '../services/adminNotifications.service.js';
import AdminActivityService from '../services/adminActivity.service.js';
import { successResponse } from '../utils/responses.js';
import { ValidationError } from '../utils/errors.js';
import { validationResult } from 'express-validator';

class AdminNotificationsController {
  static async getStats(req, res, next) {
    try {
      const stats = await AdminNotificationsService.getStats();
      return successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async listTemplates(req, res, next) {
    try {
      const locale = req.query.locale?.toString() || 'en';
      const templates = AdminNotificationsService.listTemplates(locale);
      return successResponse(res, { templates });
    } catch (error) {
      next(error);
    }
  }

  static async listScheduled(req, res, next) {
    try {
      const scheduled = await AdminNotificationsService.listScheduled();
      return successResponse(res, { scheduled });
    } catch (error) {
      next(error);
    }
  }

  static async createScheduled(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors.array()[0]?.msg || 'Invalid request');
      }

      const scheduled = await AdminNotificationsService.createScheduled(req.body, req.user.user_id);
      await AdminActivityService.log({
        activityType: 'admin_notification_scheduled',
        activityCategory: 'admin',
        severity: 'info',
        adminId: req.user.user_id,
        ipAddress: req.ip,
        details: {
          name: scheduled.name,
          template_key: scheduled.template_key,
          recurrence: scheduled.recurrence
        }
      });
      return successResponse(res, scheduled, 'Scheduled notification created');
    } catch (error) {
      next(error);
    }
  }

  static async createPresetCampaigns(req, res, next) {
    try {
      const created = await AdminNotificationsService.createPresetCampaigns(req.user.user_id);
      return successResponse(res, { created }, 'Preset campaigns enabled');
    } catch (error) {
      next(error);
    }
  }

  static async updateScheduled(req, res, next) {
    try {
      const scheduled = await AdminNotificationsService.updateScheduled(
        Number(req.params.id),
        req.body
      );
      return successResponse(res, scheduled, 'Scheduled notification updated');
    } catch (error) {
      next(error);
    }
  }

  static async deleteScheduled(req, res, next) {
    try {
      const result = await AdminNotificationsService.deleteScheduled(Number(req.params.id));
      return successResponse(res, result, 'Scheduled notification deleted');
    } catch (error) {
      next(error);
    }
  }

  static async listRecipients(req, res, next) {
    try {
      const search = req.query.search?.toString() || '';
      const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
      const recipients = await AdminNotificationsService.listRecipients({ search, limit });
      return successResponse(res, { recipients });
    } catch (error) {
      next(error);
    }
  }

  static async sendNotification(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors.array()[0]?.msg || 'Invalid request');
      }

      const {
        user_id: userId = null,
        email = null,
        broadcast = false,
        audience = null,
        template_key: templateKey = null,
        title,
        message,
        type = 'system',
        priority = 'normal',
        send_push: sendPush = true
      } = req.body;

      const result = await AdminNotificationsService.sendNotification({
        userId,
        email,
        broadcast: Boolean(broadcast),
        audience,
        templateKey,
        title,
        message,
        type,
        priority,
        sendPush: sendPush !== false
      });

      await AdminActivityService.log({
        activityType: 'admin_notification_sent',
        activityCategory: 'admin',
        severity: 'info',
        adminId: req.user.user_id,
        ipAddress: req.ip,
        details: {
          title: title || templateKey,
          template_key: templateKey,
          broadcast: Boolean(broadcast),
          audience,
          recipients: result.recipients,
          notifications_created: result.notifications_created,
          push_sent: result.push_sent
        }
      });

      return successResponse(res, result, 'Notification sent successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default AdminNotificationsController;
