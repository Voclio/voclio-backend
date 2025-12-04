const UserModel = require('../models/user.model');
const NoteModel = require('../models/note.model');
const TaskModel = require('../models/task.model');
const VoiceModel = require('../models/voice.model');
const pool = require('../config/database');
const { successResponse, paginatedResponse } = require('../utils/responses');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

class AdminController {
  // Get all users with stats
  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          u.user_id, u.email, u.name, u.phone_number, 
          u.is_active, u.email_verified, u.is_admin,
          u.created_at, u.updated_at,
          COUNT(DISTINCT n.note_id) as notes_count,
          COUNT(DISTINCT t.task_id) as tasks_count,
          COUNT(DISTINCT v.recording_id) as recordings_count
        FROM users u
        LEFT JOIN notes n ON u.user_id = n.user_id
        LEFT JOIN tasks t ON u.user_id = t.user_id
        LEFT JOIN voice_recordings v ON u.user_id = v.user_id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` GROUP BY u.user_id ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users WHERE 
         ($1 = '' OR email ILIKE $1 OR name ILIKE $1)`,
        [search ? `%${search}%` : '']
      );

      return paginatedResponse(res, result.rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user details with full activity
  static async getUserDetails(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get user statistics
      const stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM notes WHERE user_id = $1) as total_notes,
          (SELECT COUNT(*) FROM tasks WHERE user_id = $1) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'completed') as completed_tasks,
          (SELECT COUNT(*) FROM voice_recordings WHERE user_id = $1) as total_recordings,
          (SELECT COUNT(*) FROM reminders WHERE user_id = $1) as total_reminders,
          (SELECT COUNT(*) FROM tags WHERE user_id = $1) as total_tags,
          (SELECT COUNT(*) FROM focus_sessions WHERE user_id = $1) as focus_sessions,
          (SELECT COALESCE(SUM(actual_duration), 0) FROM focus_sessions WHERE user_id = $1) as total_focus_time
      `, [userId]);

      // Get recent activity
      const recentNotes = await pool.query(
        'SELECT note_id, title, created_at FROM notes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [userId]
      );

      const recentTasks = await pool.query(
        'SELECT task_id, title, status, created_at FROM tasks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [userId]
      );

      return successResponse(res, {
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          phone_number: user.phone_number,
          is_active: user.is_active,
          email_verified: user.email_verified,
          is_admin: user.is_admin,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        statistics: stats.rows[0],
        recent_activity: {
          notes: recentNotes.rows,
          tasks: recentTasks.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get AI usage statistics
  static async getAIUsageStats(req, res, next) {
    try {
      const { startDate, endDate, userId } = req.query;

      let query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE summary IS NOT NULL) as summarizations,
          COUNT(*) as total_ai_requests
        FROM notes
        WHERE summary IS NOT NULL
      `;

      const params = [];
      let paramIndex = 1;

      if (startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      query += ` GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`;

      const dailyStats = await pool.query(query, params);

      // Get total AI operations
      const totals = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE summary IS NOT NULL) as total_summarizations,
          COUNT(DISTINCT user_id) FILTER (WHERE summary IS NOT NULL) as active_ai_users,
          COUNT(*) FILTER (WHERE transcription_text IS NOT NULL) as total_transcriptions
        FROM notes
        WHERE ($1::date IS NULL OR created_at >= $1)
          AND ($2::date IS NULL OR created_at <= $2)
          AND ($3::integer IS NULL OR user_id = $3)
      `, [startDate || null, endDate || null, userId || null]);

      // Estimate token usage (rough estimation)
      const tokenEstimate = await pool.query(`
        SELECT 
          SUM(LENGTH(content) / 4) as estimated_input_tokens,
          SUM(LENGTH(summary) / 4) as estimated_output_tokens
        FROM notes
        WHERE summary IS NOT NULL
          AND ($1::date IS NULL OR created_at >= $1)
          AND ($2::date IS NULL OR created_at <= $2)
          AND ($3::integer IS NULL OR user_id = $3)
      `, [startDate || null, endDate || null, userId || null]);

      return successResponse(res, {
        daily_stats: dailyStats.rows,
        totals: totals.rows[0],
        token_estimate: {
          input_tokens: parseInt(tokenEstimate.rows[0].estimated_input_tokens || 0),
          output_tokens: parseInt(tokenEstimate.rows[0].estimated_output_tokens || 0),
          total_tokens: parseInt(tokenEstimate.rows[0].estimated_input_tokens || 0) + 
                       parseInt(tokenEstimate.rows[0].estimated_output_tokens || 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get system analytics
  static async getSystemAnalytics(req, res, next) {
    try {
      const analytics = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
          (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
          (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month,
          (SELECT COUNT(*) FROM notes) as total_notes,
          (SELECT COUNT(*) FROM tasks) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
          (SELECT COUNT(*) FROM voice_recordings) as total_recordings,
          (SELECT COUNT(*) FROM reminders) as total_reminders,
          (SELECT COUNT(*) FROM focus_sessions) as total_focus_sessions,
          (SELECT COUNT(*) FROM users WHERE is_admin = true) as admin_users
      `);

      // Get daily user registrations (last 30 days)
      const registrations = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as registrations
        FROM users
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      // Get most active users
      const activeUsers = await pool.query(`
        SELECT 
          u.user_id, u.email, u.name,
          COUNT(n.note_id) as notes_count,
          COUNT(t.task_id) as tasks_count,
          COUNT(v.recording_id) as recordings_count
        FROM users u
        LEFT JOIN notes n ON u.user_id = n.user_id
        LEFT JOIN tasks t ON u.user_id = t.user_id
        LEFT JOIN voice_recordings v ON u.user_id = v.user_id
        GROUP BY u.user_id
        ORDER BY (COUNT(n.note_id) + COUNT(t.task_id) + COUNT(v.recording_id)) DESC
        LIMIT 10
      `);

      return successResponse(res, {
        overview: analytics.rows[0],
        daily_registrations: registrations.rows,
        most_active_users: activeUsers.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user status (activate/deactivate)
  static async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { is_active } = req.body;

      const result = await pool.query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
        [is_active, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      return successResponse(res, result.rows[0], 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Subscription management removed

  // Delete user (soft delete)
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      await UserModel.delete(userId);

      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get content statistics
  static async getContentStats(req, res, next) {
    try {
      const stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM notes WHERE created_at > NOW() - INTERVAL '24 hours') as notes_today,
          (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '24 hours') as tasks_today,
          (SELECT COUNT(*) FROM voice_recordings WHERE created_at > NOW() - INTERVAL '24 hours') as recordings_today,
          (SELECT AVG(LENGTH(content)) FROM notes) as avg_note_length,
          (SELECT AVG(file_size) FROM voice_recordings) as avg_recording_size,
          (SELECT SUM(file_size) FROM voice_recordings) as total_storage_used
      `);

      // Get popular tags
      const popularTags = await pool.query(`
        SELECT name, usage_count
        FROM tags
        ORDER BY usage_count DESC
        LIMIT 10
      `);

      return successResponse(res, {
        statistics: stats.rows[0],
        popular_tags: popularTags.rows
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
