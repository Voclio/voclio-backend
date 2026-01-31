import { OTP } from './orm/index.js';
import { Op } from 'sequelize';

class OTPModel {
  static async create(email, otpCode, otpType) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const otp = await OTP.create({
      otp_id: otpId,
      email,
      otp_code: otpCode,
      type: otpType,
      expires_at: expiresAt
    });
    
    return {
      otp_id: otp.otp_id,
      otp_code: otp.otp_code
    };
  }

  static async findValid(email, otpCode, otpType) {
    const otp = await OTP.findOne({
      where: {
        email,
        otp_code: otpCode,
        type: otpType,
        verified: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });
    
    return otp ? otp.toJSON() : null;
  }

  static async markAsUsed(otpId) {
    await OTP.update(
      { verified: true },
      { where: { otp_id: otpId } }
    );
  }

  static async deleteExpired() {
    await OTP.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() }
      }
    });
  }
}

export default OTPModel;
