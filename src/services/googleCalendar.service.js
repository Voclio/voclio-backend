import { google } from 'googleapis';
import config from '../config/index.js';

class GoogleCalendarService {
  /**
   * Create a new OAuth2 client instance with credentials
   * This should be called per-request to avoid race conditions
   */
  static createClient(tokens = null) {
    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    if (tokens) {
      oauth2Client.setCredentials(tokens);
    }

    return oauth2Client;
  }

  /**
   * Generate OAuth URL for user to authorize Google Calendar access
   */
  static generateAuthUrl() {
    const oauth2Client = this.createClient();
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Generate OAuth URL for mobile apps (Flutter)
   */
  static generateMobileAuthUrl(customScheme = 'com.voclio.app') {
    const oauth2Client = this.createClient();
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      redirect_uri: `${customScheme}://oauth/callback`
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokens(code) {
    try {
      const oauth2Client = this.createClient();
      const { tokens } = await oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken) {
    try {
      const oauth2Client = this.createClient({
        refresh_token: refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Get user's calendar events
   */
  static async getEvents(tokens, options = {}) {
    try {
      const oauth2Client = this.createClient(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const {
        calendarId = 'primary',
        timeMin = new Date().toISOString(),
        timeMax,
        maxResults = 50,
        singleEvents = true,
        orderBy = 'startTime'
      } = options;

      const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents,
        orderBy
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  /**
   * Get events for a specific date range
   */
  static async getEventsInRange(tokens, startDate, endDate) {
    try {
      const events = await this.getEvents(tokens, {
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        maxResults: 100
      });

      return events.map(event => ({
        id: event.id,
        title: event.summary || 'No Title',
        description: event.description || '',
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location || '',
        attendees: event.attendees || [],
        creator: event.creator,
        organizer: event.organizer,
        status: event.status,
        htmlLink: event.htmlLink,
        isAllDay: !event.start.dateTime, // If no dateTime, it's all day
        type: 'google_calendar_event'
      }));
    } catch (error) {
      console.error('Error getting events in range:', error);
      throw error;
    }
  }

  /**
   * Get today's events
   */
  static async getTodayEvents(tokens) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await this.getEventsInRange(tokens, startOfDay, endOfDay);
  }

  /**
   * Get upcoming events (next 7 days)
   */
  static async getUpcomingEvents(tokens, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return await this.getEventsInRange(tokens, now, futureDate);
  }

  /**
   * Get user's calendars list
   */
  static async getCalendarsList(tokens) {
    try {
      const oauth2Client = this.createClient(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendars list:', error);
      throw error;
    }
  }

  /**
   * Create a new event in Google Calendar
   */
  static async createEvent(tokens, eventData, userTimezone = 'UTC') {
    try {
      const oauth2Client = this.createClient(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const {
        title,
        description,
        startDateTime,
        endDateTime,
        location,
        attendees = [],
        calendarId = 'primary'
      } = eventData;

      const event = {
        summary: title,
        description,
        location,
        start: {
          dateTime: startDateTime,
          timeZone: userTimezone
        },
        end: {
          dateTime: endDateTime,
          timeZone: userTimezone
        },
        attendees: attendees.map(email => ({ email }))
      };

      const response = await calendar.events.insert({
        calendarId,
        resource: event
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }
}

export default GoogleCalendarService;
