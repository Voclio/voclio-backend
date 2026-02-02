import express from 'express';
import {
  getWebexAuthUrl,
  handleWebexCallback,
  getWebexMeetings,
  getTodayWebexMeetings,
  createWebexMeeting,
  getWebexMeetingById,
  updateWebexMeeting,
  deleteWebexMeeting,
  disconnectWebexCalendar,
  getWebexConnectionStatus
} from '../controllers/webexCalendar.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Webex OAuth routes
router.get('/auth', authMiddleware, getWebexAuthUrl);
router.get('/callback', authMiddleware, handleWebexCallback); // Keep auth middleware
router.get('/status', authMiddleware, getWebexConnectionStatus);
router.post('/disconnect', authMiddleware, disconnectWebexCalendar);

// Webex meetings routes
router.get('/meetings', 
  authMiddleware,
  [
    query('from').optional().isISO8601().withMessage('From date must be a valid ISO 8601 date'),
    query('to').optional().isISO8601().withMessage('To date must be a valid ISO 8601 date'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  getWebexMeetings
);

router.get('/meetings/today', authMiddleware, getTodayWebexMeetings);

router.post('/meetings',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Meeting title is required'),
    body('start').isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
    body('end').isISO8601().withMessage('End time must be a valid ISO 8601 date'),
    body('agenda').optional().isString().withMessage('Agenda must be a string'),
    body('password').optional().isString().withMessage('Password must be a string'),
    body('timezone').optional().isString().withMessage('Timezone must be a string'),
    body('enabledAutoRecordMeeting').optional().isBoolean().withMessage('Auto record must be boolean'),
    body('allowAnyUserToBeCoHost').optional().isBoolean().withMessage('Allow co-host must be boolean'),
    body('enabledJoinBeforeHost').optional().isBoolean().withMessage('Join before host must be boolean'),
    body('publicMeeting').optional().isBoolean().withMessage('Public meeting must be boolean'),
    body('sendEmail').optional().isBoolean().withMessage('Send email must be boolean')
  ],
  createWebexMeeting
);

router.get('/meetings/:meetingId',
  authMiddleware,
  [
    param('meetingId').notEmpty().withMessage('Meeting ID is required')
  ],
  getWebexMeetingById
);

router.put('/meetings/:meetingId',
  authMiddleware,
  [
    param('meetingId').notEmpty().withMessage('Meeting ID is required'),
    body('title').optional().notEmpty().withMessage('Meeting title cannot be empty'),
    body('start').optional().isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
    body('end').optional().isISO8601().withMessage('End time must be a valid ISO 8601 date'),
    body('agenda').optional().isString().withMessage('Agenda must be a string'),
    body('password').optional().isString().withMessage('Password must be a string'),
    body('timezone').optional().isString().withMessage('Timezone must be a string')
  ],
  updateWebexMeeting
);

router.delete('/meetings/:meetingId',
  authMiddleware,
  [
    param('meetingId').notEmpty().withMessage('Meeting ID is required')
  ],
  deleteWebexMeeting
);

export default router;