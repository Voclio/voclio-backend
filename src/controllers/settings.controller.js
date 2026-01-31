import { UserSettings } from '../models/orm/index.js';
import { validationResult } from 'express-validator';
import { successResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

class SettingsController {
  static async getSettings(req, res, next) {
    try {
      const settings = await UserSettings.findOne({
        where: { user_id: req.user.user_id }
      });

      if (!settings) {
        throw new NotFoundError('Settings not found');
      }

      return successResponse(res, { settings: settings.toJSON() });

    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const updates = {};
      const allowedFields = ['theme', 'language', 'timezone'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      await UserSettings.update(updates, {
        where: { user_id: req.user.user_id }
      });

      const settings = await UserSettings.findOne({
        where: { user_id: req.user.user_id }
      });

      return successResponse(res, { settings: settings.toJSON() }, 'Settings updated successfully');

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

      await UserSettings.update(
        { theme },
        { where: { user_id: req.user.user_id } }
      );

      const settings = await UserSettings.findOne({
        where: { user_id: req.user.user_id }
      });

      return successResponse(res, { settings: settings.toJSON() }, 'Theme updated successfully');

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

      await UserSettings.update(
        { language },
        { where: { user_id: req.user.user_id } }
      );

      const settings = await UserSettings.findOne({
        where: { user_id: req.user.user_id }
      });

      return successResponse(res, { settings: settings.toJSON() }, 'Language updated successfully');

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

      await UserSettings.update(
        { timezone },
        { where: { user_id: req.user.user_id } }
      );

      const settings = await UserSettings.findOne({
        where: { user_id: req.user.user_id }
      });

      return successResponse(res, { settings: settings.toJSON() }, 'Timezone updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async getNotificationSettings(req, res, next) {
    try {
      const settings = await UserSettings.findOne({
        where: { user_id: req.user.user_id }
      });

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
      const updates = {};
      const allowedFields = ['email_enabled', 'whatsapp_enabled', 'push_enabled', 
                            'email_for_reminders', 'email_for_tasks', 'whatsapp_for_reminders'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      await UserSettings.update(updates, {
        where: { user_id: req.user.user_id }
      });

      const settings = await UserSettings.findOne({
        where: { user_id: req.user.user_id }
      });

      return successResponse(res, { settings: settings.toJSON() }, 'Notification settings updated successfully');

    } catch (error) {
      next(error);
    }
  }
}

export default SettingsController;
