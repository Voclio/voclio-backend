import { google } from 'googleapis';
import config from '../config/index.js';

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Generate OAuth URL for user to authorize Google Calendar access
   */
  generateAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Generate OAuth URL for mobile apps (Flutter)
   */
  generateMobileAuthUrl(customScheme = 'com.voclio.app') {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      redirect_uri: `${customScheme}://oauth/callback`
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  /**
   * Set credentials for API calls
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Get user's calendar events
   */
  async getEvents(options = {}) {
    try {
      const {
        calendarId = 'primary',
        timeMin = new Date().toISOString(),
        timeMax,
        maxResults = 50,
        singleEvents = true,
        orderBy = 'startTime'
      } = options;

      const response = await this.calendar.events.list({
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
  async getEventsInRange(startDate, endDate) {
    try {
      const events = await this.getEvents({
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
  async getTodayEvents() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await this.getEventsInRange(startOfDay, endOfDay);
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return await this.getEventsInRange(now, futureDate);
  }

  /**
   * Get user's calendars list
   */
  async getCalendarsList() {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendars list:', error);
      throw error;
    }
  }

  /**
   * Create a new event in Google Calendar
   */
  async createEvent(eventData) {
    try {
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
          timeZone: 'Asia/Riyadh'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Asia/Riyadh'
        },
        attendees: attendees.map(email => ({ email }))
      };

      const response = await this.calendar.events.insert({
        calendarId,
        resource: event
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Check if user has valid credentials
   */
  hasValidCredentials() {
    const credentials = this.oauth2Client.credentials;
    return credentials && (credentials.access_token || credentials.refresh_token);
  }
}

export default GoogleCalendarService;