import { body, param, query } from 'express-validator';

export const createMeetingValidation = [
  body('title')
    .notEmpty()
    .withMessage('Meeting title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('start')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      if (startDate <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  
  body('end')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.start);
      if (endDate <= startDate) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('agenda')
    .optional()
    .isString()
    .withMessage('Agenda must be a string')
    .isLength({ max: 2000 })
    .withMessage('Agenda cannot exceed 2000 characters'),
  
  body('password')
    .optional()
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be between 4 and 50 characters'),
  
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),
  
  body('enabledAutoRecordMeeting')
    .optional()
    .isBoolean()
    .withMessage('Auto record must be boolean'),
  
  body('allowAnyUserToBeCoHost')
    .optional()
    .isBoolean()
    .withMessage('Allow co-host must be boolean'),
  
  body('enabledJoinBeforeHost')
    .optional()
    .isBoolean()
    .withMessage('Join before host must be boolean'),
  
  body('enableConnectAudioBeforeHost')
    .optional()
    .isBoolean()
    .withMessage('Connect audio before host must be boolean'),
  
  body('joinBeforeHostMinutes')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Join before host minutes must be between 0 and 60'),
  
  body('excludePassword')
    .optional()
    .isBoolean()
    .withMessage('Exclude password must be boolean'),
  
  body('publicMeeting')
    .optional()
    .isBoolean()
    .withMessage('Public meeting must be boolean'),
  
  body('reminderTime')
    .optional()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Reminder time must be between 0 and 1440 minutes'),
  
  body('sendEmail')
    .optional()
    .isBoolean()
    .withMessage('Send email must be boolean'),
  
  body('hostEmail')
    .optional()
    .isEmail()
    .withMessage('Host email must be a valid email address'),
  
  body('siteUrl')
    .optional()
    .isURL()
    .withMessage('Site URL must be a valid URL')
];

export const updateMeetingValidation = [
  param('meetingId')
    .notEmpty()
    .withMessage('Meeting ID is required'),
  
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Meeting title cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('start')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  
  body('end')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.start && value) {
        const endDate = new Date(value);
        const startDate = new Date(req.body.start);
        if (endDate <= startDate) {
          throw new Error('End time must be after start time');
        }
      }
      return true;
    }),
  
  body('agenda')
    .optional()
    .isString()
    .withMessage('Agenda must be a string')
    .isLength({ max: 2000 })
    .withMessage('Agenda cannot exceed 2000 characters'),
  
  body('password')
    .optional()
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be between 4 and 50 characters'),
  
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string')
];

export const getMeetingsValidation = [
  query('from')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid ISO 8601 date'),
  
  query('to')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.from && value) {
        const toDate = new Date(value);
        const fromDate = new Date(req.query.from);
        if (toDate <= fromDate) {
          throw new Error('To date must be after from date');
        }
      }
      return true;
    }),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

export const meetingIdValidation = [
  param('meetingId')
    .notEmpty()
    .withMessage('Meeting ID is required')
    .isString()
    .withMessage('Meeting ID must be a string')
];