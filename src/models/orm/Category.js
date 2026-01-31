import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const Category = sequelize.define('Category', {
  category_id: {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'categories',
  indexes: [
    { unique: true, fields: ['user_id', 'name'] }
  ]
});

export default Category;
