const { body, param } = require('express-validator');

const createTagValidator = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag name must be between 1 and 50 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #FF5733)')
];

const updateTagValidator = [
  param('id')
    .isInt()
    .withMessage('Tag ID must be a valid integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag name must be between 1 and 50 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #FF5733)')
];

const tagIdValidator = [
  param('id')
    .isInt()
    .withMessage('Tag ID must be a valid integer')
];

module.exports = {
  createTagValidator,
  updateTagValidator,
  tagIdValidator
};
