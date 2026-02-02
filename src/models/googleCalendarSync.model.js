import { GoogleCalendarSync } from './orm/index.js';

class GoogleCalendarSyncModel {
  static async create(userId, syncData) {
    const sync = await GoogleCalendarSync.create({
      user_id: userId,
      ...syncData
    });
    return sync.toJSON();
  }

  static async findByUserId(userId) {
    const sync = await GoogleCalendarSync.findOne({
      where: { user_id: userId }
    });
    return sync ? sync.toJSON() : null;
  }

  static async update(userId, updates) {
    const sync = await GoogleCalendarSync.findOne({
      where: { user_id: userId }
    });
    
    if (!sync) return null;
    
    await sync.update(updates);
    return sync.toJSON();
  }

  static async updateTokens(userId, tokens) {
    const updates = {
      google_access_token: tokens.access_token,
      google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      sync_status: 'active',
      error_message: null
    };

    if (tokens.refresh_token) {
      updates.google_refresh_token = tokens.refresh_token;
    }

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
    const sync = await GoogleCalendarSync.findOne({
      where: { user_id: userId }
    });
    
    if (!sync) return null;
    
    const syncData = sync.toJSON();
    await sync.destroy();
    return syncData;
  }

  static async findActiveSync(userId) {
    const sync = await GoogleCalendarSync.findOne({
      where: { 
        user_id: userId,
        sync_enabled: true,
        sync_status: 'active'
      }
    });
    return sync ? sync.toJSON() : null;
  }

  static async getAllActiveSyncs() {
    const syncs = await GoogleCalendarSync.findAll({
      where: {
        sync_enabled: true,
        sync_status: 'active'
      }
    });
    return syncs.map(sync => sync.toJSON());
  }
}

export default GoogleCalendarSyncModel;