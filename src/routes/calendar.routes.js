import express from 'express';
import CalendarController from '../controllers/calendar.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  getCalendarEventsValidator,
  getMonthCalendarValidator,
  getDayEventsValidator
} from '../validators/calendar.validator.js';

// Google OAuth callback - NO AUTH REQUIRED (Google redirects here)
router.get('/google/callback', CalendarController.handleGoogleCallback);

// All other routes require authentication
router.use(authMiddleware);

// Calendar events routes
router.get('/events', getCalendarEventsValidator, CalendarController.getCalendarEvents);
router.get('/month/:year/:month', getMonthCalendarValidator, CalendarController.getMonthCalendar);
router.get('/day/:date', getDayEventsValidator, CalendarController.getDayEvents);

// Google Calendar integration routes
router.get('/google/connect', CalendarController.connectGoogleCalendar);
router.get('/google/connect/mobile', CalendarController.connectGoogleCalendarMobile);
router.post('/google/test-token', CalendarController.testWithToken);
router.post('/google/link-session', CalendarController.linkOAuthSession);
router.post('/google/callback/mobile', CalendarController.handleMobileCallback);
router.delete('/google/disconnect', CalendarController.disconnectGoogleCalendar);
router.get('/google/status', CalendarController.getGoogleCalendarStatus);
router.get('/google/events', getCalendarEventsValidator, CalendarController.getGoogleCalendarEvents);
router.get('/google/today', CalendarController.getTodayMeetings);
router.get('/google/upcoming', CalendarController.getUpcomingMeetings);

export default router;
