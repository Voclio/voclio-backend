const pool = require('../config/database');

class SettingsModel {
  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  static async update(userId, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${index}`);
      values.push(updates[key]);
      index++;
    });

    values.push(userId);
    const result = await pool.query(
      `UPDATE user_settings 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $${index}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async updateTheme(userId, theme) {
    const result = await pool.query(
      `UPDATE user_settings 
       SET theme = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2
       RETURNING *`,
      [theme, userId]
    );
    return result.rows[0];
  }

  static async updateLanguage(userId, language) {
    const result = await pool.query(
      `UPDATE user_settings 
       SET language = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2
       RETURNING *`,
      [language, userId]
    );
    return result.rows[0];
  }

  static async updateTimezone(userId, timezone) {
    const result = await pool.query(
      `UPDATE user_settings 
       SET timezone = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2
       RETURNING *`,
      [timezone, userId]
    );
    return result.rows[0];
  }

  static async updateNotificationSettings(userId, settings) {
    const result = await pool.query(
      `UPDATE user_settings 
       SET email_enabled = COALESCE($1, email_enabled),
           whatsapp_enabled = COALESCE($2, whatsapp_enabled),
           push_enabled = COALESCE($3, push_enabled),
           email_for_reminders = COALESCE($4, email_for_reminders),
           email_for_tasks = COALESCE($5, email_for_tasks),
           whatsapp_for_reminders = COALESCE($6, whatsapp_for_reminders),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $7
       RETURNING *`,
      [
        settings.email_enabled,
        settings.whatsapp_enabled,
        settings.push_enabled,
        settings.email_for_reminders,
        settings.email_for_tasks,
        settings.whatsapp_for_reminders,
        userId
      ]
    );
    return result.rows[0];
  }
}

module.exports = SettingsModel;
