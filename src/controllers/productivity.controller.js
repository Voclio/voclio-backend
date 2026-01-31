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
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        throw new ValidationError('start_date and end_date are required');
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
      // Get user's recent productivity data
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const summary = await ProductivityModel.getProductivitySummary(
        req.user.user_id,
        startDate,
        endDate
      );

      const tasks = await TaskModel.findAll(req.user.user_id, {});

      const userData = {
        summary,
        total_tasks: tasks.length,
        pending_tasks: tasks.filter(t => t.status !== 'completed').length,
        overdue_tasks: tasks.filter(t => 
          t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
        ).length
      };

      const suggestions = await aiService.generateProductivitySuggestions(userData);

      return successResponse(res, {
        suggestions,
        based_on: userData
      });

    } catch (error) {
      next(error);
    }
  }
}

export default ProductivityController;
