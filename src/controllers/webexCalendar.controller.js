import WebexCalendarService from '../services/webexCalendar.service.js';
import { WebexSync } from '../models/orm/index.js';
import { successResponse, errorResponse } from '../utils/responses.js';

const webexService = new WebexCalendarService();

/**
 * Generate Webex OAuth authorization URL
 */
export const getWebexAuthUrl = async (req, res) => {
  try {
    const authUrl = webexService.generateAuthUrl();
    
    return successResponse(res, {
      authUrl,
      message: 'Webex authorization URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating Webex auth URL:', error);
    return errorResponse(res, 'Failed to generate authorization URL', 500);
  }
};

/**
 * Handle Webex OAuth callback
 */
export const handleWebexCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const userId = req.user.user_id;

    if (error) {
      return errorResponse(res, `Webex authorization failed: ${error}`, 400);
    }

    if (!code) {
      return errorResponse(res, 'Authorization code not provided', 400);
    }

    // Exchange code for tokens
    const tokens = await webexService.getTokens(code);
    
    // Get user profile from Webex
    const userProfile = await webexService.getUserProfile(tokens.access_token);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Save or update Webex sync record
    const [webexSync, created] = await WebexSync.upsert({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type || 'Bearer',
      expiresIn: tokens.expires_in,
      expiresAt,
      scope: tokens.scope,
      webexUserId: userProfile.id,
      webexUserEmail: userProfile.emails?.[0] || userProfile.userName,
      webexDisplayName: userProfile.displayName,
      isActive: true,
      syncEnabled: true,
      lastSyncAt: new Date()
    });

    return successResponse(res, {
      message: created ? 'Webex calendar connected successfully' : 'Webex calendar updated successfully',
      webexUser: {
        id: userProfile.id,
        email: userProfile.emails?.[0] || userProfile.userName,
        displayName: userProfile.displayName
      }
    });
  } catch (error) {
    console.error('Error handling Webex callback:', error);
    return errorResponse(res, 'Failed to connect Webex calendar', 500);
  }
};

/**
 * Get Webex meetings for current user
 */
export const getWebexMeetings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { from, to, days = 7 } = req.query;

    // Get user's Webex sync record
    const webexSync = await WebexSync.findOne({
      where: { userId, isActive: true, syncEnabled: true }
    });

    if (!webexSync) {
      return errorResponse(res, 'Webex calendar not connected', 404);
    }

    // Check if token is expired and refresh if needed
    let accessToken = webexSync.accessToken;
    if (webexSync.expiresAt && new Date() >= webexSync.expiresAt) {
      try {
        const newTokens = await webexService.refreshAccessToken(webexSync.refreshToken);
        
        // Update tokens in database
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);
        
        await webexSync.update({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || webexSync.refreshToken,
          expiresIn: newTokens.expires_in,
          expiresAt: newExpiresAt
        });
        
        accessToken = newTokens.access_token;
      } catch (refreshError) {
        console.error('Error refreshing Webex token:', refreshError);
        return errorResponse(res, 'Webex token expired. Please reconnect your account.', 401);
      }
    }

    let meetings;
    if (from && to) {
      meetings = await webexService.getMeetingsInRange(accessToken, from, to);
    } else {
      meetings = await webexService.getUpcomingMeetings(accessToken, parseInt(days));
    }

    // Update last sync time
    await webexSync.update({ lastSyncAt: new Date() });

    return successResponse(res, {
      meetings,
      count: meetings.length,
      message: 'Webex meetings retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting Webex meetings:', error);
    return errorResponse(res, 'Failed to retrieve Webex meetings', 500);
  }
};

/**
 * Get today's Webex meetings
 */
export const getTodayWebexMeetings = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const webexSync = await WebexSync.findOne({
      where: { userId, isActive: true, syncEnabled: true }
    });

    if (!webexSync) {
      return errorResponse(res, 'Webex calendar not connected', 404);
    }

    let accessToken = webexSync.accessToken;
    if (webexSync.expiresAt && new Date() >= webexSync.expiresAt) {
      try {
        const newTokens = await webexService.refreshAccessToken(webexSync.refreshToken);
        
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);
        
        await webexSync.update({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || webexSync.refreshToken,
          expiresIn: newTokens.expires_in,
          expiresAt: newExpiresAt
        });
        
        accessToken = newTokens.access_token;
      } catch (refreshError) {
        console.error('Error refreshing Webex token:', refreshError);
        return errorResponse(res, 'Webex token expired. Please reconnect your account.', 401);
      }
    }

    const meetings = await webexService.getTodayMeetings(accessToken);
    
    await webexSync.update({ lastSyncAt: new Date() });

    return successResponse(res, {
      meetings,
      count: meetings.length,
      message: "Today's Webex meetings retrieved successfully"
    });
  } catch (error) {
    console.error('Error getting today Webex meetings:', error);
    return errorResponse(res, "Failed to retrieve today's Webex meetings", 500);
  }
};

/**
 * Create a new Webex meeting
 */
export const createWebexMeeting = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const meetingData = req.body;

    const webexSync = await WebexSync.findOne({
      where: { userId, isActive: true, syncEnabled: true }
    });

    if (!webexSync) {
      return errorResponse(res, 'Webex calendar not connected', 404);
    }

    let accessToken = webexSync.accessToken;
    if (webexSync.expiresAt && new Date() >= webexSync.expiresAt) {
      try {
        const newTokens = await webexService.refreshAccessToken(webexSync.refreshToken);
        
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);
        
        await webexSync.update({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || webexSync.refreshToken,
          expiresIn: newTokens.expires_in,
          expiresAt: newExpiresAt
        });
        
        accessToken = newTokens.access_token;
      } catch (refreshError) {
        console.error('Error refreshing Webex token:', refreshError);
        return errorResponse(res, 'Webex token expired. Please reconnect your account.', 401);
      }
    }

    const meeting = await webexService.createMeeting(accessToken, meetingData);

    return successResponse(res, {
      meeting,
      message: 'Webex meeting created successfully'
    });
  } catch (error) {
    console.error('Error creating Webex meeting:', error);
    return errorResponse(res, 'Failed to create Webex meeting', 500);
  }
};

/**
 * Get Webex meeting by ID
 */
export const getWebexMeetingById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { meetingId } = req.params;

    const webexSync = await WebexSync.findOne({
      where: { userId, isActive: true, syncEnabled: true }
    });

    if (!webexSync) {
      return errorResponse(res, 'Webex calendar not connected', 404);
    }

    let accessToken = webexSync.accessToken;
    if (webexSync.expiresAt && new Date() >= webexSync.expiresAt) {
      try {
        const newTokens = await webexService.refreshAccessToken(webexSync.refreshToken);
        
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);
        
        await webexSync.update({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || webexSync.refreshToken,
          expiresIn: newTokens.expires_in,
          expiresAt: newExpiresAt
        });
        
        accessToken = newTokens.access_token;
      } catch (refreshError) {
        console.error('Error refreshing Webex token:', refreshError);
        return errorResponse(res, 'Webex token expired. Please reconnect your account.', 401);
      }
    }

    const meeting = await webexService.getMeetingById(accessToken, meetingId);

    return successResponse(res, {
      meeting,
      message: 'Webex meeting retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting Webex meeting:', error);
    return errorResponse(res, 'Failed to retrieve Webex meeting', 500);
  }
};

/**
 * Update Webex meeting
 */
export const updateWebexMeeting = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { meetingId } = req.params;
    const meetingData = req.body;

    const webexSync = await WebexSync.findOne({
      where: { userId, isActive: true, syncEnabled: true }
    });

    if (!webexSync) {
      return errorResponse(res, 'Webex calendar not connected', 404);
    }

    let accessToken = webexSync.accessToken;
    if (webexSync.expiresAt && new Date() >= webexSync.expiresAt) {
      try {
        const newTokens = await webexService.refreshAccessToken(webexSync.refreshToken);
        
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);
        
        await webexSync.update({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || webexSync.refreshToken,
          expiresIn: newTokens.expires_in,
          expiresAt: newExpiresAt
        });
        
        accessToken = newTokens.access_token;
      } catch (refreshError) {
        console.error('Error refreshing Webex token:', refreshError);
        return errorResponse(res, 'Webex token expired. Please reconnect your account.', 401);
      }
    }

    const meeting = await webexService.updateMeeting(accessToken, meetingId, meetingData);

    return successResponse(res, {
      meeting,
      message: 'Webex meeting updated successfully'
    });
  } catch (error) {
    console.error('Error updating Webex meeting:', error);
    return errorResponse(res, 'Failed to update Webex meeting', 500);
  }
};

/**
 * Delete Webex meeting
 */
export const deleteWebexMeeting = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { meetingId } = req.params;

    const webexSync = await WebexSync.findOne({
      where: { userId, isActive: true, syncEnabled: true }
    });

    if (!webexSync) {
      return errorResponse(res, 'Webex calendar not connected', 404);
    }

    let accessToken = webexSync.accessToken;
    if (webexSync.expiresAt && new Date() >= webexSync.expiresAt) {
      try {
        const newTokens = await webexService.refreshAccessToken(webexSync.refreshToken);
        
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);
        
        await webexSync.update({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || webexSync.refreshToken,
          expiresIn: newTokens.expires_in,
          expiresAt: newExpiresAt
        });
        
        accessToken = newTokens.access_token;
      } catch (refreshError) {
        console.error('Error refreshing Webex token:', refreshError);
        return errorResponse(res, 'Webex token expired. Please reconnect your account.', 401);
      }
    }

    await webexService.deleteMeeting(accessToken, meetingId);

    return successResponse(res, {
      message: 'Webex meeting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Webex meeting:', error);
    return errorResponse(res, 'Failed to delete Webex meeting', 500);
  }
};

/**
 * Disconnect Webex calendar
 */
export const disconnectWebexCalendar = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const webexSync = await WebexSync.findOne({
      where: { userId }
    });

    if (!webexSync) {
      return errorResponse(res, 'Webex calendar not connected', 404);
    }

    await webexSync.update({
      isActive: false,
      syncEnabled: false
    });

    return successResponse(res, {
      message: 'Webex calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Webex calendar:', error);
    return errorResponse(res, 'Failed to disconnect Webex calendar', 500);
  }
};

/**
 * Get Webex connection status
 */
export const getWebexConnectionStatus = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const webexSync = await WebexSync.findOne({
      where: { userId, isActive: true }
    });

    if (!webexSync) {
      return successResponse(res, {
        connected: false,
        message: 'Webex calendar not connected'
      });
    }

    return successResponse(res, {
      connected: true,
      syncEnabled: webexSync.syncEnabled,
      webexUser: {
        id: webexSync.webexUserId,
        email: webexSync.webexUserEmail,
        displayName: webexSync.webexDisplayName
      },
      lastSyncAt: webexSync.lastSyncAt,
      message: 'Webex calendar connected'
    });
  } catch (error) {
    console.error('Error getting Webex connection status:', error);
    return errorResponse(res, 'Failed to get connection status', 500);
  }
};