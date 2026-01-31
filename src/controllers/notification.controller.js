import NotificationModel from '../models/notification.model.js';
import { successResponse, paginatedResponse } from '../utils/responses.js';
import { NotFoundError } from '../utils/errors.js';
class NotificationController {
  static async getAllNotifications(req, res, next) {
    try {
      const { page = 1, limit = 20, is_read } = req.query;

      const notifications = await NotificationModel.findAll(req.user.user_id, {
        page: parseInt(page),
        limit: parseInt(limit),
        is_read: is_read !== undefined ? is_read === 'true' : undefined
      });

      const total = await NotificationModel.count(req.user.user_id, 
        is_read !== undefined ? is_read === 'true' : undefined
      );

      const unreadCount = await NotificationModel.getUnreadCount(req.user.user_id);

      return paginatedResponse(res, notifications, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        unread_count: unreadCount
      });

    } catch (error) {
      next(error);
    }
  }

  static async getNotificationById(req, res, next) {
    try {
      const notification = await NotificationModel.findById(req.params.id, req.user.user_id);

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      return successResponse(res, { notification });

    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const notification = await NotificationModel.markAsRead(req.params.id, req.user.user_id);

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      return successResponse(res, { notification }, 'Notification marked as read');

    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      await NotificationModel.markAllAsRead(req.user.user_id);

      return successResponse(res, null, 'All notifications marked as read');

    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req, res, next) {
    try {
      const notification = await NotificationModel.delete(req.params.id, req.user.user_id);

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      return successResponse(res, null, 'Notification deleted successfully');

    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationModel.getUnreadCount(req.user.user_id);

      return successResponse(res, { unread_count: count });

    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
