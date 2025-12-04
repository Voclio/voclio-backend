const express = require('express');
const router = express.Router();
const ProductivityController = require('../controllers/productivity.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createFocusSessionValidator,
  updateFocusSessionValidator,
  getSummaryValidator
} = require('../validators/productivity.validator');

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

// AI Suggestions
router.get('/suggestions', ProductivityController.getAISuggestions);

module.exports = router;
