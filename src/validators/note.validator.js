import { body, query } from 'express-validator';

const createNoteValidator = [
  body('title')
    .notEmpty()
    .trim()
    .withMessage('Title is required'),
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
  body('voice_recording_id')
    .optional()
    .isInt()
    .withMessage('Invalid voice recording ID'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const updateNoteValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('content')
    .optional()
    .notEmpty()
    .withMessage('Content cannot be empty'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const searchNotesValidator = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must not be empty'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const addTagsValidator = [
  body('tags')
    .isArray({ min: 1 })
    .withMessage('Tags must be a non-empty array'),
  body('tags.*')
    .isInt()
    .withMessage('Each tag must be a valid ID')
];

export {
  createNoteValidator,
  updateNoteValidator,
  searchNotesValidator,
  addTagsValidator
};
