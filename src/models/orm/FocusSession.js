import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const FocusSession = sequelize.define('FocusSession', {
  session_id: {
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
  timer_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 25
  },
  elapsed_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ambient_sound: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  sound_volume: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  start_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'focus_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default FocusSession;
