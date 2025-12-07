const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/stats', DashboardController.getDashboardStats);
router.get('/quick-stats', DashboardController.getQuickStats);

module.exports = router;
