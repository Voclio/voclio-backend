import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const DeviceToken = sequelize.define(
  'DeviceToken',
  {
    device_token_id: {
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
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'unknown'
    }
  },
  {
    tableName: 'device_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['user_id', 'token'] },
      { fields: ['user_id'] },
      { fields: ['token'] }
    ]
  }
);

export default DeviceToken;
