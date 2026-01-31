import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const OTP = sequelize.define('OTP', {
  otp_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  otp_code: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('login', 'registration', 'password_reset', 'email_verification', 'phone_verification'),
    allowNull: false
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'otp_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default OTP;
