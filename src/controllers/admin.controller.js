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

  // Get AI usage per user (detailed breakdown)
  static async getAIUsagePerUser(req, res, next) {
    try {
      const { startDate, endDate, limit = 50 } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) {
        if (dateFilter[Op.gte]) {
          dateFilter[Op.lte] = new Date(endDate);
        } else {
          dateFilter[Op.lte] = new Date(endDate);
        }
      }

      // Get all users with their AI operations
      const users = await User.findAll({
        attributes: ['user_id', 'email', 'name', 'created_at'],
        include: [
          {
            model: VoiceRecording,
            as: 'recordings',
            attributes: ['recording_id', 'transcription_text', 'transcribed_at', 'created_at'],
            where: Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : undefined,
            required: false
          },
          {
            model: Task,
            as: 'tasks',
            attributes: ['task_id', 'title', 'description', 'created_at'],
            where: Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : undefined,
            required: false,
            include: [{
              model: VoiceRecording,
              as: 'voice_recording',
              attributes: ['recording_id'],
              required: false
            }]
          },
          {
            model: Note,
            as: 'notes',
            attributes: ['note_id', 'title', 'content', 'summary', 'voice_recording_id', 'created_at'],
            where: Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : undefined,
            required: false
          }
        ]
      });

      // Calculate tokens for each user
      const userStats = users.map(user => {
        const userData = user.toJSON();
        
        let transcriptionTokens = 0;
        let taskExtractionTokens = 0;
        let noteExtractionTokens = 0;
        let summarizationTokens = 0;
        
        let transcriptionCount = 0;
        let taskExtractionCount = 0;
        let noteExtractionCount = 0;
        let summarizationCount = 0;

        // Count transcriptions and estimate tokens
        if (userData.recordings) {
          userData.recordings.forEach(recording => {
            if (recording.transcription_text) {
              transcriptionCount++;
              // Input: audio (estimate 1 token per 0.5 seconds, assume 30 sec average = 60 tokens)
              // Output: transcription text
              const transcriptionLength = recording.transcription_text.length;
              transcriptionTokens += 60; // input estimate
              transcriptionTokens += Math.floor(transcriptionLength / 4); // output tokens
            }
          });
        }

        // Count task extractions from voice
        if (userData.tasks) {
          userData.tasks.forEach(task => {
            if (task.voice_recording) {
              taskExtractionCount++;
              // Input: transcription text (estimate from title + description)
              const inputLength = (task.title?.length || 0) + (task.description?.length || 0);
              taskExtractionTokens += Math.floor(inputLength / 2); // input estimate (original text was longer)
              taskExtractionTokens += Math.floor(inputLength / 4); // output tokens
            }
          });
        }

        // Count note extractions and summarizations
        if (userData.notes) {
          userData.notes.forEach(note => {
            // Note from voice recording
            if (note.voice_recording_id) {
              noteExtractionCount++;
              const contentLength = note.content?.length || 0;
              noteExtractionTokens += Math.floor(contentLength / 2); // input estimate
              noteExtractionTokens += Math.floor(contentLength / 4); // output tokens
            }
            
            // Summarization
            if (note.summary) {
              summarizationCount++;
              const contentLength = note.content?.length || 0;
              const summaryLength = note.summary.length;
              summarizationTokens += Math.floor(contentLength / 4); // input
              summarizationTokens += Math.floor(summaryLength / 4); // output
            }
          });
        }

        const totalInputTokens = Math.floor(
          (transcriptionTokens + taskExtractionTokens + noteExtractionTokens + summarizationTokens) * 0.6
        );
        const totalOutputTokens = Math.floor(
          (transcriptionTokens + taskExtractionTokens + noteExtractionTokens + summarizationTokens) * 0.4
        );
        const totalTokens = totalInputTokens + totalOutputTokens;
        
        // Calculate cost (GPT-4 pricing)
        const estimatedCost = (totalInputTokens / 1000 * 0.03) + (totalOutputTokens / 1000 * 0.06);

        return {
          user_id: userData.user_id,
          email: userData.email,
          name: userData.name,
          operations: {
            transcriptions: transcriptionCount,
            task_extractions: taskExtractionCount,
            note_extractions: noteExtractionCount,
            summarizations: summarizationCount,
            total_operations: transcriptionCount + taskExtractionCount + noteExtractionCount + summarizationCount
          },
          tokens: {
            input_tokens: totalInputTokens,
            output_tokens: totalOutputTokens,
            total_tokens: totalTokens
          },
          cost: {
            estimated_cost_usd: estimatedCost.toFixed(4),
            cost_breakdown: {
              transcription_cost: ((transcriptionTokens * 0.6 / 1000 * 0.03) + (transcriptionTokens * 0.4 / 1000 * 0.06)).toFixed(4),
              task_extraction_cost: ((taskExtractionTokens * 0.6 / 1000 * 0.03) + (taskExtractionTokens * 0.4 / 1000 * 0.06)).toFixed(4),
              note_extraction_cost: ((noteExtractionTokens * 0.6 / 1000 * 0.03) + (noteExtractionTokens * 0.4 / 1000 * 0.06)).toFixed(4),
              summarization_cost: ((summarizationTokens * 0.6 / 1000 * 0.03) + (summarizationTokens * 0.4 / 1000 * 0.06)).toFixed(4)
            }
          }
        };
      })
      .filter(stat => stat.operations.total_operations > 0) // Only users with AI usage
      .sort((a, b) => b.tokens.total_tokens - a.tokens.total_tokens) // Sort by token usage
      .slice(0, parseInt(limit));

      // Calculate totals
      const totals = userStats.reduce((acc, stat) => {
        acc.total_users++;
        acc.total_operations += stat.operations.total_operations;
        acc.total_tokens += stat.tokens.total_tokens;
        acc.total_cost += parseFloat(stat.cost.estimated_cost_usd);
        return acc;
      }, {
        total_users: 0,
        total_operations: 0,
        total_tokens: 0,
        total_cost: 0
      });

      return successResponse(res, {
        users: userStats,
        summary: {
          total_users_with_ai_usage: totals.total_users,
          total_operations: totals.total_operations,
          total_tokens: totals.total_tokens,
          total_cost_usd: totals.total_cost.toFixed(4),
          average_tokens_per_user: totals.total_users > 0 ? Math.floor(totals.total_tokens / totals.total_users) : 0,
          average_cost_per_user: totals.total_users > 0 ? (totals.total_cost / totals.total_users).toFixed(4) : '0.0000'
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

      // Build date filter
      const dateFilter = {};
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) {
        if (dateFilter[Op.gte]) {
          dateFilter[Op.lte] = new Date(endDate);
        } else {
          dateFilter[Op.lte] = new Date(endDate);
        }
      }

      // Count transcriptions (Voice to Text)
      const transcriptionWhere = {
        transcription_text: { [Op.ne]: null },
        ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        ...(userId && { user_id: userId })
      };

      const totalTranscriptions = await VoiceRecording.count({ where: transcriptionWhere });

      // Count task extractions (recordings that created tasks)
      const taskExtractionWhere = {
        ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        ...(userId && { user_id: userId })
      };

      const totalTaskExtractions = await Task.count({
        where: taskExtractionWhere,
        include: [{
          model: VoiceRecording,
          as: 'voice_recording',
          required: true,
          attributes: []
        }]
      });

      // Count note extractions (recordings that created notes)
      const totalNoteExtractions = await Note.count({
        where: {
          voice_recording_id: { [Op.ne]: null },
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
          ...(userId && { user_id: userId })
        }
      });

      // Count summarizations
      const summaryWhere = {
        summary: { [Op.ne]: null },
        ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        ...(userId && { user_id: userId })
      };

      const totalSummarizations = await Note.count({ where: summaryWhere });

      // Get daily stats for transcriptions
      const dailyTranscriptions = await VoiceRecording.findAll({
        where: transcriptionWhere,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('recording_id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
        limit: 30,
        raw: true
      });

      // Get daily stats for task extractions
      const dailyTaskExtractions = await Task.findAll({
        where: taskExtractionWhere,
        include: [{
          model: VoiceRecording,
          as: 'voice_recording',
          required: true,
          attributes: []
        }],
        attributes: [
          [sequelize.fn('DATE', sequelize.col('Task.created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('task_id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('Task.created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('Task.created_at')), 'DESC']],
        limit: 30,
        raw: true
      });

      // Combine daily stats
      const dailyStatsMap = new Map();
      
      dailyTranscriptions.forEach(item => {
        const date = item.date;
        if (!dailyStatsMap.has(date)) {
          dailyStatsMap.set(date, { date, transcriptions: 0, task_extractions: 0, total_ai_requests: 0 });
        }
        dailyStatsMap.get(date).transcriptions = parseInt(item.count);
        dailyStatsMap.get(date).total_ai_requests += parseInt(item.count);
      });

      dailyTaskExtractions.forEach(item => {
        const date = item.date;
        if (!dailyStatsMap.has(date)) {
          dailyStatsMap.set(date, { date, transcriptions: 0, task_extractions: 0, total_ai_requests: 0 });
        }
        dailyStatsMap.get(date).task_extractions = parseInt(item.count);
        dailyStatsMap.get(date).total_ai_requests += parseInt(item.count);
      });

      const dailyStats = Array.from(dailyStatsMap.values())
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Count active AI users
      const activeAiUsers = await VoiceRecording.count({
        where: transcriptionWhere,
        distinct: true,
        col: 'user_id'
      });

      // Estimate tokens from transcriptions
      const recordings = await VoiceRecording.findAll({
        where: transcriptionWhere,
        attributes: ['transcription_text']
      });

      let estimatedInputTokens = 0;
      let estimatedOutputTokens = 0;
      
      recordings.forEach(recording => {
        if (recording.transcription_text) {
          // Input: transcription text
          estimatedInputTokens += Math.floor(recording.transcription_text.length / 4);
          // Output: estimated extracted tasks/notes (assume 30% of input)
          estimatedOutputTokens += Math.floor(recording.transcription_text.length / 4 * 0.3);
        }
      });

      // Add summarization tokens
      const notes = await Note.findAll({
        where: summaryWhere,
        attributes: ['content', 'summary']
      });

      notes.forEach(note => {
        if (note.content) estimatedInputTokens += Math.floor(note.content.length / 4);
        if (note.summary) estimatedOutputTokens += Math.floor(note.summary.length / 4);
      });

      // Calculate cost (GPT-4 pricing: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens)
      const estimatedCost = (estimatedInputTokens / 1000 * 0.03) + (estimatedOutputTokens / 1000 * 0.06);

      return successResponse(res, {
        daily_stats: dailyStats,
        totals: {
          total_transcriptions: totalTranscriptions,
          total_task_extractions: totalTaskExtractions,
          total_note_extractions: totalNoteExtractions,
          total_summarizations: totalSummarizations,
          active_ai_users: activeAiUsers,
          total_ai_operations: totalTranscriptions + totalTaskExtractions + totalNoteExtractions + totalSummarizations
        },
        token_estimate: {
          input_tokens: estimatedInputTokens,
          output_tokens: estimatedOutputTokens,
          total_tokens: estimatedInputTokens + estimatedOutputTokens,
          estimated_cost_usd: estimatedCost.toFixed(4)
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
