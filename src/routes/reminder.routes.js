const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/reminder.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createReminderValidator,
  updateReminderValidator,
  reminderIdValidator,
  snoozeReminderValidator
} = require('../validators/reminder.validator');

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

module.exports = router;
