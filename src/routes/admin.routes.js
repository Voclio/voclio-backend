import express from 'express';
import AdminController from '../controllers/admin.controller.js';
import AdminDashboardController from '../controllers/adminDashboard.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';
import { body, query, param } from 'express-validator';

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', AdminDashboardController.getDashboardStats);
router.get(
  '/dashboard/usage-chart',
  [query('period').optional().isIn(['7d', '30d', '90d'])],
  AdminDashboardController.getUsageChart
);
router.get('/dashboard/traffic-sources', AdminDashboardController.getTrafficSources);
router.get('/me', AdminDashboardController.getMe);
router.get(
  '/notifications',
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  AdminDashboardController.getNotifications
);
router.get(
  '/ui-strings',
  [query('locale').optional().isIn(['ar', 'en'])],
  AdminDashboardController.getUiStrings
);

// Dashboard-expected aliases
router.get(
  '/logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('userId').optional().isInt(),
    query('action').optional().trim(),
    query('severity').optional().isIn(['info', 'warning', 'error', 'critical']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  AdminDashboardController.getLogs
);
router.get('/api-usage', AdminDashboardController.getApiUsage);

// ==================== APP CONFIG ====================
router.get('/config', AdminController.getConfig);
router.put('/config', [body('config').isObject()], AdminController.updateConfig);

// ==================== API KEYS ====================
router.get('/api-keys', AdminController.getApiKeys);
router.post(
  '/api-keys',
  [
    body('api_type').notEmpty(),
    body('access_token').notEmpty(),
    body('provider').optional().isString(),
    body('name').optional().isString(),
    body('rate_limit').optional().isInt({ min: 1 }),
    body('is_active').optional().isBoolean()
  ],
  AdminController.createApiKey
);
router.put(
  '/api-keys/:id',
  [
    param('id').isInt(),
    body('api_type').optional().notEmpty(),
    body('access_token').optional().isString(),
    body('provider').optional().isString(),
    body('name').optional().isString(),
    body('rate_limit').optional().isInt({ min: 1 }),
    body('is_active').optional().isBoolean()
  ],
  AdminController.updateApiKey
);
router.delete('/api-keys/:id', [param('id').isInt()], AdminController.deleteApiKey);

// ==================== USER MANAGEMENT ====================
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('status').optional().isIn(['all', 'active', 'inactive', 'admin']),
    query('sortBy').optional().isIn(['created_at', 'email', 'name']),
    query('order').optional().isIn(['ASC', 'DESC'])
  ],
  AdminController.getAllUsers
);

router.post(
  '/users',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('name').optional().isString(),
    body('phone_number').optional().isString(),
    body('is_admin').optional().isBoolean(),
    body('is_active').optional().isBoolean()
  ],
  AdminController.createUser
);

router.post(
  '/users/bulk-delete',
  [
    body('userIds').isArray({ min: 1 }),
    body('userIds.*').isInt()
  ],
  AdminController.bulkDeleteUsers
);

router.get('/users/:userId', AdminController.getUserDetails);

router.post(
  '/users/:userId/reset-password',
  [param('userId').isInt(), body('new_password').isLength({ min: 8 })],
  AdminController.resetUserPassword
);

// User tasks (admin)
router.get(
  '/users/:userId/tasks',
  [param('userId').isInt(), query('page').optional().isInt(), query('limit').optional().isInt()],
  AdminController.getUserTasks
);
router.post(
  '/users/:userId/tasks',
  [param('userId').isInt(), body('title').notEmpty()],
  AdminController.createUserTask
);
router.put('/users/:userId/tasks/:taskId', [param('userId').isInt(), param('taskId').isInt()], AdminController.updateUserTask);
router.delete(
  '/users/:userId/tasks/:taskId',
  [param('userId').isInt(), param('taskId').isInt()],
  AdminController.deleteUserTask
);

// User notes (admin)
router.get(
  '/users/:userId/notes',
  [param('userId').isInt(), query('page').optional().isInt(), query('limit').optional().isInt()],
  AdminController.getUserNotes
);
router.post(
  '/users/:userId/notes',
  [param('userId').isInt(), body('title').optional().isString()],
  AdminController.createUserNote
);
router.put('/users/:userId/notes/:noteId', [param('userId').isInt(), param('noteId').isInt()], AdminController.updateUserNote);
router.delete(
  '/users/:userId/notes/:noteId',
  [param('userId').isInt(), param('noteId').isInt()],
  AdminController.deleteUserNote
);

router.put(
  '/users/:userId',
  [
    param('userId').isInt(),
    body('name').optional().isString(),
    body('email').optional().isEmail(),
    body('phone_number').optional().isString(),
    body('is_active').optional().isBoolean(),
    body('is_admin').optional().isBoolean()
  ],
  AdminController.updateUser
);

router.put(
  '/users/:userId/status',
  [param('userId').isInt(), body('is_active').isBoolean()],
  AdminController.updateUserStatus
);

router.put(
  '/users/:userId/role',
  [param('userId').isInt(), body('is_admin').isBoolean()],
  AdminController.updateUserRole
);

router.delete('/users/:userId', [param('userId').isInt()], AdminController.deleteUser);

// ==================== ANALYTICS (legacy paths) ====================
router.get('/analytics/system', AdminController.getSystemAnalytics);
router.get(
  '/analytics/ai-usage',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('userId').optional().isInt()
  ],
  AdminController.getAIUsageStats
);
router.get(
  '/analytics/ai-usage-per-user',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 200 })
  ],
  AdminController.getAIUsagePerUser
);
router.get('/analytics/content', AdminController.getContentStats);

// ==================== SYSTEM MANAGEMENT ====================
router.get('/system/health', AdminController.getSystemHealth);
router.get(
  '/system/activity-logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('userId').optional().isInt(),
    query('action').optional().trim(),
    query('severity').optional().isIn(['info', 'warning', 'error', 'critical']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  AdminController.getActivityLogs
);
router.post(
  '/system/clear-old-data',
  [body('days').optional().isInt({ min: 1, max: 365 })],
  AdminController.clearOldData
);

export default router;
