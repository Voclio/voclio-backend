import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { User, Session, OTP, UserSettings } from '../models/orm/index.js';
import config from '../config/index.js';
import emailService from './email.service.js';
import logger from '../utils/logger.js';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError
} from '../utils/errors.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_DURATION_MS = 10 * 60 * 1000;

const parseExpiresInSeconds = expiresIn => {
  if (typeof expiresIn === 'number') return expiresIn;

  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (!match) return 86400;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
  case 's':
    return value;
  case 'm':
    return value * 60;
  case 'h':
    return value * 3600;
  case 'd':
    return value * 86400;
  default:
    return 86400;
  }
};

class AuthService {
  get tokenExpiresInSeconds() {
    return parseExpiresInSeconds(config.jwt.expiresIn);
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(userId) {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  generateRefreshToken(userId) {
    return jwt.sign({ userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });
  }

  generateTokenPair(userId) {
    return {
      access_token: this.generateAccessToken(userId),
      refresh_token: this.generateRefreshToken(userId),
      expires_in: this.tokenExpiresInSeconds
    };
  }

  async createSession(userId, refreshToken) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await Session.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt
    });
  }

  async revokeSession(refreshToken) {
    await Session.destroy({ where: { refresh_token: refreshToken } });
  }

  async revokeAllUserSessions(userId) {
    await Session.destroy({ where: { user_id: userId } });
  }

  async invalidateOTPs(email, type) {
    await OTP.update(
      { verified: true },
      {
        where: {
          email,
          type,
          verified: false,
          expires_at: { [Op.gt]: new Date() }
        }
      }
    );
  }

  async createOTP(email, type) {
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const expiresAt = new Date(Date.now() + OTP_DURATION_MS);

    const otp = await OTP.create({
      otp_id: otpId,
      email,
      otp_code: otpCode,
      type,
      expires_at: expiresAt
    });

    return { otp, otpCode };
  }

  async sendOTP(email, otpCode, type) {
    try {
      await emailService.sendOTP(email, otpCode, type);
    } catch (emailError) {
      logger.error('Email service error', { error: emailError.message, email, type });
      if (config.nodeEnv !== 'development') {
        throw emailError;
      }
    }
  }

  async verifyOTPRecord(email, otpCode, type) {
    return OTP.findOne({
      where: {
        email,
        otp_code: otpCode,
        type,
        verified: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });
  }

  async registerUser({ email, password, name, phone_number }) {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      if (existingUser.email_verified) {
        throw new ConflictError('Email already registered. Please login instead.');
      }

      await this.invalidateOTPs(email, 'registration');

      const hashedPassword = await this.hashPassword(password);
      await existingUser.update({
        password: hashedPassword,
        name,
        phone_number: phone_number || existingUser.phone_number
      });

      const { otp, otpCode } = await this.createOTP(email, 'registration');
      await this.sendOTP(email, otpCode, 'registration');

      return {
        user: existingUser,
        otp,
        isReRegistration: true
      };
    }

    const hashedPassword = await this.hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone_number
    });

    await UserSettings.create({ user_id: user.user_id });

    const { otp, otpCode } = await this.createOTP(email, 'registration');
    await this.sendOTP(email, otpCode, 'registration');

    return { user, otp, isReRegistration: false };
  }

  async loginWithPassword(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = this.generateTokenPair(user.user_id);
    await this.createSession(user.user_id, tokens.refresh_token);

    return { user, tokens };
  }

  async refreshSession(refreshToken) {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    const session = await Session.findOne({ where: { refresh_token: refreshToken } });
    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = this.generateTokenPair(decoded.userId);
    await this.revokeSession(refreshToken);
    await this.createSession(decoded.userId, tokens.refresh_token);

    return tokens;
  }

  async completeRegistrationVerification(user) {
    await user.update({ email_verified: true });

    const tokens = this.generateTokenPair(user.user_id);
    await this.createSession(user.user_id, tokens.refresh_token);

    return tokens;
  }

  async generatePasswordResetToken(userId, otpId) {
    return jwt.sign(
      {
        userId,
        purpose: 'password_reset',
        otpId
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  }

  async findOrCreateOAuthUser(oauthUser, provider) {
    let user = await User.findOne({ where: { email: oauthUser.email } });

    if (!user) {
      user = await User.create({
        email: oauthUser.email,
        name: oauthUser.name,
        oauth_provider: provider,
        oauth_id: oauthUser.oauth_id,
        email_verified: oauthUser.email_verified
      });

      await UserSettings.create({ user_id: user.user_id });
    } else if (!user.oauth_provider) {
      await user.update({
        oauth_provider: provider,
        oauth_id: oauthUser.oauth_id,
        email_verified: true
      });
    }

    const tokens = this.generateTokenPair(user.user_id);
    await this.createSession(user.user_id, tokens.refresh_token);

    return { user, tokens };
  }

  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    const user = await User.findOne({ where: { user_id: userId } });
    if (!user || !user.password) {
      throw new ValidationError('Cannot change password for OAuth accounts');
    }

    const isValidPassword = await this.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await user.update({ password: hashedPassword });
  }

  async resetPasswordWithToken(token, newPassword) {
    if (!token || !newPassword) {
      throw new ValidationError('Reset token and new password are required');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);

      if (decoded.purpose !== 'password_reset') {
        throw new UnauthorizedError('Invalid reset token');
      }

      if (decoded.otpId) {
        const otp = await OTP.findByPk(decoded.otpId);
        if (!otp) {
          throw new UnauthorizedError('This reset token has already been used or expired');
        }
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const user = await User.findOne({ where: { user_id: decoded.userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await user.update({ password: hashedPassword });
    await this.revokeAllUserSessions(decoded.userId);

    if (decoded.otpId) {
      await OTP.destroy({ where: { otp_id: decoded.otpId } });
    }
  }
}

export default new AuthService();
