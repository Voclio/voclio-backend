import AdminIntegrationsService from '../services/adminIntegrations.service.js';
import AdminController from './admin.controller.js';
import { successResponse } from '../utils/responses.js';

class AdminIntegrationsController {
  static async getOverview(req, res, next) {
    try {
      await AdminIntegrationsService.ensureFeatureFlags();
      const overview = await AdminIntegrationsService.getOverview();
      return successResponse(res, overview);
    } catch (error) {
      next(error);
    }
  }

  static async getCalendarSyncs(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
      const { status } = req.query;
      const result = await AdminIntegrationsService.getCalendarSyncs({ page, limit, status });
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateFeatureFlags(req, res, next) {
    try {
      req.body = { config: req.body.flags || req.body.config || {} };
      return AdminController.updateConfig(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}

export default AdminIntegrationsController;
