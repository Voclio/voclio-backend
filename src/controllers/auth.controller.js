const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const UserModel = require('../models/user.model');
const SessionModel = require('../models/session.model');
const OTPModel = require('../models/otp.model');
const { verifyGoogleToken, verifyFacebookToken } = require('../config/oauth');
const config = require('../config');
const { successResponse, errorResponse } = require('../utils/responses');
const { ValidationError, UnauthorizedError, NotFoundError, ConflictError } = require('../utils/errors');

class AuthController {
  static async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const { email, password, name, phone_number } = req.body;

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await UserModel.create({
        email,
        password: hashedPassword,
        name,
        phone_number
      });

      // Create default settings
      await UserModel.createDefaultSettings(user.user_id);

      // Generate tokens
      const token = jwt.sign({ userId: user.user_id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      const refreshToken = jwt.sign({ userId: user.user_id }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn
      });

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await SessionModel.create(user.user_id, refreshToken, expiresAt);

      return successResponse(res, {
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          phone_number: user.phone_number
        },
        tokens: {
          access_token: token,
          refresh_token: refreshToken,
          expires_in: 86400
        }
      }, 'User registered successfully', 201);

    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.user_id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      const refreshToken = jwt.sign({ userId: user.user_id }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn
      });

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await SessionModel.create(user.user_id, refreshToken, expiresAt);

      return successResponse(res, {
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name
        },
        tokens: {
          access_token: token,
          refresh_token: refreshToken,
          expires_in: 86400
        }
      }, 'Login successful');

    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.user_id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return successResponse(res, { user });

    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.phone_number) updates.phone_number = req.body.phone_number;

      const user = await UserModel.update(req.user.user_id, updates);

      return successResponse(res, { user }, 'Profile updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const token = req.headers.authorization.substring(7);
      await SessionModel.invalidate(token);

      return successResponse(res, null, 'Logged out successfully');

    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new ValidationError('Refresh token is required');
      }

      // Verify refresh token
      const decoded = jwt.verify(refresh_token, config.jwt.refreshSecret);

      // Check if session exists
      const session = await SessionModel.findByRefreshToken(refresh_token);
      if (!session) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new tokens
      const newToken = jwt.sign({ userId: decoded.userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      const newRefreshToken = jwt.sign({ userId: decoded.userId }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn
      });

      // Invalidate old session and create new one
      await SessionModel.invalidate(refresh_token);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await SessionModel.create(decoded.userId, newRefreshToken, expiresAt);

      return successResponse(res, {
        access_token: newToken,
        refresh_token: newRefreshToken,
        expires_in: 86400
      }, 'Token refreshed successfully');

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return next(new UnauthorizedError('Invalid or expired refresh token'));
      }
      next(error);
    }
  }

  static async sendOTP(req, res, next) {
    try {
      const { email, type } = req.body;

      // Generate 6-digit OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();

      // Store OTP
      const otp = await OTPModel.create(email, otpCode, type);

      // TODO: Send OTP via email/SMS (integrate email service)
      console.log(`OTP for ${email}: ${otpCode}`);

      return successResponse(res, {
        otp_id: otp.otp_id,
        message: 'OTP sent successfully',
        // For testing purposes only - remove in production
        otp_code: process.env.NODE_ENV === 'development' ? otpCode : undefined
      });

    } catch (error) {
      next(error);
    }
  }

  static async verifyOTP(req, res, next) {
    try {
      const { email, otp_code, type, otp_id } = req.body;

      const otp = await OTPModel.findValid(email, otp_code, type);
      if (!otp) {
        throw new UnauthorizedError('Invalid or expired OTP');
      }

      // Mark OTP as used
      await OTPModel.markAsUsed(otp.otp_id);

      return successResponse(res, {
        verified: true,
        message: 'OTP verified successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  static async resendOTP(req, res, next) {
    try {
      const { email, type } = req.body;

      // Generate new OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otp = await OTPModel.create(email, otpCode, type);

      // TODO: Send OTP via email/SMS
      console.log(`Resend OTP for ${email}: ${otpCode}`);

      return successResponse(res, {
        otp_id: otp.otp_id,
        message: 'OTP resent successfully',
        otp_code: process.env.NODE_ENV === 'development' ? otpCode : undefined
      });

    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return successResponse(res, null, 'If the email exists, a password reset link has been sent');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // TODO: Store reset token with expiry and send email
      console.log(`Reset token for ${email}: ${resetToken}`);

      return successResponse(res, null, 'Password reset instructions sent to your email');

    } catch (error) {
      next(error);
    }
  }

  // Google OAuth Login for Flutter
  static async googleLogin(req, res, next) {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        throw new ValidationError('Google ID token is required');
      }

      // Verify Google token
      const googleUser = await verifyGoogleToken(id_token);

      // Check if user exists
      let user = await UserModel.findByEmail(googleUser.email);

      if (!user) {
        // Create new user from Google account
        user = await UserModel.create({
          email: googleUser.email,
          name: googleUser.name,
          oauth_provider: 'google',
          oauth_id: googleUser.oauth_id,
          email_verified: googleUser.email_verified
        });

        // Create default settings
        await UserModel.createDefaultSettings(user.user_id);
      } else if (!user.oauth_provider) {
        // Link existing account with Google
        await UserModel.updateOAuthInfo(user.user_id, 'google', googleUser.oauth_id);
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.user_id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      const refreshToken = jwt.sign({ userId: user.user_id }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn
      });

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await SessionModel.create(user.user_id, refreshToken, expiresAt);

      return successResponse(res, {
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          oauth_provider: user.oauth_provider
        },
        tokens: {
          access_token: token,
          refresh_token: refreshToken,
          expires_in: 86400
        }
      }, 'Google login successful');

    } catch (error) {
      if (error.message === 'Invalid Google token') {
        next(new UnauthorizedError('Invalid Google token'));
      } else {
        next(error);
      }
    }
  }

  // Facebook OAuth Login for Flutter
  static async facebookLogin(req, res, next) {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        throw new ValidationError('Facebook access token is required');
      }

      // Verify Facebook token
      const facebookUser = await verifyFacebookToken(access_token);

      // Check if user exists
      let user = await UserModel.findByEmail(facebookUser.email);

      if (!user) {
        // Create new user from Facebook account
        user = await UserModel.create({
          email: facebookUser.email,
          name: facebookUser.name,
          oauth_provider: 'facebook',
          oauth_id: facebookUser.oauth_id,
          email_verified: facebookUser.email_verified
        });

        // Create default settings
        await UserModel.createDefaultSettings(user.user_id);
      } else if (!user.oauth_provider) {
        // Link existing account with Facebook
        await UserModel.updateOAuthInfo(user.user_id, 'facebook', facebookUser.oauth_id);
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.user_id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      const refreshToken = jwt.sign({ userId: user.user_id }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn
      });

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await SessionModel.create(user.user_id, refreshToken, expiresAt);

      return successResponse(res, {
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          oauth_provider: user.oauth_provider
        },
        tokens: {
          access_token: token,
          refresh_token: refreshToken,
          expires_in: 86400
        }
      }, 'Facebook login successful');

    } catch (error) {
      if (error.message === 'Invalid Facebook token' || error.message === 'Email permission required') {
        next(new UnauthorizedError(error.message));
      } else {
        next(error);
      }
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        throw new ValidationError('Current password and new password are required');
      }

      // Get user with password
      const user = await UserModel.findByIdWithPassword(req.user.user_id);
      
      if (!user || !user.password) {
        throw new ValidationError('Cannot change password for OAuth accounts');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(current_password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await UserModel.updatePassword(user.user_id, hashedPassword);

      return successResponse(res, null, 'Password changed successfully');

    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        throw new ValidationError('Reset token and new password are required');
      }

      // Verify token (simple implementation - in production use a proper token system)
      let userId;
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        userId = decoded.userId;
      } catch (err) {
        throw new UnauthorizedError('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await UserModel.updatePassword(userId, hashedPassword);

      return successResponse(res, null, 'Password reset successfully');

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
