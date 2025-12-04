/**
 * Models index - Export all models for easy importing
 */

module.exports = {
  UserModel: require('./user.model'),
  SessionModel: require('./session.model'),
  OTPModel: require('./otp.model'),
  NoteModel: require('./note.model'),
  TaskModel: require('./task.model'),
  TagModel: require('./tag.model'),
  ReminderModel: require('./reminder.model'),
  VoiceRecordingModel: require('./voice.model'),
  NotificationModel: require('./notification.model'),
  SettingsModel: require('./settings.model'),
  ProductivityModel: require('./productivity.model')
};
