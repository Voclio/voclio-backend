import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const GoogleCalendarSync = sequelize.define('GoogleCalendarSync', {
    sync_id: {
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
    google_access_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    google_refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    google_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    calendar_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'primary'
    },
    calendar_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sync_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sync_status: {
      type: DataTypes.ENUM('active', 'error', 'disabled'),
      defaultValue: 'active'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'google_calendar_sync',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  GoogleCalendarSync.associate = (models) => {
    GoogleCalendarSync.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return GoogleCalendarSync;
};