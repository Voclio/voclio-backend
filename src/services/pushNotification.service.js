import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import DeviceTokenModel from '../models/deviceToken.model.js';

let firebaseApp = null;

function loadServiceAccountCredentials() {
  // Option 1: individual env vars (recommended for production)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

  if (privateKey && clientEmail && projectId) {
    return {
      type: 'service_account',
      project_id: projectId,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID?.trim() || '',
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: clientEmail,
      client_id: process.env.FIREBASE_CLIENT_ID?.trim() || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
      universe_domain: 'googleapis.com'
    };
  }

  // Option 2: full JSON in a single env var
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  // Option 3: JSON file on disk (local dev fallback)
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    path.join(process.cwd(), 'config/firebase-service-account.json');

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function initFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const credentials = loadServiceAccountCredentials();
    if (!credentials) {
      logger.warn(
        'Firebase service account credentials not found, push notifications will be disabled'
      );
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
    logger.info('Firebase Admin initialized successfully for push notifications');
    logger.info('Firebase Admin initialized for push notifications');
    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin', { error: error.message });
    return null;
  }
}

class PushNotificationService {
  static isConfigured() {
    return Boolean(initFirebaseAdmin());
  }

  static async sendToUser(userId, payload) {
    const app = initFirebaseAdmin();
    if (!app) {
      return { sent: 0, skipped: true, reason: 'firebase_not_configured' };
    }

    const tokens = await DeviceTokenModel.findByUserId(userId);
    if (!tokens.length) {
      return { sent: 0, skipped: true, reason: 'no_device_tokens' };
    }

    const {
      title,
      body,
      type = 'general',
      priority = 'normal',
      related_id = null,
      notification_id = null
    } = payload;

    const message = {
      notification: {
        title,
        body
      },
      data: {
        type: String(type),
        priority: String(priority),
        related_id: related_id != null ? String(related_id) : '',
        notification_id: notification_id != null ? String(notification_id) : ''
      },
      android: {
        priority: priority === 'urgent' || priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: 'voclio_notifications',
          priority: priority === 'urgent' || priority === 'high' ? 'high' : 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      tokens: tokens.map(entry => entry.token)
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      const invalidTokens = [];

      response.responses.forEach((result, index) => {
        if (result.success) {
          return;
        }

        const errorCode = result.error?.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[index].token);
        }
      });

      if (invalidTokens.length) {
        await DeviceTokenModel.removeInvalidTokens(invalidTokens);
      }

      logger.info(`Push sent to user ${userId}: ${response.successCount}/${tokens.length}`);
      return {
        sent: response.successCount,
        failed: response.failureCount,
        invalidTokensRemoved: invalidTokens.length
      };
    } catch (error) {
      logger.error('Failed to send push notification', {
        userId,
        error: error.message
      });
      return { sent: 0, failed: tokens.length, error: error.message };
    }
  }
}

export default PushNotificationService;
