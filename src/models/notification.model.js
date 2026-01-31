import { Notification } from './orm/index.js';

class NotificationModel {
  static async create(userId, notificationData) {
    const notification = await Notification.create({
      user_id: userId,
      type: notificationData.type || 'general',
      ...notificationData
    });
    return notification.toJSON();
  }

  static async findAll(userId, options = {}) {
    const { page = 1, limit = 20, is_read } = options;
    const offset = (page - 1) * limit;

    const where = { user_id: userId };
    if (is_read !== undefined) {
      where.is_read = is_read;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    return notifications.map(n => n.toJSON());
  }

  static async findById(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { notification_id: notificationId, user_id: userId }
    });
    return notification ? notification.toJSON() : null;
  }

  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { notification_id: notificationId, user_id: userId }
    });
    
    if (!notification) return null;
    
    await notification.update({ is_read: true });
    return notification.toJSON();
  }

  static async markAllAsRead(userId) {
    await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
  }

  static async delete(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { notification_id: notificationId, user_id: userId }
    });
    
    if (!notification) return null;
    
    const notificationData = notification.toJSON();
    await notification.destroy();
    return notificationData;
  }

  static async count(userId, is_read) {
    const where = { user_id: userId };
    if (is_read !== undefined) {
      where.is_read = is_read;
    }
    
    return await Notification.count({ where });
  }

  static async getUnreadCount(userId) {
    return await Notification.count({
      where: { user_id: userId, is_read: false }
    });
  }
}

export default NotificationModel;
