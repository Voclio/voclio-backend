const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { body, query } = require('express-validator');

// Middleware to check if user is super admin
const adminOnly = async (req, res, next) => {
  try {
    const pool = require('../config/database');
    
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Get user from database with is_admin flag
    const result = await pool.query(
      'SELECT user_id, email, is_admin FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const user = result.rows[0];

    // Check if user is admin (only is_admin flag)
    if (user.is_admin !== true) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required. Contact system administrator.'
        }
      });
    }

    // Attach full user data to request
    req.adminUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error verifying admin status'
      }
    });
  }
};

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// User Management
router.get('/users', AdminController.getAllUsers);
router.get('/users/:userId', AdminController.getUserDetails);
router.put('/users/:userId/status', [
  body('is_active').isBoolean().withMessage('is_active must be boolean')
], AdminController.updateUserStatus);
// Subscription management removed
// router.put('/users/:userId/subscription', AdminController.updateUserSubscription);
router.delete('/users/:userId', AdminController.deleteUser);

// Analytics
router.get('/analytics/system', AdminController.getSystemAnalytics);
router.get('/analytics/ai-usage', AdminController.getAIUsageStats);
router.get('/analytics/content', AdminController.getContentStats);

module.exports = router;
