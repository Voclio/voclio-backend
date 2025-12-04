const { body, param } = require('express-validator');

const uploadVoiceValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer')
];

const voiceIdValidator = [
  param('id')
    .isInt()
    .withMessage('Voice recording ID must be a valid integer')
];

const transcribeVoiceValidator = [
  param('id')
    .isInt()
    .withMessage('Voice recording ID must be a valid integer'),
  body('language')
    .optional()
    .isIn(['en', 'ar', 'fr', 'es', 'de'])
    .withMessage('Language must be one of: en, ar, fr, es, de')
];

module.exports = {
  uploadVoiceValidator,
  voiceIdValidator,
  transcribeVoiceValidator
};
