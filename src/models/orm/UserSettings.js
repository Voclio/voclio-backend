import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const UserSettings = sequelize.define('UserSettings', {
  settings_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'auto'),
    defaultValue: 'auto'
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en'
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'UTC'
  },
  email_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  whatsapp_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  push_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_for_reminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_for_tasks: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  whatsapp_for_reminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'user_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default UserSettings;
