import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const ActivityLog = sequelize.define(
  'ActivityLog',
  {
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' }
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' }
    },
    activity_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    activity_category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    severity: {
      type: DataTypes.STRING(50),
      defaultValue: 'info'
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    tableName: 'activity_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  }
);

export default ActivityLog;
