import { Reminder, sequelize } from './orm/index.js';
import { Op } from 'sequelize';

class ReminderModel {
  static async create(userId, reminderData) {
    const reminder = await Reminder.create({
      user_id: userId,
      reminder_type: reminderData.reminder_type || 'one_time',
      notification_types: reminderData.notification_types || ['push'],
      ...reminderData
    });
    return reminder.toJSON();
  }

  static async findAll(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const reminders = await Reminder.findAll({
      where: { user_id: userId },
      order: [['reminder_time', 'ASC']],
      limit,
      offset
    });
    
    return reminders.map(r => r.toJSON());
  }

  static async findById(reminderId, userId) {
    const reminder = await Reminder.findOne({
      where: { reminder_id: reminderId, user_id: userId }
    });
    return reminder ? reminder.toJSON() : null;
  }

  static async findUpcoming(userId) {
    const reminders = await Reminder.findAll({
      where: {
        user_id: userId,
        reminder_time: { [Op.gt]: new Date() },
        is_dismissed: false
      },
      order: [['reminder_time', 'ASC']],
      limit: 10
    });
    
    return reminders.map(r => r.toJSON());
  }

  static async update(reminderId, userId, updates) {
    const reminder = await Reminder.findOne({
      where: { reminder_id: reminderId, user_id: userId }
    });
    
    if (!reminder) return null;
    
    await reminder.update(updates);
    return reminder.toJSON();
  }

  static async snooze(reminderId, userId, snoozeMinutes) {
    const reminder = await Reminder.findOne({
      where: { reminder_id: reminderId, user_id: userId }
    });
    
    if (!reminder) return null;
    
    const newTime = new Date(reminder.reminder_time.getTime() + snoozeMinutes * 60000);
    await reminder.update({ reminder_time: newTime });
    return reminder.toJSON();
  }

  static async dismiss(reminderId, userId) {
    const reminder = await Reminder.findOne({
      where: { reminder_id: reminderId, user_id: userId }
    });
    
    if (!reminder) return null;
    
    await reminder.update({ is_dismissed: true });
    return reminder.toJSON();
  }

  static async delete(reminderId, userId) {
    const reminder = await Reminder.findOne({
      where: { reminder_id: reminderId, user_id: userId }
    });
    
    if (!reminder) return null;
    
    const reminderData = reminder.toJSON();
    await reminder.destroy();
    return reminderData;
  }

  static async count(userId) {
    return await Reminder.count({
      where: { user_id: userId }
    });
  }
}

export default ReminderModel;
