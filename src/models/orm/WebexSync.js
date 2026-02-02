import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const WebexSync = sequelize.define('WebexSync', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    },
    onDelete: 'CASCADE'
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tokenType: {
    type: DataTypes.STRING,
    defaultValue: 'Bearer'
  },
  expiresIn: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  webexUserId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  webexUserEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  webexDisplayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'webex_sync',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId']
    },
    {
      fields: ['webexUserId']
    },
    {
      fields: ['webexUserEmail']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['syncEnabled']
    }
  ]
});

export default WebexSync;