const pool = require('../config/database');

class ReminderModel {
  static async create(userId, reminderData) {
    const { task_id, reminder_time, reminder_type, notification_types } = reminderData;
    const result = await pool.query(
      `INSERT INTO reminders (user_id, task_id, reminder_time, reminder_type, notification_types) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, task_id, reminder_time, reminder_type || 'one_time', notification_types || ['push']]
    );
    return result.rows[0];
  }

  static async findAll(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM reminders 
       WHERE user_id = $1 
       ORDER BY reminder_time ASC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findById(reminderId, userId) {
    const result = await pool.query(
      'SELECT * FROM reminders WHERE reminder_id = $1 AND user_id = $2',
      [reminderId, userId]
    );
    return result.rows[0];
  }

  static async findUpcoming(userId) {
    const result = await pool.query(
      `SELECT * FROM reminders 
       WHERE user_id = $1 
       AND reminder_time > NOW() 
       AND is_dismissed = false
       ORDER BY reminder_time ASC 
       LIMIT 10`,
      [userId]
    );
    return result.rows;
  }

  static async update(reminderId, userId, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${index}`);
      values.push(updates[key]);
      index++;
    });

    values.push(reminderId, userId);
    const result = await pool.query(
      `UPDATE reminders 
       SET ${fields.join(', ')} 
       WHERE reminder_id = $${index} AND user_id = $${index + 1}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async snooze(reminderId, userId, snoozeMinutes) {
    const result = await pool.query(
      `UPDATE reminders 
       SET reminder_time = reminder_time + INTERVAL '${snoozeMinutes} minutes'
       WHERE reminder_id = $1 AND user_id = $2
       RETURNING *`,
      [reminderId, userId]
    );
    return result.rows[0];
  }

  static async dismiss(reminderId, userId) {
    const result = await pool.query(
      `UPDATE reminders 
       SET is_dismissed = true 
       WHERE reminder_id = $1 AND user_id = $2
       RETURNING *`,
      [reminderId, userId]
    );
    return result.rows[0];
  }

  static async delete(reminderId, userId) {
    const result = await pool.query(
      'DELETE FROM reminders WHERE reminder_id = $1 AND user_id = $2 RETURNING *',
      [reminderId, userId]
    );
    return result.rows[0];
  }

  static async count(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM reminders WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = ReminderModel;
