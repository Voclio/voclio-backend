const pool = require('../config/database');

class SessionModel {
  static async create(userId, refreshToken, expiresAt) {
    const result = await pool.query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at) 
       VALUES ($1, $2, $3) 
       RETURNING session_id, refresh_token`,
      [userId, refreshToken, expiresAt]
    );
    return result.rows[0];
  }

  static async findByRefreshToken(refreshToken) {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE refresh_token = $1',
      [refreshToken]
    );
    return result.rows[0];
  }

  static async invalidate(refreshToken) {
    await pool.query(
      'DELETE FROM sessions WHERE refresh_token = $1',
      [refreshToken]
    );
  }

  static async invalidateAllUserSessions(userId) {
    await pool.query(
      'DELETE FROM sessions WHERE user_id = $1',
      [userId]
    );
  }
}

module.exports = SessionModel;
