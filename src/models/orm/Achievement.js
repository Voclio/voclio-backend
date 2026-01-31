import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const Achievement = sequelize.define('Achievement', {
  achievement_id: {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  earned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'achievements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Achievement;
