import ProductivityModel from '../models/productivity.model.js';
import aiService from '../services/ai.service.js';
import TaskModel from '../models/task.model.js';
import { successResponse, paginatedResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import NotificationService from '../services/notification.service.js';
class ProductivityController {
  static async startFocusSession(req, res, next) {
    try {
      const { timer_duration, ambient_sound, sound_volume } = req.body;

      const session = await ProductivityModel.createFocusSession(req.user.user_id, {
        timer_duration,
        ambient_sound,
        sound_volume
      });

      return successResponse(res, { session }, 'Focus session started', 201);

    } catch (error) {
      next(error);
    }
  }

  static async updateFocusSession(req, res, next) {
    try {
      const updates = {};
      ['status', 'elapsed_time', 'ambient_sound', 'sound_volume'].forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const session = await ProductivityModel.updateFocusSession(
        req.params.id,
        req.user.user_id,
        updates
      );

      if (!session) {
        throw new NotFoundError('Focus session not found');
      }

      return successResponse(res, { session }, 'Focus session updated');

    } catch (error) {
      next(error);
    }
  }

  static async endFocusSession(req, res, next) {
    try {
      const session = await ProductivityModel.endFocusSession(req.params.id, req.user.user_id);

      if (!session) {
        throw new NotFoundError('Focus session not found');
      }

      // Update streak
      const streak = await ProductivityModel.updateStreak(req.user.user_id);

      // Send notification for completed focus session
      await NotificationService.notifyFocusSessionCompleted(req.user.user_id, session);

      // Check for streak milestone and send notification
      if (streak && streak.current_streak > 0 && streak.current_streak % 7 === 0) {
        await NotificationService.notifyStreakMilestone(req.user.user_id, streak);
      }

      return successResponse(res, { session }, 'Focus session completed');

    } catch (error) {
      next(error);
    }
  }

  static async getFocusSessions(req, res, next) {
    try {
      const { page = 1, limit = 20, start_date, end_date } = req.query;

      const sessions = await ProductivityModel.findFocusSessions(req.user.user_id, {
        page: parseInt(page),
        limit: parseInt(limit),
        start_date,
        end_date
      });

      return paginatedResponse(res, sessions, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sessions.length
      });

    } catch (error) {
      next(error);
    }
  }

  static async getStreak(req, res, next) {
    try {
      const streak = await ProductivityModel.getStreak(req.user.user_id);

      return successResponse(res, {
        streak: streak || {
          current_streak: 0,
          longest_streak: 0,
          streak_date: null
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getAchievements(req, res, next) {
    try {
      const achievements = await ProductivityModel.getAchievements(req.user.user_id);

      return successResponse(res, { achievements });

    } catch (error) {
      next(error);
    }
  }

  static async getProductivitySummary(req, res, next) {
    try {
      let { start_date, end_date, period } = req.query;

      // Handle period-based queries
      if (period && !start_date && !end_date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (period) {
          case 'today':
            start_date = today.toISOString().split('T')[0];
            end_date = today.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            start_date = weekStart.toISOString().split('T')[0];
            end_date = today.toISOString().split('T')[0];
            break;
          case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            start_date = monthStart.toISOString().split('T')[0];
            end_date = today.toISOString().split('T')[0];
            break;
          default:
            throw new ValidationError('Invalid period. Use: today, week, or month');
        }
      }

      if (!start_date || !end_date) {
        throw new ValidationError('start_date and end_date are required, or use period parameter (today, week, month)');
      }

      const summary = await ProductivityModel.getProductivitySummary(
        req.user.user_id,
        start_date,
        end_date
      );

      return successResponse(res, { summary, period: { start_date, end_date } });

    } catch (error) {
      next(error);
    }
  }

  static async getAISuggestions(req, res, next) {
    try {
      const startTime = Date.now();
      
      // Extract query parameters with defaults
      const { 
        days = 7,
        focus_area = 'general', 
        tone = 'professional', 
        count = 5,
        language = 'ar'
      } = req.query;

      // Get user's productivity data for specified period
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const summary = await ProductivityModel.getProductivitySummary(
        req.user.user_id,
        startDate,
        endDate
      );

      const tasks = await TaskModel.findAll(req.user.user_id, {});
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const pendingTasks = tasks.filter(t => t.status !== 'completed');
      const overdueTasks = tasks.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
      );

      // Enhanced user data with more context
      const userData = {
        period: { start_date: startDate, end_date: endDate, days },
        summary,
        tasks_analysis: {
          total_tasks: tasks.length,
          completed_tasks: completedTasks.length,
          pending_tasks: pendingTasks.length,
          overdue_tasks: overdueTasks.length,
          completion_rate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
          average_tasks_per_day: Math.round(tasks.length / days)
        },
        productivity_patterns: {
          most_productive_day: summary.most_productive_day || null,
          total_focus_time: summary.total_focus_time || 0,
          focus_sessions_count: summary.focus_sessions_count || 0,
          average_focus_duration: summary.average_focus_duration || 0
        },
        stress_indicators: {
          overdue_percentage: tasks.length > 0 ? Math.round((overdueTasks.length / tasks.length) * 100) : 0,
          high_priority_pending: pendingTasks.filter(t => t.priority === 'high').length,
          tasks_without_due_date: pendingTasks.filter(t => !t.due_date).length
        }
      };

      // Generate AI suggestions with enhanced options
      const suggestions = await aiService.generateProductivitySuggestions(userData, {
        focus_area,
        tone,
        count: parseInt(count),
        language
      });

      // Enhanced response structure
      const response = {
        suggestions: suggestions.map((suggestion, index) => ({
          id: index + 1,
          text: suggestion.suggestion || suggestion,
          category: suggestion.category || focus_area,
          priority: suggestion.priority || 'medium',
          estimated_impact: suggestion.estimated_impact || 'medium',
          implementation_time: suggestion.implementation_time || 'daily',
          steps: suggestion.steps || []
        })),
        metadata: {
          generated_at: new Date().toISOString(),
          data_period: { start_date: startDate, end_date: endDate, days },
          ai_provider: aiService.provider,
          parameters: { focus_area, tone, count, language },
          response_time_ms: Date.now() - startTime
        },
        based_on: userData
      };

      return successResponse(res, response);

    } catch (error) {
      console.error('AI Suggestions Error:', error);
      next(error);
    }
  }
}

export default ProductivityController;
