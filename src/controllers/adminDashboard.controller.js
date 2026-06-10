import AdminDashboardService from '../services/adminDashboard.service.js';
import AdminController from './admin.controller.js';
import { User } from '../models/orm/index.js';
import { successResponse } from '../utils/responses.js';
import { NotFoundError } from '../utils/errors.js';

class AdminDashboardController {
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await AdminDashboardService.getStats();
      return successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async getUsageChart(req, res, next) {
    try {
      const { period = '7d' } = req.query;
      const chart = await AdminDashboardService.getUsageChart(period);
      return successResponse(res, chart);
    } catch (error) {
      next(error);
    }
  }

  static async getTrafficSources(req, res, next) {
    try {
      const sources = await AdminDashboardService.getTrafficSources();
      return successResponse(res, sources);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await User.findOne({
        where: { user_id: req.user.user_id },
        attributes: [
          'user_id',
          'email',
          'name',
          'phone_number',
          'is_active',
          'is_admin',
          'email_verified',
          'created_at'
        ]
      });

      if (!user) {
        throw new NotFoundError('Admin user not found');
      }

      return successResponse(res, {
        user: user.toJSON(),
        role: user.is_admin ? 'admin' : 'user'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNotifications(req, res, next) {
    try {
      const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
      const data = await AdminDashboardService.getAdminNotifications(limit);
      return successResponse(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getUiStrings(req, res, next) {
    try {
      const { locale = 'ar' } = req.query;
      const strings = AdminDashboardService.getUiStrings(locale);
      return successResponse(res, { locale, strings });
    } catch (error) {
      next(error);
    }
  }

  // Dashboard-expected aliases
  static async getLogs(req, res, next) {
    return AdminController.getActivityLogs(req, res, next);
  }

  static async getApiUsage(req, res, next) {
    return AdminController.getAIUsageStats(req, res, next);
  }
}

export default AdminDashboardController;
