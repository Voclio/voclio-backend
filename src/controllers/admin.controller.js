import UserModel from '../models/user.model.js';
import { User, Note, Task, VoiceRecording, Reminder, Tag, FocusSession, Achievement, Category, Notification, Session, sequelize } from '../models/orm/index.js';
import { successResponse, paginatedResponse } from '../utils/responses.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { Op } from 'sequelize';

class AdminController {
  // ==================== USER MANAGEMENT ====================
  
  // Get all users with stats
  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search = '', status = 'all', sortBy = 'created_at', order = 'DESC' } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (search) {
        where[Op.or] = [
          { email: { [Op.iLike]: `%${search}%` } },
          { name: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status === 'active') where.is_active = true;
      if (status === 'inactive') where.is_active = false;
      if (status === 'admin') where.is_admin = true;

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: [
          'user_id', 'email', 'name', 'phone_number',
          'is_active', 'email_verified', 'is_admin', 'oauth_provider',
          'created_at', 'updated_at',
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('notes.note_id'))), 'notes_count'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('tasks.task_id'))), 'tasks_count'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('recordings.recording_id'))), 'recordings_count']
        ],
        include: [
          { model: Note, as: 'notes', attributes: [], required: false },
          { model: Task, as: 'tasks', attributes: [], required: false },
          { model: VoiceRecording, as: 'recordings', attributes: [], required: false }
        ],
        group: ['User.user_id'],
        order: [[sortBy, order]],
        limit,
        offset,
        subQuery: false
      });

      return paginatedResponse(res, rows.map(u => u.toJSON()), {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count.length
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
      const totalNotes = await Note.count({ where: { user_id: userId } });
      const totalTasks = await Task.count({ where: { user_id: userId } });
      const completedTasks = await Task.count({ where: { user_id: userId, status: 'completed' } });
      const totalRecordings = await VoiceRecording.count({ where: { user_id: userId } });
      const totalReminders = await Reminder.count({ where: { user_id: userId } });
      const totalTags = await Tag.count({ where: { user_id: userId } });
      const totalCategories = await Category.count({ where: { user_id: userId } });
      const focusSessions = await FocusSession.count({ where: { user_id: userId } });
      const totalFocusTime = await FocusSession.sum('elapsed_time', { where: { user_id: userId } }) || 0;
      const activeSessions = await Session.count({ where: { user_id: userId } });

      // Get recent activity
      const recentNotes = await Note.findAll({
        where: { user_id: userId },
        attributes: ['note_id', 'title', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 5,
        raw: true
      });

      const recentTasks = await Task.findAll({
        where: { user_id: userId },
        attributes: ['task_id', 'title', 'status', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 5,
        raw: true
      });

      const recentRecordings = await VoiceRecording.findAll({
        where: { user_id: userId },
        attributes: ['recording_id', 'file_size', 'format', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 5,
        raw: true
      });

      return successResponse(res, {
        user,
        statistics: {
          total_notes: totalNotes,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          total_recordings: totalRecordings,
          total_reminders: totalReminders,
          total_tags: totalTags,
          total_categories: totalCategories,
          focus_sessions: focusSessions,
          total_focus_time: parseInt(totalFocusTime),
          active_sessions: activeSessions
        },
        recent_activity: {
          notes: recentNotes,
          tasks: recentTasks,
          recordings: recentRecordings
        }
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

      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.update({ is_active });
      return successResponse(res, user.toJSON(), 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Update user role (make admin/remove admin)
  static async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { is_admin } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Prevent removing admin from yourself
      if (req.user.user_id === parseInt(userId) && is_admin === false) {
        throw new ValidationError('Cannot remove admin role from yourself');
      }

      await user.update({ is_admin });
      return successResponse(res, user.toJSON(), 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Delete user
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      // Prevent deleting yourself
      if (req.user.user_id === parseInt(userId)) {
        throw new ValidationError('Cannot delete your own account');
      }

      await UserModel.delete(userId);
      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Bulk delete users
  static async bulkDeleteUsers(req, res, next) {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new ValidationError('userIds must be a non-empty array');
      }

      // Prevent deleting yourself
      if (userIds.includes(req.user.user_id)) {
        throw new ValidationError('Cannot delete your own account');
      }

      await User.destroy({ where: { user_id: { [Op.in]: userIds } } });
      return successResponse(res, { deleted_count: userIds.length }, 'Users deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== ANALYTICS ====================

  // Get system analytics
  static async getSystemAnalytics(req, res, next) {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { is_active: true } });
      const newUsersWeek = await User.count({
        where: { created_at: { [Op.gt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      });
      const newUsersMonth = await User.count({
        where: { created_at: { [Op.gt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      });
      const totalNotes = await Note.count();
      const totalTasks = await Task.count();
      const completedTasks = await Task.count({ where: { status: 'completed' } });
      const totalRecordings = await VoiceRecording.count();
      const totalReminders = await Reminder.count();
      const totalFocusSessions = await FocusSession.count();
      const adminUsers = await User.count({ where: { is_admin: true } });
      const oauthUsers = await User.count({ where: { oauth_provider: { [Op.ne]: null } } });

      // Get daily user registrations (last 30 days)
      const registrations = await User.findAll({
        where: {
          created_at: { [Op.gt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('user_id')), 'registrations']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
        raw: true
      });

      // Get most active users
      const activeUsersList = await User.findAll({
        attributes: [
          'user_id', 'email', 'name',
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('notes.note_id'))), 'notes_count'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('tasks.task_id'))), 'tasks_count'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('recordings.recording_id'))), 'recordings_count']
        ],
        include: [
          { model: Note, as: 'notes', attributes: [], required: false },
          { model: Task, as: 'tasks', attributes: [], required: false },
          { model: VoiceRecording, as: 'recordings', attributes: [], required: false }
        ],
        group: ['User.user_id'],
        order: [[sequelize.literal('(COUNT(DISTINCT notes.note_id) + COUNT(DISTINCT tasks.task_id) + COUNT(DISTINCT recordings.recording_id))'), 'DESC']],
        limit: 10,
        subQuery: false,
        raw: true
      });

      return successResponse(res, {
        overview: {
          total_users: totalUsers,
          active_users: activeUsers,
          inactive_users: totalUsers - activeUsers,
          new_users_week: newUsersWeek,
          new_users_month: newUsersMonth,
          total_notes: totalNotes,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          total_recordings: totalRecordings,
          total_reminders: totalReminders,
          total_focus_sessions: totalFocusSessions,
          admin_users: adminUsers,
          oauth_users: oauthUsers
        },
        daily_registrations: registrations,
        most_active_users: activeUsersList
      });
    } catch (error) {
      next(error);
    }
  }

  // Get AI usage statistics
  static async getAIUsageStats(req, res, next) {
    try {
      const { startDate, endDate, userId } = req.query;

      const where = { summary: { [Op.ne]: null } };
      
      if (startDate) where.created_at = { [Op.gte]: new Date(startDate) };
      if (endDate) {
        if (where.created_at) {
          where.created_at[Op.lte] = new Date(endDate);
        } else {
          where.created_at = { [Op.lte]: new Date(endDate) };
        }
      }
      if (userId) where.user_id = userId;

      const dailyStats = await Note.findAll({
        where,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('note_id')), 'summarizations'],
          [sequelize.fn('COUNT', sequelize.col('note_id')), 'total_ai_requests']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
        limit: 30,
        raw: true
      });

      const totalSummarizations = await Note.count({ where });
      const activeAiUsers = await Note.count({
        where,
        distinct: true,
        col: 'user_id'
      });

      const totalTranscriptions = await VoiceRecording.count({
        where: {
          transcription_text: { [Op.ne]: null },
          ...(startDate && { created_at: { [Op.gte]: new Date(startDate) } }),
          ...(endDate && { created_at: { [Op.lte]: new Date(endDate) } }),
          ...(userId && { user_id: userId })
        }
      });

      // Estimate tokens
      const notes = await Note.findAll({
        where,
        attributes: ['content', 'summary']
      });

      let estimatedInputTokens = 0;
      let estimatedOutputTokens = 0;
      
      notes.forEach(note => {
        if (note.content) estimatedInputTokens += Math.floor(note.content.length / 4);
        if (note.summary) estimatedOutputTokens += Math.floor(note.summary.length / 4);
      });

      return successResponse(res, {
        daily_stats: dailyStats,
        totals: {
          total_summarizations: totalSummarizations,
          active_ai_users: activeAiUsers,
          total_transcriptions: totalTranscriptions
        },
        token_estimate: {
          input_tokens: estimatedInputTokens,
          output_tokens: estimatedOutputTokens,
          total_tokens: estimatedInputTokens + estimatedOutputTokens,
          estimated_cost_usd: ((estimatedInputTokens + estimatedOutputTokens) / 1000000 * 2).toFixed(4)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get content statistics
  static async getContentStats(req, res, next) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const notesToday = await Note.count({ where: { created_at: { [Op.gt]: oneDayAgo } } });
      const tasksToday = await Task.count({ where: { created_at: { [Op.gt]: oneDayAgo } } });
      const recordingsToday = await VoiceRecording.count({ where: { created_at: { [Op.gt]: oneDayAgo } } });

      const notesWeek = await Note.count({ where: { created_at: { [Op.gt]: oneWeekAgo } } });
      const tasksWeek = await Task.count({ where: { created_at: { [Op.gt]: oneWeekAgo } } });
      const recordingsWeek = await VoiceRecording.count({ where: { created_at: { [Op.gt]: oneWeekAgo } } });

      const avgNoteLength = await Note.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.fn('LENGTH', sequelize.col('content'))), 'avg']],
        raw: true
      });

      const avgRecordingSize = await VoiceRecording.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('file_size')), 'avg']],
        raw: true
      });

      const totalStorageUsed = await VoiceRecording.sum('file_size') || 0;

      // Get popular tags
      const popularTags = await Tag.findAll({
        attributes: ['name', 'usage_count', 'color'],
        order: [['usage_count', 'DESC']],
        limit: 10,
        raw: true
      });

      // Get popular categories
      const popularCategories = await Category.findAll({
        attributes: [
          'category_id', 'name', 'color',
          [sequelize.fn('COUNT', sequelize.col('tasks.task_id')), 'task_count']
        ],
        include: [
          { model: Task, as: 'tasks', attributes: [], required: false }
        ],
        group: ['Category.category_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('tasks.task_id')), 'DESC']],
        limit: 10,
        subQuery: false,
        raw: true
      });

      return successResponse(res, {
        statistics: {
          notes_today: notesToday,
          tasks_today: tasksToday,
          recordings_today: recordingsToday,
          notes_week: notesWeek,
          tasks_week: tasksWeek,
          recordings_week: recordingsWeek,
          avg_note_length: parseFloat(avgNoteLength?.avg || 0).toFixed(2),
          avg_recording_size: parseFloat(avgRecordingSize?.avg || 0).toFixed(2),
          total_storage_used: parseInt(totalStorageUsed),
          total_storage_used_mb: (parseInt(totalStorageUsed) / (1024 * 1024)).toFixed(2)
        },
        popular_tags: popularTags,
        popular_categories: popularCategories
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== SYSTEM MANAGEMENT ====================

  // Get system health
  static async getSystemHealth(req, res, next) {
    try {
      const dbStatus = await sequelize.authenticate()
        .then(() => 'healthy')
        .catch(() => 'unhealthy');

      const activeSessions = await Session.count();
      const activeNotifications = await Notification.count({ where: { is_read: false } });

      return successResponse(res, {
        status: 'operational',
        database: dbStatus,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        active_sessions: activeSessions,
        unread_notifications: activeNotifications,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Get activity logs
  static async getActivityLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, userId, action } = req.query;
      const offset = (page - 1) * limit;

      // Get recent user activities
      const recentNotes = await Note.findAll({
        attributes: ['note_id', 'user_id', 'title', 'created_at'],
        include: [{ model: User, as: 'user', attributes: ['email', 'name'] }],
        order: [['created_at', 'DESC']],
        limit: 20,
        ...(userId && { where: { user_id: userId } })
      });

      const recentTasks = await Task.findAll({
        attributes: ['task_id', 'user_id', 'title', 'status', 'created_at'],
        include: [{ model: User, as: 'user', attributes: ['email', 'name'] }],
        order: [['created_at', 'DESC']],
        limit: 20,
        ...(userId && { where: { user_id: userId } })
      });

      const activities = [
        ...recentNotes.map(n => ({
          type: 'note_created',
          user: n.user,
          data: { note_id: n.note_id, title: n.title },
          timestamp: n.created_at
        })),
        ...recentTasks.map(t => ({
          type: 'task_created',
          user: t.user,
          data: { task_id: t.task_id, title: t.title, status: t.status },
          timestamp: t.created_at
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

      return paginatedResponse(res, activities, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear old data
  static async clearOldData(req, res, next) {
    try {
      const { days = 90 } = req.body;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const deletedSessions = await Session.destroy({
        where: { expires_at: { [Op.lt]: new Date() } }
      });

      const deletedNotifications = await Notification.destroy({
        where: {
          is_read: true,
          created_at: { [Op.lt]: cutoffDate }
        }
      });

      return successResponse(res, {
        deleted_sessions: deletedSessions,
        deleted_notifications: deletedNotifications
      }, 'Old data cleared successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
