import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const AppConfig = sequelize.define(
  'AppConfig',
  {
    config_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    config_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    config_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'app_config',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
  }
);

export default AppConfig;
