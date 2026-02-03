import { body, query } from 'express-validator';

const createFocusSessionValidator = [
  body('timer_duration')
    .optional()
    .isInt({ min: 1, max: 180 })
    .withMessage('Timer duration must be between 1 and 180 minutes'),
  body('ambient_sound')
    .optional()
    .isIn(['rain', 'ocean', 'forest', 'cafe', 'white_noise', 'none'])
    .withMessage('Invalid ambient sound'),
  body('sound_volume')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Sound volume must be between 0 and 100')
];

const updateFocusSessionValidator = [
  body('status')
    .optional()
    .isIn(['active', 'paused', 'completed'])
    .withMessage('Status must be: active, paused, or completed'),
  body('elapsed_time')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Elapsed time must be a positive integer'),
  body('ambient_sound')
    .optional()
    .isIn(['rain', 'ocean', 'forest', 'cafe', 'white_noise', 'none'])
    .withMessage('Invalid ambient sound'),
  body('sound_volume')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Sound volume must be between 0 and 100')
];

const getSummaryValidator = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date'),
  query('period')
    .optional()
    .isIn(['today', 'week', 'month'])
    .withMessage('period must be: today, week, or month'),
  // Custom validation to ensure either dates or period is provided
  query().custom((value, { req }) => {
    const { start_date, end_date, period } = req.query;
    if (!period && (!start_date || !end_date)) {
      throw new Error('Either provide start_date and end_date, or use period parameter');
    }
    return true;
  })
];

export {
  createFocusSessionValidator,
  updateFocusSessionValidator,
  getSummaryValidator
};
