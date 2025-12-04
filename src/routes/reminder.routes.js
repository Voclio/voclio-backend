const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/reminder.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/', ReminderController.getAllReminders);
router.get('/upcoming', ReminderController.getUpcomingReminders);
router.get('/:id', ReminderController.getReminderById);
router.post('/', ReminderController.createReminder);
router.put('/:id', ReminderController.updateReminder);
router.put('/:id/snooze', ReminderController.snoozeReminder);
router.put('/:id/dismiss', ReminderController.dismissReminder);
router.delete('/:id', ReminderController.deleteReminder);

module.exports = router;
