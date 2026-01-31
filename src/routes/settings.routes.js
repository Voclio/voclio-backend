import express from 'express';
import SettingsController from '../controllers/settings.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  updateSettingsValidator,
  updateNotificationSettingsValidator
} from '../validators/settings.validator.js';

// All routes require authentication
router.use(authMiddleware);

router.get('/', SettingsController.getSettings);
router.put('/', updateSettingsValidator, SettingsController.updateSettings);
router.put('/theme', SettingsController.updateTheme);
router.put('/language', SettingsController.updateLanguage);
router.put('/timezone', SettingsController.updateTimezone);
router.get('/notifications', SettingsController.getNotificationSettings);
router.put('/notifications', updateNotificationSettingsValidator, SettingsController.updateNotificationSettings);

export default router;
