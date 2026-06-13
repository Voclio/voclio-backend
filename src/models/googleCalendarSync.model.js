import { GoogleCalendarSync } from './orm/index.js';
import encryptionService from '../services/encryption.service.js';
import GoogleCalendarService from '../services/googleCalendar.service.js';

/**
 * Encrypt tokens before persisting to DB
 */
function encryptRecord(data) {
  const out = { ...data };
  if (out.google_access_token)
    out.google_access_token = encryptionService.encryptField(out.google_access_token);
  if (out.google_refresh_token)
    out.google_refresh_token = encryptionService.encryptField(out.google_refresh_token);
  return out;
}

/**
 * Decrypt tokens after reading from DB
 */
function decryptRecord(record) {
  if (!record) return null;
  return {
    ...record,
    google_access_token: encryptionService.decryptField(record.google_access_token),
    google_refresh_token: encryptionService.decryptField(record.google_refresh_token)
  };
}

class GoogleCalendarSyncModel {
  static async create(userId, syncData) {
    const sync = await GoogleCalendarSync.create({
      user_id: userId,
      ...encryptRecord(syncData)
    });
    return decryptRecord(sync.toJSON());
  }

  static async findByUserId(userId) {
    const sync = await GoogleCalendarSync.findOne({ where: { user_id: userId } });
    return decryptRecord(sync?.toJSON() ?? null);
  }

  static async update(userId, updates) {
    const sync = await GoogleCalendarSync.findOne({ where: { user_id: userId } });
    if (!sync) return null;
    await sync.update(encryptRecord(updates));
    return decryptRecord(sync.toJSON());
  }

  static async updateTokens(userId, tokens) {
    const updates = {
      google_access_token: tokens.access_token,
      google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      sync_status: 'active',
      error_message: null
    };
    if (tokens.refresh_token) updates.google_refresh_token = tokens.refresh_token;
    return await this.update(userId, updates);
  }

  static async updateSyncStatus(userId, status, errorMessage = null) {
    return await this.update(userId, {
      sync_status: status,
      error_message: errorMessage,
      last_sync_at: new Date()
    });
  }

  static async delete(userId) {
    const sync = await GoogleCalendarSync.findOne({ where: { user_id: userId } });
    if (!sync) return null;
    const data = decryptRecord(sync.toJSON());
    await sync.destroy();
    return data;
  }

  static async findActiveSync(userId) {
    const sync = await GoogleCalendarSync.findOne({
      where: { user_id: userId, sync_enabled: true, sync_status: 'active' }
    });
    return decryptRecord(sync?.toJSON() ?? null);
  }

  /**
   * Resolve Google tokens for API calls, refreshing expired access tokens when possible.
   */
  static async resolveTokensForUser(userId) {
    const sync = await this.findByUserId(userId);
    if (!sync?.google_access_token || sync.sync_enabled === false) {
      return null;
    }

    let tokens = {
      access_token: sync.google_access_token,
      refresh_token: sync.google_refresh_token,
      expiry_date: sync.google_token_expiry
        ? new Date(sync.google_token_expiry).getTime()
        : undefined
    };

    const isExpired =
      sync.google_token_expiry && new Date(sync.google_token_expiry) <= new Date();

    if (isExpired && sync.google_refresh_token) {
      try {
        const refreshed = await GoogleCalendarService.refreshAccessToken(
          sync.google_refresh_token
        );
        await this.updateTokens(userId, refreshed);
        tokens = {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || sync.google_refresh_token,
          expiry_date: refreshed.expiry_date
        };
      } catch (error) {
        await this.updateSyncStatus(userId, 'error', error.message);
        return null;
      }
    }

    return { sync, tokens };
  }

  static async getAllActiveSyncs() {
    const syncs = await GoogleCalendarSync.findAll({
      where: { sync_enabled: true, sync_status: 'active' }
    });
    return syncs.map(s => decryptRecord(s.toJSON()));
  }
}

export default GoogleCalendarSyncModel;
