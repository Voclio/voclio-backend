import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const VoiceRecording = sequelize.define('VoiceRecording', {
  recording_id: {
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
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  format: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  transcription_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'uploaded'
  }
}, {
  tableName: 'voice_recordings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] }
  ]
});

export default VoiceRecording;
