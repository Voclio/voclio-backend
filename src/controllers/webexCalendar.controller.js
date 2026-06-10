import WebexCalendarService from '../services/webexCalendar.service.js';
import { WebexSync } from '../models/orm/index.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import logger from '../utils/logger.js';

const webexService = new WebexCalendarService();

const webexErr = (res, message, statusCode = 500, code = 'WEBEX_ERROR') =>
  errorResponse(res, { code, message }, statusCode);

const findActiveSync = userId =>
  WebexSync.findOne({
    where: { user_id: userId, is_active: true, sync_enabled: true }
  });

const refreshTokenIfNeeded = async webexSync => {
  if (!webexSync.expires_at || new Date() < webexSync.expires_at) {
    return webexSync.access_token;
  }

  const newTokens = await webexService.refreshAccessToken(webexSync.refresh_token);
  const newExpiresAt = new Date();
  newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in);

  await webexSync.update({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || webexSync.refresh_token,
    expires_in: newTokens.expires_in,
    expires_at: newExpiresAt
  });

  return newTokens.access_token;
};

const getAccessToken = async (userId, res) => {
  const webexSync = await findActiveSync(userId);
  if (!webexSync) {
    webexErr(res, 'Webex calendar not connected', 404, 'NOT_CONNECTED');
    return null;
  }

  try {
    return await refreshTokenIfNeeded(webexSync);
  } catch (error) {
    logger.error('Error refreshing Webex token', { error: error.message });
    webexErr(res, 'Webex token expired. Please reconnect your account.', 401, 'TOKEN_EXPIRED');
    return null;
  }
};

/**
 * Generate Webex OAuth authorization URL
 */
export const getWebexAuthUrl = async (req, res) => {
  try {
    const authUrl = webexService.generateAuthUrl(req.user.user_id);

    return successResponse(res, {
      authUrl,
      message: 'Webex authorization URL generated successfully'
    });
  } catch (error) {
    logger.error('Error generating Webex auth URL', { error: error.message });
    return webexErr(res, 'Failed to generate authorization URL');
  }
};

/**
 * Handle Webex OAuth callback (no auth — userId comes from signed state)
 */
export const handleWebexCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return webexErr(res, `Webex authorization failed: ${error}`, 400, 'OAUTH_DENIED');
    }

    if (!code || !state) {
      return webexErr(res, 'Authorization code and state are required', 400, 'VALIDATION_ERROR');
    }

    const userId = webexService.verifyOAuthState(state);
    const tokens = await webexService.getTokens(code);
    const userProfile = await webexService.getUserProfile(tokens.access_token);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    const [, created] = await WebexSync.upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expires_in: tokens.expires_in,
        expires_at: expiresAt,
        scope: tokens.scope,
        webex_user_id: userProfile.id,
        webex_user_email: userProfile.emails?.[0] || userProfile.userName,
        webex_display_name: userProfile.displayName,
        is_active: true,
        sync_enabled: true,
        last_sync_at: new Date()
      },
      { conflictFields: ['user_id'] }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const message = created
      ? 'Webex calendar connected successfully'
      : 'Webex calendar updated successfully';

    if (req.headers.accept?.includes('application/json')) {
      return successResponse(res, {
        message,
        webexUser: {
          id: userProfile.id,
          email: userProfile.emails?.[0] || userProfile.userName,
          displayName: userProfile.displayName
        }
      });
    }

    return res.send(`
      <html>
        <head><title>Webex Connected</title><meta charset="UTF-8"></head>
        <body style="font-family:Arial;text-align:center;padding:50px">
          <h2>✅ ${message}</h2>
          <p>You can close this window and return to the app.</p>
          <script>setTimeout(() => { window.location.href = '${frontendUrl}'; }, 2000);</script>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('Error handling Webex callback', { error: error.message });
    return webexErr(res, 'Failed to connect Webex calendar');
  }
};

/**
 * Get Webex meetings for current user
 */
export const getWebexMeetings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { from, to, days = 7 } = req.query;

    const webexSync = await findActiveSync(userId);
    if (!webexSync) {
      return webexErr(res, 'Webex calendar not connected', 404, 'NOT_CONNECTED');
    }

    const accessToken = await getAccessToken(userId, res);
    if (!accessToken) return;

    let meetings;
    if (from && to) {
      meetings = await webexService.getMeetingsInRange(accessToken, from, to);
    } else {
      meetings = await webexService.getUpcomingMeetings(accessToken, parseInt(days));
    }

    await webexSync.update({ last_sync_at: new Date() });

    return successResponse(res, {
      meetings,
      count: meetings.length,
      message: 'Webex meetings retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting Webex meetings', { error: error.message });
    return webexErr(res, 'Failed to retrieve Webex meetings');
  }
};

export const getTodayWebexMeetings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const webexSync = await findActiveSync(userId);
    if (!webexSync) {
      return webexErr(res, 'Webex calendar not connected', 404, 'NOT_CONNECTED');
    }

    const accessToken = await getAccessToken(userId, res);
    if (!accessToken) return;

    const meetings = await webexService.getTodayMeetings(accessToken);
    await webexSync.update({ last_sync_at: new Date() });

    return successResponse(res, {
      meetings,
      count: meetings.length,
      message: 'Today\'s Webex meetings retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting today Webex meetings', { error: error.message });
    return webexErr(res, 'Failed to retrieve today\'s Webex meetings');
  }
};

export const createWebexMeeting = async (req, res) => {
  try {
    const accessToken = await getAccessToken(req.user.user_id, res);
    if (!accessToken) return;

    const meeting = await webexService.createMeeting(accessToken, req.body);

    return successResponse(res, {
      meeting,
      message: 'Webex meeting created successfully'
    });
  } catch (error) {
    logger.error('Error creating Webex meeting', { error: error.message });
    return webexErr(res, 'Failed to create Webex meeting');
  }
};

export const getWebexMeetingById = async (req, res) => {
  try {
    const accessToken = await getAccessToken(req.user.user_id, res);
    if (!accessToken) return;

    const meeting = await webexService.getMeetingById(accessToken, req.params.meetingId);

    return successResponse(res, {
      meeting,
      message: 'Webex meeting retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting Webex meeting', { error: error.message });
    return webexErr(res, 'Failed to retrieve Webex meeting');
  }
};

export const updateWebexMeeting = async (req, res) => {
  try {
    const accessToken = await getAccessToken(req.user.user_id, res);
    if (!accessToken) return;

    const meeting = await webexService.updateMeeting(
      accessToken,
      req.params.meetingId,
      req.body
    );

    return successResponse(res, {
      meeting,
      message: 'Webex meeting updated successfully'
    });
  } catch (error) {
    logger.error('Error updating Webex meeting', { error: error.message });
    return webexErr(res, 'Failed to update Webex meeting');
  }
};

export const deleteWebexMeeting = async (req, res) => {
  try {
    const accessToken = await getAccessToken(req.user.user_id, res);
    if (!accessToken) return;

    await webexService.deleteMeeting(accessToken, req.params.meetingId);

    return successResponse(res, {
      message: 'Webex meeting deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting Webex meeting', { error: error.message });
    return webexErr(res, 'Failed to delete Webex meeting');
  }
};

export const disconnectWebexCalendar = async (req, res) => {
  try {
    const webexSync = await WebexSync.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!webexSync) {
      return webexErr(res, 'Webex calendar not connected', 404, 'NOT_CONNECTED');
    }

    await webexSync.update({
      is_active: false,
      sync_enabled: false
    });

    return successResponse(res, {
      message: 'Webex calendar disconnected successfully'
    });
  } catch (error) {
    logger.error('Error disconnecting Webex calendar', { error: error.message });
    return webexErr(res, 'Failed to disconnect Webex calendar');
  }
};

export const getWebexConnectionStatus = async (req, res) => {
  try {
    const webexSync = await WebexSync.findOne({
      where: { user_id: req.user.user_id, is_active: true }
    });

    if (!webexSync) {
      return successResponse(res, {
        connected: false,
        message: 'Webex calendar not connected'
      });
    }

    return successResponse(res, {
      connected: true,
      syncEnabled: webexSync.sync_enabled,
      webexUser: {
        id: webexSync.webex_user_id,
        email: webexSync.webex_user_email,
        displayName: webexSync.webex_display_name
      },
      lastSyncAt: webexSync.last_sync_at,
      message: 'Webex calendar connected'
    });
  } catch (error) {
    logger.error('Error getting Webex connection status', { error: error.message });
    return webexErr(res, 'Failed to get connection status');
  }
};
