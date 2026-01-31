import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const Reminder = sequelize.define('Reminder', {
  reminder_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'task_id'
    }
  },
  reminder_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  reminder_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'push'
  },
  notification_types: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: ['push']
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  is_dismissed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reminders',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['reminder_time'] }
  ]
});

export default Reminder;
