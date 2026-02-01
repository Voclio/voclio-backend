import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validationResult } from "express-validator";
import { Op } from "sequelize";
import { User, Session, OTP, UserSettings } from "../models/orm/index.js";
import { verifyGoogleToken, verifyFacebookToken } from "../config/oauth.js";
import config from "../config/index.js";
import emailService from "../services/email.service.js";
import { successResponse } from "../utils/responses.js";
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from "../utils/errors.js";
import NotificationService from "../services/notification.service.js";

class AuthController {
  static async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError("Invalid request data", errors.mapped());
      }

      const { email, password, name, phone_number } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictError("Email already registered");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        phone_number,
      });

      // Create default settings
      await UserSettings.create({ user_id: user.user_id });

      // Generate & Send Registration OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await OTP.create({
        otp_id: otpId,
        email: user.email,
        otp_code: otpCode,
        type: "registration",
        expires_at: otpExpiresAt,
      });

      try {
        await emailService.sendOTP(user.email, otpCode, "registration");
      } catch (emailError) {
        console.error("Registration OTP email failed:", emailError);
        // Continue but log error - user can request resend later
      }

      // Return success - user needs to verify OTP before getting tokens
      return successResponse(
        res,
        {
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            phone_number: user.phone_number,
            email_verified: false,
          },
          message:
            "Please verify your email with the OTP sent to complete registration.",
        },
        "Registration initiated. Please verify your email.",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError("Invalid request data", errors.mapped());
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new UnauthorizedError("Invalid credentials");
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError("Invalid credentials");
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.user_id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const refreshToken = jwt.sign(
        { userId: user.user_id },
        config.jwt.refreshSecret,
        {
          expiresIn: config.jwt.refreshExpiresIn,
        },
      );

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await Session.create({
        user_id: user.user_id,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      });

      return successResponse(
        res,
        {
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
          },
          tokens: {
            access_token: token,
            refresh_token: refreshToken,
            expires_in: 86400,
          },
        },
        "Login successful",
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
          "user_id",
          "email",
          "name",
          "phone_number",
          "is_active",
          "oauth_provider",
          "created_at",
        ],
      });

      if (!user) {
        throw new NotFoundError("User not found");
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
        throw new ValidationError("Invalid request data", errors.mapped());
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.phone_number) updates.phone_number = req.body.phone_number;

      await User.update(updates, {
        where: { user_id: req.user.user_id },
      });

      const user = await User.findOne({
        where: { user_id: req.user.user_id },
        attributes: ["user_id", "email", "name", "phone_number"],
      });

      return successResponse(
        res,
        { user: user.toJSON() },
        "Profile updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const token = req.headers.authorization.substring(7);
      await Session.destroy({ where: { refresh_token: token } });

      return successResponse(res, null, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new ValidationError("Refresh token is required");
      }

      // Verify refresh token
      const decoded = jwt.verify(refresh_token, config.jwt.refreshSecret);

      // Check if session exists
      const session = await Session.findOne({ where: { refresh_token } });
      if (!session) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      // Generate new tokens
      const newToken = jwt.sign({ userId: decoded.userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const newRefreshToken = jwt.sign(
        { userId: decoded.userId },
        config.jwt.refreshSecret,
        {
          expiresIn: config.jwt.refreshExpiresIn,
        },
      );

      // Invalidate old session and create new one
      await Session.destroy({ where: { refresh_token } });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await Session.create({
        user_id: decoded.userId,
        refresh_token: newRefreshToken,
        expires_at: expiresAt,
      });

      return successResponse(
        res,
        {
          access_token: newToken,
          refresh_token: newRefreshToken,
          expires_in: 86400,
        },
        "Token refreshed successfully",
      );
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return next(new UnauthorizedError("Invalid or expired refresh token"));
      }
      next(error);
    }
  }

  static async sendOTP(req, res, next) {
    try {
      const { email, type } = req.body;

      // Invalidate any existing unverified OTPs for this email and type
      await OTP.update(
        { verified: true }, // Mark as verified to invalidate
        {
          where: {
            email,
            type,
            verified: false,
            expires_at: {
              [Op.gt]: new Date(),
            },
          },
        },
      );

      // Generate 6-digit OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP
      const otp = await OTP.create({
        otp_id: otpId,
        email,
        otp_code: otpCode,
        type,
        expires_at: expiresAt,
      });

      // Send OTP via email
      try {
        await emailService.sendOTP(email, otpCode, type);
      } catch (emailError) {
        console.error("Email service error:", emailError);
        // Continue even if email fails in development
        if (config.nodeEnv !== "development") {
          throw emailError;
        }
      }

      return successResponse(res, {
        otp_id: otp.otp_id,
        message: "OTP sent successfully. Please check your email.",
        expires_in: 600, // 10 minutes in seconds
        // For testing purposes only - remove in production
        otp_code: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOTP(req, res, next) {
    try {
      const { email, otp_code, type } = req.body;

      const otp = await OTP.findOne({
        where: {
          email,
          otp_code,
          type,
          verified: false,
          expires_at: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!otp) {
        throw new UnauthorizedError("Invalid or expired OTP");
      }

      // Mark OTP as used
      await otp.update({ verified: true });

      // Find the user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Handle different OTP types
      if (type === "registration") {
        // Mark email as verified
        await user.update({ email_verified: true });

        // Send welcome notification
        await NotificationService.notifyWelcome(
          user.user_id,
          user.name || "New User",
        );

        // Generate tokens
        const token = jwt.sign({ userId: user.user_id }, config.jwt.secret, {
          expiresIn: config.jwt.expiresIn,
        });

        const refreshToken = jwt.sign(
          { userId: user.user_id },
          config.jwt.refreshSecret,
          {
            expiresIn: config.jwt.refreshExpiresIn,
          },
        );

        // Create session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await Session.create({
          user_id: user.user_id,
          refresh_token: refreshToken,
          expires_at: expiresAt,
        });

        return successResponse(res, {
          verified: true,
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            phone_number: user.phone_number,
            email_verified: true,
          },
          tokens: {
            access_token: token,
            refresh_token: refreshToken,
            expires_in: 86400,
          },
          message: "Email verified successfully. Welcome to Voclio!",
        });
      }

      // If this was a password reset OTP, generate a reset token
      if (type === "password_reset") {
        const reset_token = jwt.sign(
          {
            userId: user.user_id,
            purpose: "password_reset",
            otpId: otp.otp_id,
          },
          config.jwt.secret,
          { expiresIn: "1h" },
        );

        return successResponse(res, {
          verified: true,
          reset_token,
          message: "OTP verified successfully",
        });
      }

      // For other OTP types (login, email_verification, etc.)
      return successResponse(res, {
        verified: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendOTP(req, res, next) {
    try {
      const { email, type } = req.body;

      // Invalidate any existing unverified OTPs for this email and type
      await OTP.update(
        { verified: true }, // Mark as verified to invalidate
        {
          where: {
            email,
            type,
            verified: false,
            expires_at: {
              [Op.gt]: new Date(),
            },
          },
        },
      );

      // Generate new OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const otp = await OTP.create({
        otp_id: otpId,
        email,
        otp_code: otpCode,
        type,
        expires_at: expiresAt,
      });

      // Send OTP via email
      try {
        await emailService.sendOTP(email, otpCode, type);
      } catch (emailError) {
        console.error("Email service error:", emailError);
        if (config.nodeEnv !== "development") {
          throw emailError;
        }
      }

      return successResponse(res, {
        otp_id: otp.otp_id,
        message:
          "New OTP sent successfully. Previous codes have been invalidated.",
        expires_in: 600, // 10 minutes in seconds
        otp_code: process.env.NODE_ENV === "development" ? otpCode : undefined,
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
        // Don't reveal if email exists
        return successResponse(
          res,
          null,
          "If the email exists, a verification code has been sent",
        );
      }

      // Invalidate any existing unverified password reset OTPs
      await OTP.update(
        { verified: true },
        {
          where: {
            email,
            type: "password_reset",
            verified: false,
            expires_at: {
              [Op.gt]: new Date(),
            },
          },
        },
      );

      // Generate 6-digit OTP instead of link
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await OTP.create({
        otp_id: otpId,
        email,
        otp_code: otpCode,
        type: "password_reset",
        expires_at: expiresAt,
      });

      // Send OTP via email
      try {
        await emailService.sendOTP(email, otpCode, "password_reset");
      } catch (emailError) {
        console.error("Email service error:", emailError);
        if (config.nodeEnv !== "development") {
          throw emailError;
        }
        // In development, log the code
        console.log(`Reset code for ${email}: ${otpCode}`);
      }

      return successResponse(res, null, "Verification code sent to your email");
    } catch (error) {
      next(error);
    }
  }

  // Google OAuth Login for Flutter
  static async googleLogin(req, res, next) {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        throw new ValidationError("Google ID token is required");
      }

      // Verify Google token
      const googleUser = await verifyGoogleToken(id_token);

      // Check if user exists
      let user = await User.findOne({ where: { email: googleUser.email } });

      if (!user) {
        // Create new user from Google account
        user = await User.create({
          email: googleUser.email,
          name: googleUser.name,
          oauth_provider: "google",
          oauth_id: googleUser.oauth_id,
          email_verified: googleUser.email_verified,
        });

        // Create default settings
        await UserSettings.create({ user_id: user.user_id });
      } else if (!user.oauth_provider) {
        // Link existing account with Google
        await user.update({
          oauth_provider: "google",
          oauth_id: googleUser.oauth_id,
          email_verified: true,
        });
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.user_id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const refreshToken = jwt.sign(
        { userId: user.user_id },
        config.jwt.refreshSecret,
        {
          expiresIn: config.jwt.refreshExpiresIn,
        },
      );

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await Session.create({
        user_id: user.user_id,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      });

      return successResponse(
        res,
        {
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            oauth_provider: user.oauth_provider,
          },
          tokens: {
            access_token: token,
            refresh_token: refreshToken,
            expires_in: 86400,
          },
        },
        "Google login successful",
      );
    } catch (error) {
      if (error.message === "Invalid Google token") {
        next(new UnauthorizedError("Invalid Google token"));
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
        throw new ValidationError("Facebook access token is required");
      }

      // Verify Facebook token
      const facebookUser = await verifyFacebookToken(access_token);

      // Check if user exists
      let user = await User.findOne({ where: { email: facebookUser.email } });

      if (!user) {
        // Create new user from Facebook account
        user = await User.create({
          email: facebookUser.email,
          name: facebookUser.name,
          oauth_provider: "facebook",
          oauth_id: facebookUser.oauth_id,
          email_verified: facebookUser.email_verified,
        });

        // Create default settings
        await UserSettings.create({ user_id: user.user_id });
      } else if (!user.oauth_provider) {
        // Link existing account with Facebook
        await user.update({
          oauth_provider: "facebook",
          oauth_id: facebookUser.oauth_id,
          email_verified: true,
        });
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.user_id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const refreshToken = jwt.sign(
        { userId: user.user_id },
        config.jwt.refreshSecret,
        {
          expiresIn: config.jwt.refreshExpiresIn,
        },
      );

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await Session.create({
        user_id: user.user_id,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      });

      return successResponse(
        res,
        {
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            oauth_provider: user.oauth_provider,
          },
          tokens: {
            access_token: token,
            refresh_token: refreshToken,
            expires_in: 86400,
          },
        },
        "Facebook login successful",
      );
    } catch (error) {
      if (
        error.message === "Invalid Facebook token" ||
        error.message === "Email permission required"
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

      if (!current_password || !new_password) {
        throw new ValidationError(
          "Current password and new password are required",
        );
      }

      // Get user with password
      const user = await User.findOne({ where: { user_id: req.user.user_id } });

      if (!user || !user.password) {
        throw new ValidationError("Cannot change password for OAuth accounts");
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        current_password,
        user.password,
      );
      if (!isValidPassword) {
        throw new UnauthorizedError("Current password is incorrect");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await user.update({ password: hashedPassword });

      return successResponse(res, null, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        throw new ValidationError("Reset token and new password are required");
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, config.jwt.secret);

        // Verify token purpose
        if (decoded.purpose !== "password_reset") {
          throw new UnauthorizedError("Invalid reset token");
        }

        // --- SINGLE USE CHECK ---
        // If token has otpId, check if it still exists
        if (decoded.otpId) {
          const otp = await OTP.findByPk(decoded.otpId);
          if (!otp) {
            throw new UnauthorizedError(
              "This reset token has already been used or expired",
            );
          }
        }
      } catch (err) {
        if (err instanceof UnauthorizedError) throw err;
        throw new UnauthorizedError("Invalid or expired reset token");
      }

      // Verify user exists
      const user = await User.findOne({ where: { user_id: decoded.userId } });
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await user.update({ password: hashedPassword });

      // Invalidate all existing sessions for security
      await Session.destroy({ where: { user_id: decoded.userId } });

      // --- REVOKE TOKEN ---
      // Delete the OTP record so the token cannot be used again
      if (decoded.otpId) {
        await OTP.destroy({ where: { otp_id: decoded.otpId } });
      }

      return successResponse(
        res,
        null,
        "Password reset successfully. Please login with your new password.",
      );
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
