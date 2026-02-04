import express from 'express';
import rateLimit from 'express-rate-limit';
import ProductivityController from '../controllers/productivity.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  createFocusSessionValidator,
  updateFocusSessionValidator,
  getSummaryValidator,
  getAISuggestionsValidator
} from '../validators/productivity.validator.js';

// Rate limiter for AI suggestions
const aiSuggestionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 AI requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many AI suggestion requests. Please try again in 15 minutes.',
      details: 'AI suggestions are limited to 10 requests per 15 minutes to ensure optimal performance.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.user_id || req.ip, // Rate limit per user
});

// All routes require authentication
router.use(authMiddleware);

// Focus Sessions
router.post('/focus-sessions', createFocusSessionValidator, ProductivityController.startFocusSession);
router.get('/focus-sessions', ProductivityController.getFocusSessions);
router.put('/focus-sessions/:id', updateFocusSessionValidator, ProductivityController.updateFocusSession);
router.delete('/focus-sessions/:id', ProductivityController.endFocusSession);

// Productivity Tracking
router.get('/streak', ProductivityController.getStreak);
router.get('/achievements', ProductivityController.getAchievements);
router.get('/summary', getSummaryValidator, ProductivityController.getProductivitySummary);

// AI Suggestions (with rate limiting)
router.get('/suggestions', aiSuggestionsLimiter, getAISuggestionsValidator, ProductivityController.getAISuggestions);

export default router;
