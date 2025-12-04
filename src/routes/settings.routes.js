const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settings.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  updateSettingsValidator,
  updateNotificationSettingsValidator
} = require('../validators/settings.validator');

// All routes require authentication
router.use(authMiddleware);

router.get('/', SettingsController.getSettings);
router.put('/', updateSettingsValidator, SettingsController.updateSettings);
router.put('/theme', SettingsController.updateTheme);
router.put('/language', SettingsController.updateLanguage);
router.put('/timezone', SettingsController.updateTimezone);
router.get('/notifications', SettingsController.getNotificationSettings);
router.put('/notifications', updateNotificationSettingsValidator, SettingsController.updateNotificationSettings);

module.exports = router;
