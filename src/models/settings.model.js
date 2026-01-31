import { UserSettings } from './orm/index.js';

class SettingsModel {
  static async findByUserId(userId) {
    const settings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    return settings ? settings.toJSON() : null;
  }

  static async update(userId, updates) {
    const settings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    
    if (!settings) return null;
    
    await settings.update(updates);
    return settings.toJSON();
  }

  static async updateTheme(userId, theme) {
    const settings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    
    if (!settings) return null;
    
    await settings.update({ theme });
    return settings.toJSON();
  }

  static async updateLanguage(userId, language) {
    const settings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    
    if (!settings) return null;
    
    await settings.update({ language });
    return settings.toJSON();
  }

  static async updateTimezone(userId, timezone) {
    const settings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    
    if (!settings) return null;
    
    await settings.update({ timezone });
    return settings.toJSON();
  }

  static async updateNotificationSettings(userId, settings) {
    const userSettings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    
    if (!userSettings) return null;
    
    const updates = {};
    if (settings.email_enabled !== undefined) updates.email_enabled = settings.email_enabled;
    if (settings.whatsapp_enabled !== undefined) updates.whatsapp_enabled = settings.whatsapp_enabled;
    if (settings.push_enabled !== undefined) updates.push_enabled = settings.push_enabled;
    if (settings.email_for_reminders !== undefined) updates.email_for_reminders = settings.email_for_reminders;
    if (settings.whatsapp_for_reminders !== undefined) updates.whatsapp_for_reminders = settings.whatsapp_for_reminders;
    
    await userSettings.update(updates);
    return userSettings.toJSON();
  }
}

export default SettingsModel;
