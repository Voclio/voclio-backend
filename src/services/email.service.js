import pkg from "nodemailer";
const { createTransport } = pkg;
import config from "../config/index.js";

const baseUrl = process.env.API_URL || "http://localhost:3000";

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

  /**
   * Common Email Template with Branding
   */
  getTemplate(title, content) {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 40px 20px; min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header with Logo & Gradient -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 40px 20px; text-align: center;">
            <img src="${baseUrl}/public/voclio-logo.png" alt="Voclio" style="height: 60px; width: auto; display: block; margin: 0 auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
          </div>

          <!-- Body Content -->
          <div style="padding: 40px 30px; text-align: left; color: #374151; font-size: 16px; line-height: 1.6;">
            <h1 style="margin-top: 0; margin-bottom: 24px; color: #111827; font-size: 24px; font-weight: 700; text-align: center;">${title}</h1>
            ${content}
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Voclio. All rights reserved.</p>
            <p style="margin: 8px 0 0;">Voice Notes & Task Management</p>
          </div>
        </div>
      </div>
    `;
  }

  async sendOTP(email, otpCode, type) {
    try {
      const subject = this.getOTPSubject(type);

      const content = `
        <p style="margin-bottom: 24px; text-align: center;">Please use the verification code below to complete your ${type.replace("_", " ")}:</p>
        
        <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; border: 1px dashed #d1d5db;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #7c3aed; display: block;">${otpCode}</span>
        </div>
        
        <p style="font-size: 14px; text-align: center; color: #6b7280;">This code will expire in 10 minutes.</p>
        <p style="font-size: 14px; text-align: center; color: #6b7280; margin-bottom: 0;">If you didn't request this code, please ignore this email.</p>
      `;

      const html = this.getTemplate("Verification Code", content);

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
      if (config.nodeEnv === "development") {
        console.log(`\n📧 OTP for ${email}: ${otpCode}\n`);
      }
      throw error;
    }
  }

  async sendPasswordReset(email, resetUrl, userName) {
    try {
      const content = `
        <p>Hi <strong>${userName || "Friend"}</strong>,</p>
        <p>You requested to reset your password. No worries, we've got you covered!</p>
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.25);">Reset Password</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; font-size: 13px; background: #f3f4f6; padding: 10px; border-radius: 8px; color: #4b5563;">${resetUrl}</p>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">This link will expire in 1 hour.</p>
      `;

      const html = this.getTemplate("Password Reset", content);

      const info = await this.transporter.sendMail({
        from: `"Voclio" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your Password - Voclio",
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

      const content = `
        <div style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="font-size: 18px; font-weight: 600; color: #6d28d9; margin: 0;">${title}</p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 24px;">${message}</p>
        
        <div style="display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; padding: 12px; border-radius: 8px;">
          <span style="font-size: 20px; margin-right: 8px;">⏰</span>
          <span style="font-weight: 600; color: #374151;">${new Date(reminder_time).toLocaleString()}</span>
        </div>
      `;

      const html = this.getTemplate("Reminder", content);

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
      login: "Your Login Code",
      registration: "Verify Your Email",
      password_reset: "Password Reset Code",
      phone_verification: "Verify Phone Number",
    };
    return `${subjects[type] || "Verification Code"} - Voclio`;
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
