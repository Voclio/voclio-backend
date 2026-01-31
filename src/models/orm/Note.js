import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const Note = sequelize.define('Note', {
  note_id: {
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
  voice_recording_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'voice_recordings',
      key: 'recording_id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  transcription_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'notes',
  indexes: [
    { fields: ['user_id'] }
  ]
});

export default Note;
