import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const ScheduledNotification = sequelize.define(
  'ScheduledNotification',
  {
    scheduled_notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    template_key: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notification_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'system'
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'normal'
    },
    audience: {
      type: DataTypes.STRING(50),
      defaultValue: 'all_active'
    },
    target_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    recurrence: {
      type: DataTypes.STRING(20),
      defaultValue: 'once'
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    next_run_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    last_run_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    send_push: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    run_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    }
  },
  {
    tableName: 'scheduled_notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default ScheduledNotification;
