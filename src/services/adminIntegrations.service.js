import { Op } from 'sequelize';
import {
  User,
  VoiceRecording,
  FocusSession,
  AppConfig,
  GoogleCalendarSync,
  sequelize
} from '../models/orm/index.js';
import config from '../config/index.js';
import redisClient from '../config/redis.js';
import PushNotificationService from './pushNotification.service.js';

const FEATURE_FLAG_KEYS = [
  'voice_recording_enabled',
  'google_calendar_enabled',
  'home_widgets_enabled',
  'ai_suggestions_enabled',
  'webex_integration_enabled',
  'onboarding_enabled'
];

class AdminIntegrationsService {
  static getServicesStatus() {
    const storageConfigured =
      config.storage.provider === 'local' ||
      (config.storage.provider === 'cloudinary' &&
        Boolean(
          (config.storage.cloudName || '').trim() &&
            (config.storage.cloudinaryApiKey || '').trim() &&
            (config.storage.cloudinaryApiSecret || '').trim()
        )) ||
      (['s3', 'r2'].includes(config.storage.provider) &&
        Boolean(
          (config.storage.accessKeyId || '').trim() &&
            (config.storage.secretAccessKey || '').trim()
        ));

    return {
      database: 'unknown',
      redis: {
        enabled: redisClient.isEnabled,
        connected: redisClient.isConnected,
        host: config.redis.host === 'disabled' ? null : config.redis.host
      },
      storage: {
        provider: config.storage.provider,
        configured: storageConfigured,
        bucket: config.storage.bucket
      },
      email: {
        provider: process.env.RESEND_API_KEY ? 'resend' : process.env.EMAIL_USER ? 'smtp' : 'none',
        configured: Boolean(
          (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key_here') ||
            process.env.EMAIL_USER
        )
      },
      ai: {
        gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
        openrouter: Boolean(process.env.OPENROUTER_API_KEY),
        assemblyai: Boolean(process.env.ASSEMBLYAI_API_KEY)
      },
      oauth: {
        google: Boolean(process.env.GOOGLE_CLIENT_ID),
        facebook: Boolean(process.env.FACEBOOK_APP_ID),
        webex: Boolean(process.env.WEBEX_CLIENT_ID)
      },
      push: {
        configured: PushNotificationService.isConfigured(),
        provider: 'firebase'
      }
    };
  }

  static async getOverview() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      googleUsers,
      facebookUsers,
      webexUsers,
      emailUsers,
      totalUsers,
      totalRecordings,
      transcriptionsWeek,
      totalFocusSessions,
      focusMinutes,
      calendarTotal,
      calendarActive,
      calendarErrors,
      calendarSyncedWeek,
      featureRows
    ] = await Promise.all([
      User.count({ where: { oauth_provider: 'google' } }),
      User.count({ where: { oauth_provider: 'facebook' } }),
      User.count({ where: { oauth_provider: 'webex' } }).catch(() => 0),
      User.count({ where: { oauth_provider: null, password: { [Op.ne]: null } } }),
      User.count(),
      VoiceRecording.count(),
      VoiceRecording.count({
        where: { transcription_text: { [Op.ne]: null }, created_at: { [Op.gte]: weekAgo } }
      }),
      FocusSession.count(),
      FocusSession.sum('elapsed_time').then(v => v || 0),
      GoogleCalendarSync.count().catch(() => 0),
      GoogleCalendarSync.count({ where: { sync_enabled: true, sync_status: 'active' } }).catch(() => 0),
      GoogleCalendarSync.count({ where: { sync_status: 'error' } }).catch(() => 0),
      GoogleCalendarSync.count({
        where: { last_sync_at: { [Op.gte]: weekAgo } }
      }).catch(() => 0),
      AppConfig.findAll({
        where: { config_key: { [Op.in]: FEATURE_FLAG_KEYS } },
        order: [['config_key', 'ASC']]
      })
    ]);

    const oauthTotal = googleUsers + facebookUsers + webexUsers;
    const featureFlags = {};
    featureRows.forEach(row => {
      featureFlags[row.config_key] = {
        value: row.config_value === 'true',
        description: row.description,
        updated_at: row.updated_at
      };
    });

    FEATURE_FLAG_KEYS.forEach(key => {
      if (!featureFlags[key]) {
        featureFlags[key] = { value: true, description: null, updated_at: null };
      }
    });

    return {
      oauth: {
        total: oauthTotal,
        google: googleUsers,
        facebook: facebookUsers,
        webex: webexUsers,
        email_signup: emailUsers,
        total_users: totalUsers
      },
      voice: {
        total_recordings: totalRecordings,
        transcriptions_this_week: transcriptionsWeek
      },
      focus: {
        total_sessions: totalFocusSessions,
        total_minutes: Math.round((focusMinutes || 0) / 60)
      },
      calendar: {
        total_connections: calendarTotal,
        active_syncs: calendarActive,
        error_syncs: calendarErrors,
        synced_this_week: calendarSyncedWeek
      },
      feature_flags: featureFlags,
      services: AdminIntegrationsService.getServicesStatus()
    };
  }

  static async getCalendarSyncs({ page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    const where = {};
    if (status && status !== 'all') where.sync_status = status;

    const { count, rows } = await GoogleCalendarSync.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'email', 'name'],
          required: false
        }
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset
    });

    return {
      data: rows.map(row => ({
        sync_id: row.sync_id,
        user_id: row.user_id,
        user_email: row.user?.email ?? null,
        user_name: row.user?.name ?? null,
        calendar_id: row.calendar_id,
        calendar_name: row.calendar_name,
        sync_enabled: row.sync_enabled,
        sync_status: row.sync_status,
        last_sync_at: row.last_sync_at,
        error_message: row.error_message,
        updated_at: row.updated_at
      })),
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit) || 1
      }
    };
  }

  static async ensureFeatureFlags() {
    const defaults = [
      ['voice_recording_enabled', 'true', 'Enable voice recording and transcription'],
      ['google_calendar_enabled', 'true', 'Allow users to connect Google Calendar'],
      ['home_widgets_enabled', 'true', 'Enable home screen widgets on mobile'],
      ['ai_suggestions_enabled', 'true', 'Enable AI productivity suggestions'],
      ['webex_integration_enabled', 'true', 'Enable Webex OAuth and meetings'],
      ['onboarding_enabled', 'true', 'Show onboarding flow for new users']
    ];

    for (const [key, value, description] of defaults) {
      await AppConfig.findOrCreate({
        where: { config_key: key },
        defaults: { config_value: value, description }
      });
    }
  }
}

export default AdminIntegrationsService;
