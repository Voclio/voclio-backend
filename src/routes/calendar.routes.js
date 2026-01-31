import express from 'express';
import CalendarController from '../controllers/calendar.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  getCalendarEventsValidator,
  getMonthCalendarValidator,
  getDayEventsValidator
} from '../validators/calendar.validator.js';

// All routes require authentication
router.use(authMiddleware);

router.get('/events', getCalendarEventsValidator, CalendarController.getCalendarEvents);
router.get('/month/:year/:month', getMonthCalendarValidator, CalendarController.getMonthCalendar);
router.get('/day/:date', getDayEventsValidator, CalendarController.getDayEvents);

export default router;
