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
   * Modern Email Template with Enhanced Design
   */
  getTemplate(title, content) {
    return `
      <!DOCTYPE html>
      <html lang="en" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 40px 20px; min-height: 100vh;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">
            
            <!-- Header with Modern Gradient -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%); padding: 50px 30px; text-align: center; position: relative;">
              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; display: inline-block;">
                <h1 style="margin: 0; color: white; font-size: 36px; font-weight: 800; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">VOCLIO</h1>
                <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500; letter-spacing: 1px;">Voice Notes & Task Management</p>
              </div>
            </div>

            <!-- Body Content -->
            <div style="padding: 50px 40px; text-align: center;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 28px; font-weight: 700;">${title}</h2>
              ${content}
            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(to bottom, #fafafa 0%, #f3f4f6 100%); padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 500;">&copy; ${new Date().getFullYear()} Voclio. All rights reserved.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated message, please do not reply.</p>
            </div>
          </div>
          
          <!-- Bottom Spacing -->
          <div style="height: 40px;"></div>
        </div>
      </body>
      </html>
    `;
  }

  async sendOTP(email, otpCode, type) {
    try {
      const subject = this.getOTPSubject(type);
      const typeLabel = this.getOTPTypeLabel(type);

      const content = `
        <div style="margin-bottom: 32px;">
          <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
            Please use the verification code below to complete your <strong>${typeLabel}</strong>:
          </p>
        </div>
        
        <!-- OTP Code Box with Modern Design -->
        <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 16px; padding: 32px; margin: 32px 0; border: 2px dashed #d1d5db; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: white; border-radius: 12px; padding: 28px 20px; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);">
            <p style="margin: 0 0 16px; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; text-align: center;">Your Verification Code</p>
            <div style="font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace; font-size: 44px; font-weight: 900; letter-spacing: 8px; color: #7c3aed; text-align: center; padding: 8px 0; text-shadow: 0 2px 8px rgba(124, 58, 237, 0.15); white-space: nowrap; overflow-x: auto;">
              ${otpCode}
            </div>
            <p style="margin: 12px 0 0; color: #9ca3af; font-size: 11px; text-align: center; font-style: italic;">Select and copy the code above</p>
          </div>
        </div>
        
        <!-- Info Box -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
            ⏱️ This code will expire in <strong>10 minutes</strong>
          </p>
        </div>
        
        <!-- Security Notice -->
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">🔒 Security Notice</p>
          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
            Never share this code with anyone. Voclio will never ask for your verification code via phone or email.
          </p>
        </div>
        
        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
          If you didn't request this code, please ignore this email or contact support if you have concerns.
        </p>
      `;

      const html = this.getTemplate("Verification Code", content);

      const info = await this.transporter.sendMail({
        from: `"Voclio" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: html,
      });

      console.log("✅ OTP email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Error sending OTP email:", error);
      if (config.nodeEnv === "development") {
        console.log(`\n📧 Development Mode - OTP for ${email}: ${otpCode}\n`);
      }
      throw error;
    }
  }

  getOTPTypeLabel(type) {
    const labels = {
      login: "Login",
      registration: "Registration",
      password_reset: "Password Reset",
      email_verification: "Email Verification",
      phone_verification: "Phone Verification",
    };
    return labels[type] || "Verification";
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
