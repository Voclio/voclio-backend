const pool = require('../config/database');

class NotificationModel {
  static async create(userId, notificationData) {
    const { title, message, type, priority, related_id } = notificationData;
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, related_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, title, message, type || 'general', priority || 'normal', related_id || null]
    );
    return result.rows[0];
  }

  static async findAll(userId, options = {}) {
    const { page = 1, limit = 20, is_read } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];

    if (is_read !== undefined) {
      params.push(is_read);
      query += ` AND is_read = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(notificationId, userId) {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE notification_id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    return result.rows[0];
  }

  static async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  static async delete(notificationId, userId) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return result.rows[0];
  }

  static async count(userId, is_read) {
    let query = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    const params = [userId];

    if (is_read !== undefined) {
      params.push(is_read);
      query += ` AND is_read = $${params.length}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  static async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = NotificationModel;
