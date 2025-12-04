const pool = require('../config/database');

class ProductivityModel {
  static async createFocusSession(userId, sessionData) {
    const { timer_duration, ambient_sound, sound_volume } = sessionData;
    const result = await pool.query(
      `INSERT INTO focus_sessions (user_id, timer_duration, ambient_sound, sound_volume, status) 
       VALUES ($1, $2, $3, $4, 'active') 
       RETURNING *`,
      [userId, timer_duration || 25, ambient_sound || null, sound_volume || 50]
    );
    return result.rows[0];
  }

  static async updateFocusSession(sessionId, userId, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${index}`);
      values.push(updates[key]);
      index++;
    });

    values.push(sessionId, userId);
    const result = await pool.query(
      `UPDATE focus_sessions 
       SET ${fields.join(', ')} 
       WHERE session_id = $${index} AND user_id = $${index + 1}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async endFocusSession(sessionId, userId) {
    const result = await pool.query(
      `UPDATE focus_sessions 
       SET status = 'completed', end_time = CURRENT_TIMESTAMP 
       WHERE session_id = $1 AND user_id = $2
       RETURNING *`,
      [sessionId, userId]
    );
    return result.rows[0];
  }

  static async findFocusSessions(userId, options = {}) {
    const { page = 1, limit = 20, start_date, end_date } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM focus_sessions WHERE user_id = $1';
    const params = [userId];

    if (start_date) {
      params.push(start_date);
      query += ` AND DATE(start_time) >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND DATE(start_time) <= $${params.length}`;
    }

    query += ` ORDER BY start_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getStreak(userId) {
    const result = await pool.query(
      `SELECT * FROM productivity_streaks 
       WHERE user_id = $1 
       ORDER BY streak_date DESC 
       LIMIT 1`,
      [userId]
    );
    return result.rows[0];
  }

  static async updateStreak(userId) {
    // Check if there's activity today
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `INSERT INTO productivity_streaks (user_id, streak_date, current_streak, longest_streak)
       VALUES ($1, $2, 1, 1)
       ON CONFLICT (user_id, streak_date)
       DO UPDATE SET current_streak = productivity_streaks.current_streak + 1
       RETURNING *`,
      [userId, today]
    );
    return result.rows[0];
  }

  static async getAchievements(userId) {
    const result = await pool.query(
      `SELECT * FROM achievements 
       WHERE user_id = $1 
       ORDER BY earned_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async createAchievement(userId, achievementData) {
    const { title, description, icon } = achievementData;
    const result = await pool.query(
      `INSERT INTO achievements (user_id, title, description, icon) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, title, description, icon || null]
    );
    return result.rows[0];
  }

  static async getProductivitySummary(userId, startDate, endDate) {
    const result = await pool.query(
      `SELECT 
         COUNT(DISTINCT DATE(fs.start_time)) as focus_days,
         SUM(fs.elapsed_time) as total_focus_minutes,
         COUNT(fs.session_id) as total_sessions,
         AVG(fs.elapsed_time) as avg_session_minutes,
         (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'completed' 
          AND DATE(completed_at) BETWEEN $2 AND $3) as tasks_completed,
         (SELECT current_streak FROM productivity_streaks WHERE user_id = $1 
          ORDER BY streak_date DESC LIMIT 1) as current_streak
       FROM focus_sessions fs
       WHERE fs.user_id = $1 
       AND DATE(fs.start_time) BETWEEN $2 AND $3`,
      [userId, startDate, endDate]
    );
    return result.rows[0];
  }
}

module.exports = ProductivityModel;
