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
  body('recording_id')
    .isInt()
    .withMessage('Recording ID must be a valid integer'),
  body('language')
    .optional()
    .isIn(['en', 'ar', 'fr', 'es', 'de'])
    .withMessage('Language must be one of: en, ar, fr, es, de')
];

const createNoteFromVoiceValidator = [
  param('id')
    .isInt()
    .withMessage('Voice recording ID must be a valid integer'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isInt()
    .withMessage('Each tag must be a valid tag ID')
];

const createTasksFromVoiceValidator = [
  param('id')
    .isInt()
    .withMessage('Voice recording ID must be a valid integer'),
  body('auto_create')
    .optional()
    .isBoolean()
    .withMessage('auto_create must be a boolean'),
  body('category_id')
    .optional()
    .isInt()
    .withMessage('Category ID must be a valid integer')
];

module.exports = {
  uploadVoiceValidator,
  voiceIdValidator,
  transcribeVoiceValidator,
  createNoteFromVoiceValidator,
  createTasksFromVoiceValidator
};
