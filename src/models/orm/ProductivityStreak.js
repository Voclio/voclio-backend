import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const ProductivityStreak = sequelize.define('ProductivityStreak', {
  streak_id: {
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
  streak_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  current_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  longest_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'productivity_streaks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'streak_date']
    }
  ]
});

export default ProductivityStreak;
