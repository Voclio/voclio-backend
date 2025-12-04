const SettingsModel = require('../models/settings.model');
const { validationResult } = require('express-validator');
const { successResponse } = require('../utils/responses');
const { ValidationError, NotFoundError } = require('../utils/errors');

class SettingsController {
  static async getSettings(req, res, next) {
    try {
      const settings = await SettingsModel.findByUserId(req.user.user_id);

      if (!settings) {
        throw new NotFoundError('Settings not found');
      }

      return successResponse(res, { settings });

    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const updates = {};
      const allowedFields = ['theme', 'language', 'timezone', 'auto_backup', 
                            'backup_frequency', 'data_retention_days'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      const settings = await SettingsModel.update(req.user.user_id, updates);

      return successResponse(res, { settings }, 'Settings updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async updateTheme(req, res, next) {
    try {
      const { theme } = req.body;

      if (!theme || !['light', 'dark', 'auto'].includes(theme)) {
        throw new ValidationError('Invalid theme. Must be: light, dark, or auto');
      }

      const settings = await SettingsModel.updateTheme(req.user.user_id, theme);

      return successResponse(res, { settings }, 'Theme updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async updateLanguage(req, res, next) {
    try {
      const { language } = req.body;

      if (!language) {
        throw new ValidationError('Language is required');
      }

      const settings = await SettingsModel.updateLanguage(req.user.user_id, language);

      return successResponse(res, { settings }, 'Language updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async updateTimezone(req, res, next) {
    try {
      const { timezone } = req.body;

      if (!timezone) {
        throw new ValidationError('Timezone is required');
      }

      const settings = await SettingsModel.updateTimezone(req.user.user_id, timezone);

      return successResponse(res, { settings }, 'Timezone updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async getNotificationSettings(req, res, next) {
    try {
      const settings = await SettingsModel.findByUserId(req.user.user_id);

      if (!settings) {
        throw new NotFoundError('Settings not found');
      }

      const notificationSettings = {
        email_enabled: settings.email_enabled,
        whatsapp_enabled: settings.whatsapp_enabled,
        push_enabled: settings.push_enabled,
        email_for_reminders: settings.email_for_reminders,
        email_for_tasks: settings.email_for_tasks,
        whatsapp_for_reminders: settings.whatsapp_for_reminders
      };

      return successResponse(res, { notification_settings: notificationSettings });

    } catch (error) {
      next(error);
    }
  }

  static async updateNotificationSettings(req, res, next) {
    try {
      const settings = await SettingsModel.updateNotificationSettings(req.user.user_id, req.body);

      return successResponse(res, { settings }, 'Notification settings updated successfully');

    } catch (error) {
      next(error);
    }
  }
}

module.exports = SettingsController;
