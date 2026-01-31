import express from 'express';
import DashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
// All routes require authentication
router.use(authMiddleware);

router.get('/stats', DashboardController.getDashboardStats);
router.get('/quick-stats', DashboardController.getQuickStats);

export default router;
