const express = require('express');
const router = express.Router();
const CalendarController = require('../controllers/calendar.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  getCalendarEventsValidator,
  getMonthCalendarValidator,
  getDayEventsValidator
} = require('../validators/calendar.validator');

// All routes require authentication
router.use(authMiddleware);

router.get('/events', getCalendarEventsValidator, CalendarController.getCalendarEvents);
router.get('/month/:year/:month', getMonthCalendarValidator, CalendarController.getMonthCalendar);
router.get('/day/:date', getDayEventsValidator, CalendarController.getDayEvents);

module.exports = router;
