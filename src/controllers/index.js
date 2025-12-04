/**
 * Controllers index - Export all controllers for easy importing
 */

module.exports = {
  AuthController: require('./auth.controller'),
  NoteController: require('./note.controller'),
  TaskController: require('./task.controller'),
  VoiceController: require('./voice.controller'),
  TagController: require('./tag.controller'),
  ReminderController: require('./reminder.controller'),
  NotificationController: require('./notification.controller'),
  SettingsController: require('./settings.controller'),
  ProductivityController: require('./productivity.controller')
};
