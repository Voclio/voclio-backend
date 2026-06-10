import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class WebexCalendarService {
  constructor() {
    this.apiUrl = config.webex.apiUrl;
    this.clientId = config.webex.clientId;
    this.clientSecret = config.webex.clientSecret;
    this.redirectUri = config.webex.redirectUri;
  }

  createOAuthState(userId) {
    return jwt.sign({ userId, purpose: 'webex_oauth' }, config.jwt.secret, { expiresIn: '15m' });
  }

  verifyOAuthState(state) {
    const decoded = jwt.verify(state, config.jwt.secret);
    if (decoded.purpose !== 'webex_oauth' || !decoded.userId) {
      throw new Error('Invalid OAuth state');
    }
    return decoded.userId;
  }

  /**
   * Generate OAuth URL for user to authorize Webex access
   */
  generateAuthUrl(userId) {
    const scopes = ['spark:meetings_read', 'spark:meetings_write', 'spark:people_read'];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state: this.createOAuthState(userId)
    });

    return `https://webexapis.com/v1/authorize?${params.toString()}`;
  }

  async postTokenRequest(body) {
    const response = await axios.post(
      'https://webexapis.com/v1/access_token',
      new URLSearchParams(body).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data;
  }

  /**
   * Exchange authorization code for access token
   */
  async getTokens(code) {
    try {
      return await this.postTokenRequest({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri
      });
    } catch (error) {
      logger.error('Error getting Webex tokens', {
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      return await this.postTokenRequest({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      });
    } catch (error) {
      logger.error('Error refreshing Webex token', {
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  /**
   * Get user's Webex meetings
   */
  async getMeetings(accessToken, options = {}) {
    try {
      const { from = new Date().toISOString(), to, max = 50, meetingType = 'meeting' } = options;

      const params = {
        from,
        max,
        meetingType
      };

      if (to) {
        params.to = to;
      }

      const response = await axios.get(`${this.apiUrl}/meetings`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching Webex meetings:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get meetings for a specific date range
   */
  async getMeetingsInRange(accessToken, startDate, endDate) {
    try {
      const meetings = await this.getMeetings(accessToken, {
        from: new Date(startDate).toISOString(),
        to: new Date(endDate).toISOString(),
        max: 100
      });

      return meetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title || 'Webex Meeting',
        description: meeting.agenda || '',
        start: meeting.start,
        end: meeting.end,
        location: meeting.webLink || '',
        hostEmail: meeting.hostEmail,
        hostDisplayName: meeting.hostDisplayName,
        meetingNumber: meeting.meetingNumber,
        password: meeting.password,
        phoneAndVideoSystemPassword: meeting.phoneAndVideoSystemPassword,
        meetingType: meeting.meetingType,
        state: meeting.state,
        timezone: meeting.timezone,
        type: 'webex_meeting',
        joinUrl: meeting.webLink,
        sipAddress: meeting.sipAddress,
        dialInIpAddress: meeting.dialInIpAddress
      }));
    } catch (error) {
      console.error('Error getting Webex meetings in range:', error);
      throw error;
    }
  }

  /**
   * Get today's meetings
   */
  async getTodayMeetings(accessToken) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await this.getMeetingsInRange(accessToken, startOfDay, endOfDay);
  }

  /**
   * Get upcoming meetings (next 7 days)
   */
  async getUpcomingMeetings(accessToken, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return await this.getMeetingsInRange(accessToken, now, futureDate);
  }

  /**
   * Create a new Webex meeting
   */
  async createMeeting(accessToken, meetingData) {
    try {
      const {
        title,
        agenda,
        start,
        end,
        timezone = 'Asia/Riyadh',
        password,
        enabledAutoRecordMeeting = false,
        allowAnyUserToBeCoHost = false,
        enabledJoinBeforeHost = false,
        enableConnectAudioBeforeHost = false,
        joinBeforeHostMinutes = 0,
        excludePassword = false,
        publicMeeting = false,
        reminderTime = 15,
        unlockedMeetingJoinSecurity = 'allowJoinWithLobby',
        sessionTypeId = 1,
        enabledWebcastView = false,
        panelistPassword,
        enableAutomaticLock = false,
        automaticLockMinutes = 0,
        allowFirstUserToBeCoHost = false,
        allowAuthenticatedDevices = false,
        sendEmail = true,
        hostEmail,
        siteUrl,
        meetingOptions = {}
      } = meetingData;

      const meeting = {
        title,
        agenda,
        start,
        end,
        timezone,
        enabledAutoRecordMeeting,
        allowAnyUserToBeCoHost,
        enabledJoinBeforeHost,
        enableConnectAudioBeforeHost,
        joinBeforeHostMinutes,
        excludePassword,
        publicMeeting,
        reminderTime,
        unlockedMeetingJoinSecurity,
        sessionTypeId,
        enabledWebcastView,
        enableAutomaticLock,
        automaticLockMinutes,
        allowFirstUserToBeCoHost,
        allowAuthenticatedDevices,
        sendEmail,
        ...meetingOptions
      };

      if (password) {
        meeting.password = password;
      }

      if (panelistPassword) {
        meeting.panelistPassword = panelistPassword;
      }

      if (hostEmail) {
        meeting.hostEmail = hostEmail;
      }

      if (siteUrl) {
        meeting.siteUrl = siteUrl;
      }

      const response = await axios.post(`${this.apiUrl}/meetings`, meeting, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Webex meeting:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update an existing Webex meeting
   */
  async updateMeeting(accessToken, meetingId, meetingData) {
    try {
      const response = await axios.put(`${this.apiUrl}/meetings/${meetingId}`, meetingData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating Webex meeting:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete a Webex meeting
   */
  async deleteMeeting(accessToken, meetingId) {
    try {
      await axios.delete(`${this.apiUrl}/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting Webex meeting:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get meeting details by ID
   */
  async getMeetingById(accessToken, meetingId) {
    try {
      const response = await axios.get(`${this.apiUrl}/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Webex meeting details:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.apiUrl}/people/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Webex user profile:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default WebexCalendarService;
