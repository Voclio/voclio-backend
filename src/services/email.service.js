import pkg from "nodemailer";
const { createTransport } = pkg;
import config from "../config/index.js";

class EmailService {
  constructor() {
    // Create transporter - configured for Gmail App Password
    // Generates app password at: https://myaccount.google.com/apppasswords
    this.transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_APP_PASSWORD, // Your 16-digit App Password
      },
    });
  }

  async sendOTP(email, otpCode, type) {
    try {
      const subject = this.getOTPSubject(type);
      const html = this.getOTPTemplate(otpCode, type);

      const info = await this.transporter.sendMail({
        from: `"Voclio" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: html,
      });

      console.log("OTP email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending OTP email:", error);
      // In development, log OTP to console
      if (config.nodeEnv === "development") {
        console.log(`\n📧 OTP for ${email}: ${otpCode}\n`);
      }
      throw error;
    }
  }

  async sendPasswordReset(email, resetUrl, userName) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${userName || "there"},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">Voclio - Voice Notes & Task Management</p>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: `"Voclio" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request - Voclio",
        html: html,
      });

      console.log("Password reset email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      if (config.nodeEnv === "development") {
        console.log(`\n📧 Reset link for ${email}: ${resetUrl}\n`);
      }
      throw error;
    }
  }

  async sendReminder(email, reminderData) {
    try {
      const { title, message, reminder_time } = reminderData;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">⏰ Reminder: ${title}</h2>
          <p style="font-size: 16px;">${message}</p>
          <p style="color: #666;">Scheduled for: ${new Date(reminder_time).toLocaleString()}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">Voclio - Voice Notes & Task Management</p>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: `"Voclio" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Reminder: ${title}`,
        html: html,
      });

      console.log("Reminder email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending reminder email:", error);
      throw error;
    }
  }

  getOTPSubject(type) {
    const subjects = {
      login: "Your Login OTP - Voclio",
      registration: "Verify Your Email - Voclio",
      password_reset: "Password Reset OTP - Voclio",
      phone_verification: "Phone Verification OTP - Voclio",
    };
    return subjects[type] || "Your OTP Code - Voclio";
  }

  getOTPTemplate(otpCode, type) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50;">Voclio</h1>
        </div>
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
          <p style="font-size: 16px; color: #666;">Enter this code to complete your ${type}:</p>
          <div style="background-color: white; padding: 20px; text-align: center; border-radius: 4px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4CAF50;">${otpCode}</span>
          </div>
          <p style="color: #999; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>Voclio - Voice Notes & Task Management</p>
        </div>
      </div>
    `;
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ Email service is ready");
      return true;
    } catch (error) {
      console.warn("⚠️  Email service not configured:", error.message);
      return false;
    }
  }
}

export default new EmailService();
