import sequelize from '../../config/database.orm.js';
import User from './User.js';
import Task from './Task.js';
import Note from './Note.js';
import VoiceRecording from './VoiceRecording.js';
import Reminder from './Reminder.js';
import Category from './Category.js';
import Session from './Session.js';
import UserSettings from './UserSettings.js';
import FocusSession from './FocusSession.js';
import Achievement from './Achievement.js';
import Notification from './Notification.js';
import Tag from './Tag.js';
import ProductivityStreak from './ProductivityStreak.js';
import OTP from './OTP.js';

// Define relationships
User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Note, { foreignKey: 'user_id', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(VoiceRecording, { foreignKey: 'user_id', as: 'recordings' });
VoiceRecording.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Reminder, { foreignKey: 'user_id', as: 'reminders' });
Reminder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Category, { foreignKey: 'user_id', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(UserSettings, { foreignKey: 'user_id', as: 'settings' });
UserSettings.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(FocusSession, { foreignKey: 'user_id', as: 'focusSessions' });
FocusSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Achievement, { foreignKey: 'user_id', as: 'achievements' });
Achievement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Tag, { foreignKey: 'user_id', as: 'tags' });
Tag.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(ProductivityStreak, { foreignKey: 'user_id', as: 'streaks' });
ProductivityStreak.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Task.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Task, { foreignKey: 'category_id', as: 'tasks' });

Task.belongsTo(Note, { foreignKey: 'note_id', as: 'note' });
Note.hasMany(Task, { foreignKey: 'note_id', as: 'tasks' });

Task.belongsTo(Task, { foreignKey: 'parent_task_id', as: 'parentTask' });
Task.hasMany(Task, { foreignKey: 'parent_task_id', as: 'subtasks' });

Reminder.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
Task.hasMany(Reminder, { foreignKey: 'task_id', as: 'reminders' });

Note.belongsTo(VoiceRecording, { foreignKey: 'voice_recording_id', as: 'recording' });
VoiceRecording.hasMany(Note, { foreignKey: 'voice_recording_id', as: 'notes' });

// Many-to-many relationship between Notes and Tags
Note.belongsToMany(Tag, { through: 'note_tags', foreignKey: 'note_id', otherKey: 'tag_id', as: 'tags' });
Tag.belongsToMany(Note, { through: 'note_tags', foreignKey: 'tag_id', otherKey: 'note_id', as: 'notes' });

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✅ Database synced successfully');
  } catch (error) {
    console.error('❌ Database sync failed:', error);
  }
};

export {
  sequelize,
  User,
  Task,
  Note,
  VoiceRecording,
  Reminder,
  Category,
  Session,
  UserSettings,
  FocusSession,
  Achievement,
  Notification,
  Tag,
  ProductivityStreak,
  OTP,
  syncDatabase
};
