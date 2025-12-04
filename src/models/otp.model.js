const pool = require('../config/database');

class OTPModel {
  static async create(email, otpCode, otpType) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const result = await pool.query(
      `INSERT INTO otp_codes (email, otp_code, otp_type, expires_at) 
       VALUES ($1, $2, $3, $4) 
       RETURNING otp_id, otp_code`,
      [email, otpCode, otpType, expiresAt]
    );
    return result.rows[0];
  }

  static async findValid(email, otpCode, otpType) {
    const result = await pool.query(
      `SELECT * FROM otp_codes 
       WHERE email = $1 AND otp_code = $2 AND otp_type = $3 
       AND is_used = false AND expires_at > NOW()`,
      [email, otpCode, otpType]
    );
    return result.rows[0];
  }

  static async markAsUsed(otpId) {
    await pool.query(
      'UPDATE otp_codes SET is_used = true WHERE otp_id = $1',
      [otpId]
    );
  }

  static async deleteExpired() {
    await pool.query('DELETE FROM otp_codes WHERE expires_at < NOW()');
  }
}

module.exports = OTPModel;
