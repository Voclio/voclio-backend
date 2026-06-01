import { validationResult } from 'express-validator';
import { User } from '../models/orm/index.js';
import { verifyGoogleToken, verifyFacebookToken } from '../config/oauth.js';
import authService from '../services/auth.service.js';
import { successResponse } from '../utils/responses.js';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError
} from '../utils/errors.js';
import NotificationService from '../services/notification.service.js';

class AuthController {
  static async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const { email, password, name, phone_number } = req.body;
      const { user, isReRegistration } = await authService.registerUser({
        email,
        password,
        name,
        phone_number
      });

      const userPayload = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        phone_number: user.phone_number,
        email_verified: false
      };

      if (isReRegistration) {
        return successResponse(
          res,
          {
            user: userPayload,
            message:
              'A new verification code has been sent to your email. Previous codes have been invalidated.'
          },
          'Registration updated. Please verify your email.',
          200
        );
      }

      return successResponse(
        res,
        {
          user: userPayload,
          message: 'Please verify your email with the OTP sent to complete registration.'
        },
        'Registration initiated. Please verify your email.',
        201
      );
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
      const { user, tokens } = await authService.loginWithPassword(email, password);

      return successResponse(
        res,
        {
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name
          },
          tokens
        },
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await User.findOne({
        where: { user_id: req.user.user_id },
        attributes: [
          'user_id',
          'email',
          'name',
          'phone_number',
          'is_active',
          'oauth_provider',
          'created_at'
        ]
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return successResponse(res, { user: user.toJSON() });
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

      await User.update(updates, {
        where: { user_id: req.user.user_id }
      });

      const user = await User.findOne({
        where: { user_id: req.user.user_id },
        attributes: ['user_id', 'email', 'name', 'phone_number']
      });

      return successResponse(res, { user: user.toJSON() }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new ValidationError('Refresh token is required');
      }

      await authService.revokeSession(refresh_token);

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

      const tokens = await authService.refreshSession(refresh_token);

      return successResponse(res, tokens, 'Token refreshed successfully');
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

      await authService.invalidateOTPs(email, type);
      const { otp, otpCode } = await authService.createOTP(email, type);
      await authService.sendOTP(email, otpCode, type);

      return successResponse(res, {
        otp_id: otp.otp_id,
        message: 'OTP sent successfully. Please check your email.',
        expires_in: 600,
        otp_code: process.env.NODE_ENV === 'development' ? otpCode : undefined
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOTP(req, res, next) {
    try {
      const { email, otp_code, type } = req.body;

      const otp = await authService.verifyOTPRecord(email, otp_code, type);
      if (!otp) {
        throw new UnauthorizedError('Invalid or expired OTP');
      }

      await otp.update({ verified: true });

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (type === 'registration') {
        const tokens = await authService.completeRegistrationVerification(user);
        await NotificationService.notifyWelcome(user.user_id, user.name || 'New User');

        return successResponse(res, {
          verified: true,
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            phone_number: user.phone_number,
            email_verified: true
          },
          tokens,
          message: 'Email verified successfully. Welcome to Voclio!'
        });
      }

      if (type === 'password_reset') {
        const reset_token = await authService.generatePasswordResetToken(user.user_id, otp.otp_id);

        return successResponse(res, {
          verified: true,
          reset_token,
          message: 'OTP verified successfully'
        });
      }

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

      await authService.invalidateOTPs(email, type);
      const { otp, otpCode } = await authService.createOTP(email, type);
      await authService.sendOTP(email, otpCode, type);

      return successResponse(res, {
        otp_id: otp.otp_id,
        message: 'New OTP sent successfully. Previous codes have been invalidated.',
        expires_in: 600,
        otp_code: process.env.NODE_ENV === 'development' ? otpCode : undefined
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return successResponse(res, null, 'If the email exists, a verification code has been sent');
      }

      await authService.invalidateOTPs(email, 'password_reset');
      const { otpCode } = await authService.createOTP(email, 'password_reset');
      await authService.sendOTP(email, otpCode, 'password_reset');

      return successResponse(res, null, 'Verification code sent to your email');
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        throw new ValidationError('Google ID token is required');
      }

      const googleUser = await verifyGoogleToken(id_token);
      const { user, tokens } = await authService.findOrCreateOAuthUser(googleUser, 'google');

      return successResponse(
        res,
        {
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            oauth_provider: user.oauth_provider
          },
          tokens
        },
        'Google login successful'
      );
    } catch (error) {
      if (error.message === 'Invalid Google token') {
        next(new UnauthorizedError('Invalid Google token'));
      } else {
        next(error);
      }
    }
  }

  static async facebookLogin(req, res, next) {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        throw new ValidationError('Facebook access token is required');
      }

      const facebookUser = await verifyFacebookToken(access_token);
      const { user, tokens } = await authService.findOrCreateOAuthUser(facebookUser, 'facebook');

      return successResponse(
        res,
        {
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            oauth_provider: user.oauth_provider
          },
          tokens
        },
        'Facebook login successful'
      );
    } catch (error) {
      if (
        error.message === 'Invalid Facebook token' ||
        error.message === 'Email permission required'
      ) {
        next(new UnauthorizedError(error.message));
      } else {
        next(error);
      }
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.body;
      await authService.changePassword(req.user.user_id, current_password, new_password);
      return successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, new_password } = req.body;
      await authService.resetPasswordWithToken(token, new_password);

      return successResponse(
        res,
        null,
        'Password reset successfully. Please login with your new password.'
      );
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
