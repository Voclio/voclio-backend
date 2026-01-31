import express from 'express';
import AdminController from '../controllers/admin.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';
import { body, query } from 'express-validator';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// ==================== USER MANAGEMENT ====================
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['all', 'active', 'inactive', 'admin']),
  query('sortBy').optional().isIn(['created_at', 'email', 'name']),
  query('order').optional().isIn(['ASC', 'DESC'])
], AdminController.getAllUsers);

router.get('/users/:userId', AdminController.getUserDetails);

router.put('/users/:userId/status', [
  body('is_active').isBoolean().withMessage('is_active must be boolean')
], AdminController.updateUserStatus);

router.put('/users/:userId/role', [
  body('is_admin').isBoolean().withMessage('is_admin must be boolean')
], AdminController.updateUserRole);

router.delete('/users/:userId', AdminController.deleteUser);

router.post('/users/bulk-delete', [
  body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
  body('userIds.*').isInt().withMessage('Each userId must be an integer')
], AdminController.bulkDeleteUsers);

// ==================== ANALYTICS ====================
router.get('/analytics/system', AdminController.getSystemAnalytics);

router.get('/analytics/ai-usage', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('userId').optional().isInt()
], AdminController.getAIUsageStats);

router.get('/analytics/content', AdminController.getContentStats);

// ==================== SYSTEM MANAGEMENT ====================
router.get('/system/health', AdminController.getSystemHealth);

router.get('/system/activity-logs', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('userId').optional().isInt(),
  query('action').optional().trim()
], AdminController.getActivityLogs);

router.post('/system/clear-old-data', [
  body('days').optional().isInt({ min: 1, max: 365 })
], AdminController.clearOldData);

export default router;
