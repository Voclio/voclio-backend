import TaskModel from '../models/task.model.js';
import ReminderModel from '../models/reminder.model.js';
import GoogleCalendarSyncModel from '../models/googleCalendarSync.model.js';
import GoogleCalendarService from '../services/googleCalendar.service.js';
import { successResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
class CalendarController {
  static async getCalendarEvents(req, res, next) {
    try {
      const { start_date, end_date, include_google = 'true' } = req.query;

      if (!start_date || !end_date) {
        throw new ValidationError('start_date and end_date are required');
      }

      // Get tasks within date range
      const tasks = await TaskModel.findAll(req.user.user_id, {});
      const filteredTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= new Date(start_date) && dueDate <= new Date(end_date);
      });

      // Get reminders within date range
      const reminders = await ReminderModel.findAll(req.user.user_id, {});
      const filteredReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminder_time);
        return reminderDate >= new Date(start_date) && reminderDate <= new Date(end_date);
      });

      // Get Google Calendar events if enabled
      let googleEvents = [];
      if (include_google === 'true') {
        try {
          const googleSync = await GoogleCalendarSyncModel.findActiveSync(req.user.user_id);
          if (googleSync) {
            const calendarService = new GoogleCalendarService();
            calendarService.setCredentials({
              access_token: googleSync.google_access_token,
              refresh_token: googleSync.google_refresh_token,
              expiry_date: googleSync.google_token_expiry
            });

            googleEvents = await calendarService.getEventsInRange(start_date, end_date);
          }
        } catch (error) {
          console.error('Error fetching Google Calendar events:', error);
          // Continue without Google events if there's an error
        }
      }

      // Format events for calendar
      const events = [
        ...filteredTasks.map(task => ({
          id: `task-${task.task_id}`,
          type: 'task',
          title: task.title,
          description: task.description,
          date: task.due_date,
          priority: task.priority,
          status: task.status,
          category_id: task.category_id,
          allDay: false,
          source: 'voclio'
        })),
        ...filteredReminders.map(reminder => ({
          id: `reminder-${reminder.reminder_id}`,
          type: 'reminder',
          title: reminder.title || 'Reminder',
          date: reminder.reminder_time,
          reminder_type: reminder.reminder_type,
          task_id: reminder.task_id,
          allDay: false,
          source: 'voclio'
        })),
        ...googleEvents.map(event => ({
          id: `google-${event.id}`,
          type: 'meeting',
          title: event.title,
          description: event.description,
          date: event.start,
          end_date: event.end,
          location: event.location,
          attendees: event.attendees,
          allDay: event.isAllDay,
          source: 'google_calendar',
          htmlLink: event.htmlLink
        }))
      ];

      // Sort by date
      events.sort((a, b) => new Date(a.date) - new Date(b.date));

      return successResponse(res, {
        events,
        period: { start_date, end_date },
        count: events.length,
        tasks_count: filteredTasks.length,
        reminders_count: filteredReminders.length,
        google_events_count: googleEvents.length,
        google_sync_enabled: googleEvents.length > 0
      });

    } catch (error) {
      next(error);
    }
  }

  static async getMonthCalendar(req, res, next) {
    try {
      const { year, month } = req.params;

      if (!year || !month) {
        throw new ValidationError('Year and month are required');
      }

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (monthNum < 1 || monthNum > 12) {
        throw new ValidationError('Month must be between 1 and 12');
      }

      // Calculate start and end of month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

      const start_date = startDate.toISOString();
      const end_date = endDate.toISOString();

      // Get tasks
      const tasks = await TaskModel.findAll(req.user.user_id, {});
      const monthTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= startDate && dueDate <= endDate;
      });

      // Get reminders
      const reminders = await ReminderModel.findAll(req.user.user_id, {});
      const monthReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminder_time);
        return reminderDate >= startDate && reminderDate <= endDate;
      });

      // Group events by day
      const eventsByDay = {};
      
      monthTasks.forEach(task => {
        const day = new Date(task.due_date).getDate();
        if (!eventsByDay[day]) {
          eventsByDay[day] = { tasks: [], reminders: [], count: 0 };
        }
        eventsByDay[day].tasks.push({
          task_id: task.task_id,
          title: task.title,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date
        });
        eventsByDay[day].count++;
      });

      monthReminders.forEach(reminder => {
        const day = new Date(reminder.reminder_time).getDate();
        if (!eventsByDay[day]) {
          eventsByDay[day] = { tasks: [], reminders: [], count: 0 };
        }
        eventsByDay[day].reminders.push({
          reminder_id: reminder.reminder_id,
          title: reminder.title || 'Reminder',
          reminder_time: reminder.reminder_time,
          task_id: reminder.task_id
        });
        eventsByDay[day].count++;
      });

      return successResponse(res, {
        year: yearNum,
        month: monthNum,
        month_name: new Date(yearNum, monthNum - 1).toLocaleString('en', { month: 'long' }),
        days_in_month: endDate.getDate(),
        events_by_day: eventsByDay,
        total_events: monthTasks.length + monthReminders.length,
        tasks_count: monthTasks.length,
        reminders_count: monthReminders.length
      });

    } catch (error) {
      next(error);
    }
  }

  static async getDayEvents(req, res, next) {
    try {
      const { date } = req.params;
      const { include_google = 'true' } = req.query;

      if (!date) {
        throw new ValidationError('Date is required');
      }

      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Get tasks for the day
      const tasks = await TaskModel.findAll(req.user.user_id, {});
      const dayTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= startOfDay && dueDate <= endOfDay;
      });

      // Get reminders for the day
      const reminders = await ReminderModel.findAll(req.user.user_id, {});
      const dayReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminder_time);
        return reminderDate >= startOfDay && reminderDate <= endOfDay;
      });

      // Get Google Calendar events for the day
      let googleEvents = [];
      if (include_google === 'true') {
        try {
          const googleSync = await GoogleCalendarSyncModel.findActiveSync(req.user.user_id);
          if (googleSync) {
            const calendarService = new GoogleCalendarService();
            calendarService.setCredentials({
              access_token: googleSync.google_access_token,
              refresh_token: googleSync.google_refresh_token,
              expiry_date: googleSync.google_token_expiry
            });

            googleEvents = await calendarService.getEventsInRange(startOfDay, endOfDay);
          }
        } catch (error) {
          console.error('Error fetching Google Calendar events for day:', error);
        }
      }

      return successResponse(res, {
        date,
        tasks: dayTasks,
        reminders: dayReminders,
        meetings: googleEvents,
        total_events: dayTasks.length + dayReminders.length + googleEvents.length,
        google_events_count: googleEvents.length
      });

    } catch (error) {
      next(error);
    }
  }

  // Google Calendar Integration Methods
  static async connectGoogleCalendar(req, res, next) {
    try {
      const calendarService = new GoogleCalendarService();
      const authUrl = calendarService.generateAuthUrl();

      return successResponse(res, {
        auth_url: authUrl,
        message: 'Visit the auth_url to authorize Google Calendar access'
      });

    } catch (error) {
      next(error);
    }
  }

  // Mobile/Flutter specific OAuth URL
  static async connectGoogleCalendarMobile(req, res, next) {
    try {
      const { custom_scheme = 'com.voclio.app' } = req.query;
      const calendarService = new GoogleCalendarService();
      const authUrl = calendarService.generateMobileAuthUrl(custom_scheme);

      return successResponse(res, {
        auth_url: authUrl,
        custom_scheme,
        message: 'Use this URL for mobile OAuth flow'
      });

    } catch (error) {
      next(error);
    }
  }

  // Handle mobile OAuth callback with authorization code
  static async handleMobileCallback(req, res, next) {
    try {
      const { code, custom_scheme = 'com.voclio.app' } = req.body;

      if (!code) {
        throw new ValidationError('Authorization code is required');
      }

      const calendarService = new GoogleCalendarService();
      
      // Temporarily set the redirect URI for token exchange
      calendarService.oauth2Client.redirectUri = `${custom_scheme}://oauth/callback`;
      
      const tokens = await calendarService.getTokens(code);

      // Save or update sync configuration
      const existingSync = await GoogleCalendarSyncModel.findByUserId(req.user.user_id);
      
      if (existingSync) {
        await GoogleCalendarSyncModel.updateTokens(req.user.user_id, tokens);
      } else {
        await GoogleCalendarSyncModel.create(req.user.user_id, {
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          calendar_id: 'primary',
          calendar_name: 'Primary Calendar',
          sync_enabled: true,
          sync_status: 'active'
        });
      }

      return successResponse(res, {
        message: 'Google Calendar connected successfully',
        sync_enabled: true,
        tokens: {
          access_token: tokens.access_token,
          expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : null
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Test endpoint with manual token
  static async testWithToken(req, res, next) {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        throw new ValidationError('Access token is required');
      }

      const calendarService = new GoogleCalendarService();
      calendarService.setCredentials({ access_token });

      // Test API call
      const events = await calendarService.getTodayEvents();

      return successResponse(res, {
        message: 'Google Calendar API test successful',
        events_count: events.length,
        events: events.slice(0, 3) // First 3 events only
      });

    } catch (error) {
      next(error);
    }
  }

  // Link OAuth session to user account
  static async linkOAuthSession(req, res, next) {
    try {
      const { session_id } = req.body;

      if (!session_id) {
        throw new ValidationError('Session ID is required');
      }

      // Check if session exists and is valid
      const sessions = global.oauthSessions || {};
      const session = sessions[session_id];

      if (!session) {
        throw new ValidationError('Invalid or expired session ID');
      }

      if (Date.now() > session.expires) {
        delete sessions[session_id];
        throw new ValidationError('Session has expired');
      }

      const tokens = session.tokens;

      // Save or update sync configuration
      const existingSync = await GoogleCalendarSyncModel.findByUserId(req.user.user_id);
      
      if (existingSync) {
        await GoogleCalendarSyncModel.updateTokens(req.user.user_id, tokens);
      } else {
        await GoogleCalendarSyncModel.create(req.user.user_id, {
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          calendar_id: 'primary',
          calendar_name: 'Primary Calendar',
          sync_enabled: true,
          sync_status: 'active'
        });
      }

      // Clean up session
      delete sessions[session_id];

      return successResponse(res, {
        message: 'Google Calendar linked successfully',
        sync_enabled: true,
        tokens: {
          access_token: tokens.access_token,
          expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : null
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async handleGoogleCallback(req, res, next) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).send(`
          <html>
            <head><title>OAuth Error</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h2>❌ خطأ في OAuth</h2>
              <p>لم يتم العثور على authorization code</p>
              <button onclick="window.close()">إغلاق النافذة</button>
            </body>
          </html>
        `);
      }

      const calendarService = new GoogleCalendarService();
      const tokens = await calendarService.getTokens(code);

      // Store tokens temporarily with a session ID
      const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // In production, use Redis or database. For now, use memory (will be lost on restart)
      global.oauthSessions = global.oauthSessions || {};
      global.oauthSessions[sessionId] = {
        tokens,
        timestamp: Date.now(),
        expires: Date.now() + (10 * 60 * 1000) // 10 minutes
      };

      // Return success page with session ID
      return res.send(`
        <html>
          <head>
            <title>OAuth Success</title>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .success { color: #34a853; font-size: 24px; margin-bottom: 20px; }
              .session-id { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; margin: 20px 0; word-break: break-all; }
              .btn { background: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
              .instructions { text-align: right; direction: rtl; margin-top: 20px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✅ تم ربط Google Calendar بنجاح!</div>
              
              <p><strong>Session ID:</strong></p>
              <div class="session-id">${sessionId}</div>
              
              <div class="instructions">
                <h3>الخطوات التالية:</h3>
                <ol>
                  <li>انسخ الـ Session ID أعلاه</li>
                  <li>اذهب إلى صفحة الاختبار</li>
                  <li>استخدم الـ Session ID لربط الحساب</li>
                </ol>
              </div>
              
              <button class="btn" onclick="copySessionId()">📋 نسخ Session ID</button>
              <button class="btn" onclick="window.close()">إغلاق النافذة</button>
            </div>
            
            <script>
              function copySessionId() {
                navigator.clipboard.writeText('${sessionId}').then(() => {
                  alert('تم نسخ Session ID!');
                });
              }
            </script>
          </body>
        </html>
      `);

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.status(500).send(`
        <html>
          <head><title>OAuth Error</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2>❌ خطأ في OAuth</h2>
            <p>${error.message}</p>
            <button onclick="window.close()">إغلاق النافذة</button>
          </body>
        </html>
      `);
    }
  }

  static async disconnectGoogleCalendar(req, res, next) {
    try {
      const deleted = await GoogleCalendarSyncModel.delete(req.user.user_id);

      if (!deleted) {
        throw new NotFoundError('Google Calendar sync not found');
      }

      return successResponse(res, {
        message: 'Google Calendar disconnected successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  static async getGoogleCalendarStatus(req, res, next) {
    try {
      const sync = await GoogleCalendarSyncModel.findByUserId(req.user.user_id);

      return successResponse(res, {
        connected: !!sync,
        sync_enabled: sync?.sync_enabled || false,
        sync_status: sync?.sync_status || 'not_connected',
        calendar_name: sync?.calendar_name || null,
        last_sync_at: sync?.last_sync_at || null,
        error_message: sync?.error_message || null
      });

    } catch (error) {
      next(error);
    }
  }

  static async getGoogleCalendarEvents(req, res, next) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        throw new ValidationError('start_date and end_date are required');
      }

      const googleSync = await GoogleCalendarSyncModel.findActiveSync(req.user.user_id);
      
      if (!googleSync) {
        throw new NotFoundError('Google Calendar not connected');
      }

      const calendarService = new GoogleCalendarService();
      calendarService.setCredentials({
        access_token: googleSync.google_access_token,
        refresh_token: googleSync.google_refresh_token,
        expiry_date: googleSync.google_token_expiry
      });

      const events = await calendarService.getEventsInRange(start_date, end_date);

      return successResponse(res, {
        events,
        count: events.length,
        period: { start_date, end_date }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getTodayMeetings(req, res, next) {
    try {
      const googleSync = await GoogleCalendarSyncModel.findActiveSync(req.user.user_id);
      
      if (!googleSync) {
        return successResponse(res, {
          meetings: [],
          count: 0,
          message: 'Google Calendar not connected'
        });
      }

      const calendarService = new GoogleCalendarService();
      calendarService.setCredentials({
        access_token: googleSync.google_access_token,
        refresh_token: googleSync.google_refresh_token,
        expiry_date: googleSync.google_token_expiry
      });

      const meetings = await calendarService.getTodayEvents();

      return successResponse(res, {
        meetings,
        count: meetings.length,
        date: new Date().toISOString().split('T')[0]
      });

    } catch (error) {
      next(error);
    }
  }

  static async getUpcomingMeetings(req, res, next) {
    try {
      const { days = 7 } = req.query;

      const googleSync = await GoogleCalendarSyncModel.findActiveSync(req.user.user_id);
      
      if (!googleSync) {
        return successResponse(res, {
          meetings: [],
          count: 0,
          message: 'Google Calendar not connected'
        });
      }

      const calendarService = new GoogleCalendarService();
      calendarService.setCredentials({
        access_token: googleSync.google_access_token,
        refresh_token: googleSync.google_refresh_token,
        expiry_date: googleSync.google_token_expiry
      });

      const meetings = await calendarService.getUpcomingEvents(parseInt(days));

      return successResponse(res, {
        meetings,
        count: meetings.length,
        days: parseInt(days)
      });

    } catch (error) {
      next(error);
    }
  }
}

export default CalendarController;
