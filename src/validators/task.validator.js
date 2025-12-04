const { body, query } = require('express-validator');

const createTaskValidator = [
  body('title')
    .notEmpty()
    .trim()
    .withMessage('Title is required'),
  body('description')
    .optional()
    .trim(),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('category_id')
    .optional()
    .isInt()
    .withMessage('Invalid category ID'),
  body('note_id')
    .optional()
    .isInt()
    .withMessage('Invalid note ID')
];

const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('description')
    .optional()
    .trim(),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent')
];

const bulkCreateValidator = [
  body('tasks')
    .isArray({ min: 1 })
    .withMessage('Tasks must be a non-empty array'),
  body('tasks.*.title')
    .notEmpty()
    .trim()
    .withMessage('Each task must have a title')
];

const getTasksValidator = [
  query('status')
    .optional()
    .isIn(['todo', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  query('category_id')
    .optional()
    .isInt()
    .withMessage('Invalid category ID'),
  query('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  bulkCreateValidator,
  getTasksValidator
};
