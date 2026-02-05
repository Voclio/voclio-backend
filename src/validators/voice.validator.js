import { body, param } from 'express-validator';

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
    .isIn(['en', 'ar', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi', 'tr'])
    .withMessage('Language must be one of: en, ar, fr, es, de, it, pt, ru, ja, ko, zh, hi, tr')
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

const previewExtractionValidator = [
  body('recording_id')
    .isInt()
    .withMessage('Recording ID must be a valid integer'),
  body('extraction_type')
    .optional()
    .isIn(['tasks', 'notes', 'both'])
    .withMessage('extraction_type must be one of: tasks, notes, both')
];

const createFromPreviewValidator = [
  body('recording_id')
    .isInt()
    .withMessage('Recording ID must be a valid integer'),
  body('tasks')
    .optional()
    .isArray()
    .withMessage('tasks must be an array'),
  body('notes')
    .optional()
    .isArray()
    .withMessage('notes must be an array'),
  body('category_id')
    .optional()
    .isInt()
    .withMessage('Category ID must be a valid integer')
];

const updateTranscriptionValidator = [
  body('recording_id')
    .isInt()
    .withMessage('Recording ID must be a valid integer'),
  body('transcription')
    .notEmpty()
    .withMessage('Transcription text is required')
    .isString()
    .withMessage('Transcription must be a string')
];

const processVoiceCompleteValidator = [
  body('language')
    .optional()
    .isIn(['en', 'ar', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'hi', 'tr'])
    .withMessage('Language must be one of: en, ar, fr, es, de, it, pt, ru, ja, ko, zh, hi, tr'),
  body('category_id')
    .optional()
    .isInt()
    .withMessage('Category ID must be a valid integer'),
  body('auto_create_tasks')
    .optional()
    .isBoolean()
    .withMessage('auto_create_tasks must be a boolean'),
  body('auto_create_notes')
    .optional()
    .isBoolean()
    .withMessage('auto_create_notes must be a boolean')
];

export {
  uploadVoiceValidator,
  voiceIdValidator,
  transcribeVoiceValidator,
  createNoteFromVoiceValidator,
  createTasksFromVoiceValidator,
  previewExtractionValidator,
  createFromPreviewValidator,
  updateTranscriptionValidator,
  processVoiceCompleteValidator
};
