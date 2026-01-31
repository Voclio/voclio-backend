import { body, param } from 'express-validator';

const createReminderValidator = [
  body('task_id')
    .optional()
    .isInt()
    .withMessage('Task ID must be a valid integer'),
  body('note_id')
    .optional()
    .isInt()
    .withMessage('Note ID must be a valid integer'),
  body('reminder_time')
    .notEmpty()
    .isISO8601()
    .withMessage('Reminder time must be a valid date'),
  body('repeat_type')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid repeat type'),
  body('notification_enabled')
    .optional()
    .isBoolean()
    .withMessage('Notification enabled must be boolean')
];

const updateReminderValidator = [
  param('id')
    .isInt()
    .withMessage('Reminder ID must be a valid integer'),
  body('reminder_time')
    .optional()
    .isISO8601()
    .withMessage('Reminder time must be a valid date'),
  body('repeat_type')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid repeat type'),
  body('notification_enabled')
    .optional()
    .isBoolean()
    .withMessage('Notification enabled must be boolean'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be boolean')
];

const reminderIdValidator = [
  param('id')
    .isInt()
    .withMessage('Reminder ID must be a valid integer')
];

const snoozeReminderValidator = [
  param('id')
    .isInt()
    .withMessage('Reminder ID must be a valid integer'),
  body('snooze_until')
    .notEmpty()
    .isISO8601()
    .withMessage('Snooze until must be a valid date')
];

export {
  createReminderValidator,
  updateReminderValidator,
  reminderIdValidator,
  snoozeReminderValidator
};
