const { query, param } = require('express-validator');

const getCalendarEventsValidator = [
  query('start_date')
    .notEmpty()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),
  query('end_date')
    .notEmpty()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date')
];

const getMonthCalendarValidator = [
  param('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be between 2020 and 2100'),
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12')
];

const getDayEventsValidator = [
  param('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
];

module.exports = {
  getCalendarEventsValidator,
  getMonthCalendarValidator,
  getDayEventsValidator
};
