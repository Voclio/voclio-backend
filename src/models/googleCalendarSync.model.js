import { GoogleCalendarSync } from './orm/index.js';
import encryptionService from '../services/encryption.service.js';

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

  static async getAllActiveSyncs() {
    const syncs = await GoogleCalendarSync.findAll({
      where: { sync_enabled: true, sync_status: 'active' }
    });
    return syncs.map(s => decryptRecord(s.toJSON()));
  }
}

export default GoogleCalendarSyncModel;
