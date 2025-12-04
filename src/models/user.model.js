const pool = require('../config/database');

class UserModel {
  static async create(userData) {
    const { email, password, name, phone_number } = userData;
    const result = await pool.query(
      `INSERT INTO users (email, password, name, phone_number) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, email, name, phone_number, created_at`,
      [email, password, name, phone_number || null]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(userId) {
    const result = await pool.query(
      'SELECT user_id, email, name, phone_number, subscription_tier, is_active, created_at FROM users WHERE user_id = $1',
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
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $${index} 
       RETURNING user_id, email, name, phone_number, subscription_tier`,
      values
    );
    return result.rows[0];
  }

  static async updatePassword(userId, hashedPassword) {
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [hashedPassword, userId]
    );
  }

  static async delete(userId) {
    await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
  }

  static async createDefaultSettings(userId) {
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [userId]
    );
  }
}

module.exports = UserModel;
