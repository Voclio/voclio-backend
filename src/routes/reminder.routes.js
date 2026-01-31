import express from 'express';
import ReminderController from '../controllers/reminder.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  createReminderValidator,
  updateReminderValidator,
  reminderIdValidator,
  snoozeReminderValidator
} from '../validators/reminder.validator.js';

// All routes require authentication
router.use(authMiddleware);

router.get('/', ReminderController.getAllReminders);
router.get('/upcoming', ReminderController.getUpcomingReminders);
router.get('/:id', reminderIdValidator, ReminderController.getReminderById);
router.post('/', createReminderValidator, ReminderController.createReminder);
router.put('/:id', updateReminderValidator, ReminderController.updateReminder);
router.put('/:id/snooze', snoozeReminderValidator, ReminderController.snoozeReminder);
router.put('/:id/dismiss', reminderIdValidator, ReminderController.dismissReminder);
router.delete('/:id', reminderIdValidator, ReminderController.deleteReminder);

export default router;
