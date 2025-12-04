const { body } = require('express-validator');

const updateSettingsValidator = [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be: light, dark, or auto'),
  body('language')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters'),
  body('timezone')
    .optional()
    .isString()
    .trim()
    .withMessage('Invalid timezone'),
  body('auto_backup')
    .optional()
    .isBoolean()
    .withMessage('auto_backup must be boolean'),
  body('backup_frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('backup_frequency must be: daily, weekly, or monthly'),
  body('data_retention_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('data_retention_days must be between 1 and 365')
];

const updateNotificationSettingsValidator = [
  body('email_enabled')
    .optional()
    .isBoolean()
    .withMessage('email_enabled must be boolean'),
  body('whatsapp_enabled')
    .optional()
    .isBoolean()
    .withMessage('whatsapp_enabled must be boolean'),
  body('push_enabled')
    .optional()
    .isBoolean()
    .withMessage('push_enabled must be boolean'),
  body('email_for_reminders')
    .optional()
    .isBoolean()
    .withMessage('email_for_reminders must be boolean'),
  body('email_for_tasks')
    .optional()
    .isBoolean()
    .withMessage('email_for_tasks must be boolean'),
  body('whatsapp_for_reminders')
    .optional()
    .isBoolean()
    .withMessage('whatsapp_for_reminders must be boolean')
];

module.exports = {
  updateSettingsValidator,
  updateNotificationSettingsValidator
};
