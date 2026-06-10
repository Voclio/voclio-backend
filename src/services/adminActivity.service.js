import { ActivityLog } from '../models/orm/index.js';
import logger from '../utils/logger.js';

class AdminActivityService {
  static async log({
    activityType,
    activityCategory = 'admin',
    severity = 'info',
    userId = null,
    adminId = null,
    ipAddress = null,
    details = null
  }) {
    try {
      await ActivityLog.create({
        user_id: userId,
        admin_id: adminId,
        activity_type: activityType,
        activity_category: activityCategory,
        severity,
        ip_address: ipAddress,
        details
      });
    } catch (error) {
      logger.warn('Failed to write activity log', { error: error.message, activityType });
    }
  }
}

export default AdminActivityService;
