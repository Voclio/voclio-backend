import ReminderModel from '../models/reminder.model.js';
import { validationResult } from 'express-validator';
import { successResponse, paginatedResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import NotificationService from '../services/notification.service.js';
class ReminderController {
  static async getAllReminders(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const reminders = await ReminderModel.findAll(req.user.user_id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const total = await ReminderModel.count(req.user.user_id);

      return paginatedResponse(res, reminders, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });

    } catch (error) {
      next(error);
    }
  }

  static async getReminderById(req, res, next) {
    try {
      const reminder = await ReminderModel.findById(req.params.id, req.user.user_id);

      if (!reminder) {
        throw new NotFoundError('Reminder not found');
      }

      return successResponse(res, { reminder });

    } catch (error) {
      next(error);
    }
  }

  static async createReminder(req, res, next) {
    try {
      const { task_id, reminder_time, reminder_type, notification_types } = req.body;

      if (!task_id || !reminder_time) {
        throw new ValidationError('Task ID and reminder time are required');
      }

      const reminder = await ReminderModel.create(req.user.user_id, {
        task_id,
        reminder_time,
        reminder_type,
        notification_types
      });

      // Send notification for reminder creation
      await NotificationService.notifyReminderCreated(req.user.user_id, reminder);

      return successResponse(res, { reminder }, 'Reminder created successfully', 201);

    } catch (error) {
      next(error);
    }
  }

  static async updateReminder(req, res, next) {
    try {
      const updates = {};
      ['reminder_time', 'reminder_type', 'notification_types'].forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const reminder = await ReminderModel.update(req.params.id, req.user.user_id, updates);

      if (!reminder) {
        throw new NotFoundError('Reminder not found');
      }

      return successResponse(res, { reminder }, 'Reminder updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async snoozeReminder(req, res, next) {
    try {
      const { snooze_minutes = 15 } = req.body;

      const reminder = await ReminderModel.snooze(req.params.id, req.user.user_id, snooze_minutes);

      if (!reminder) {
        throw new NotFoundError('Reminder not found');
      }

      return successResponse(res, { reminder }, `Reminder snoozed for ${snooze_minutes} minutes`);

    } catch (error) {
      next(error);
    }
  }

  static async dismissReminder(req, res, next) {
    try {
      const reminder = await ReminderModel.dismiss(req.params.id, req.user.user_id);

      if (!reminder) {
        throw new NotFoundError('Reminder not found');
      }

      return successResponse(res, { reminder }, 'Reminder dismissed');

    } catch (error) {
      next(error);
    }
  }

  static async deleteReminder(req, res, next) {
    try {
      const reminder = await ReminderModel.delete(req.params.id, req.user.user_id);

      if (!reminder) {
        throw new NotFoundError('Reminder not found');
      }

      return successResponse(res, null, 'Reminder deleted successfully');

    } catch (error) {
      next(error);
    }
  }

  static async getUpcomingReminders(req, res, next) {
    try {
      const reminders = await ReminderModel.findUpcoming(req.user.user_id);

      return successResponse(res, { reminders });

    } catch (error) {
      next(error);
    }
  }
}

export default ReminderController;
