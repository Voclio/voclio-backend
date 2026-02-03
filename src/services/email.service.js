import { Resend } from "resend";
import config from "../config/index.js";

const baseUrl = process.env.API_URL || "http://localhost:3000";

class EmailService {
  constructor() {
    // Only initialize Resend if API key is provided
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key_here') {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.useResend = true;
    } else {
      this.useResend = false;
      console.warn("⚠️  Resend API key not configured. Email service will run in development mode.");
    }
    this.fromEmail = process.env.EMAIL_FROM || "noreply@build8.dev";
  }

  /**
   * Modern Email Template with Enhanced Design - Fully Responsive
   */
  getTemplate(title, content) {
    return `
      <!DOCTYPE html>
      <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
        <title>${title}</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          /* Reset styles */
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
          body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
          a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
          
          /* Responsive styles */
          @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .fluid-padding { padding-left: 16px !important; padding-right: 16px !important; }
            .header-padding { padding: 32px 20px !important; }
            .body-padding { padding: 32px 20px !important; }
            .footer-padding { padding: 24px 16px !important; }
            .mobile-title { font-size: 28px !important; letter-spacing: 1px !important; }
            .mobile-subtitle { font-size: 12px !important; }
            .section-title { font-size: 22px !important; }
            .mobile-text { font-size: 14px !important; }
            .otp-code { font-size: 28px !important; letter-spacing: 4px !important; padding: 16px 8px !important; }
            .otp-container { padding: 20px 12px !important; margin: 20px 0 !important; }
            .otp-inner { padding: 20px 12px !important; }
            .info-box { padding: 14px 16px !important; }
            .button-link { padding: 12px 24px !important; font-size: 14px !important; }
            .url-box { font-size: 11px !important; padding: 8px !important; }
            .stack-column { display: block !important; width: 100% !important; }
          }
          
          @media only screen and (max-width: 480px) {
            .mobile-title { font-size: 24px !important; }
            .section-title { font-size: 20px !important; }
            .otp-code { font-size: 24px !important; letter-spacing: 3px !important; }
            .body-padding { padding: 24px 16px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f3ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        
        <!-- Visually Hidden Preheader Text -->
        <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
          ${title} - Voclio
        </div>
        
        <!-- Full Width Background -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); background-color: #f5f3ff;">
          <tr>
            <td style="padding: 24px 16px;" class="fluid-padding">
              
              <!--[if mso]>
              <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="600">
              <tr>
              <td>
              <![endif]-->
              
              <!-- Email Container -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);" class="email-container">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%); background-color: #7c3aed; padding: 40px 24px; text-align: center;" class="header-padding">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 16px 24px; display: inline-block;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);" class="mobile-title">VOCLIO</h1>
                            <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500; letter-spacing: 1px;" class="mobile-subtitle">Voice Notes & Task Management</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td style="padding: 40px 32px; text-align: center;" class="body-padding">
                    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;" class="section-title">${title}</h2>
                    ${content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(to bottom, #fafafa 0%, #f3f4f6 100%); background-color: #f3f4f6; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;" class="footer-padding">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 500;">&copy; ${new Date().getFullYear()} Voclio. All rights reserved.</p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated message, please do not reply.</p>
                  </td>
                </tr>
                
              </table>
              
              <!--[if mso]>
              </td>
              </tr>
              </table>
              <![endif]-->
              
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `;
  }

  async sendOTP(email, otpCode, type) {
    try {
      if (!this.useResend) {
        console.log(`\n📧 Development Mode - OTP for ${email}: ${otpCode}\n`);
        return true;
      }

      const subject = this.getOTPSubject(type);
      const typeLabel = this.getOTPTypeLabel(type);

      const content = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;" class="mobile-text">
                Please use the verification code below to complete your <strong>${typeLabel}</strong>:
              </p>
            </td>
          </tr>
        </table>
        
        <!-- OTP Code Box with Modern Design -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;" class="otp-container">
          <tr>
            <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); background-color: #f3f4f6; border-radius: 16px; padding: 24px 16px; border: 2px dashed #d1d5db;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #ffffff; border-radius: 12px; padding: 24px 16px; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);" class="otp-inner">
                    <p style="margin: 0 0 12px; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; text-align: center;">Your Verification Code</p>
                    <p style="margin: 0; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace; font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #7c3aed; text-align: center; padding: 8px 0; text-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);" class="otp-code">${otpCode}</p>
                    <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px; text-align: center; font-style: italic;">Select and copy the code above</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Info Box -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 16px;" class="info-box">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;" class="mobile-text">
                ⏱️ This code will expire in <strong>10 minutes</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Security Notice -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background-color: #f3f4f6; border-radius: 8px; padding: 16px;" class="info-box">
              <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">🔒 Security Notice</p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;" class="mobile-text">
                Never share this code with anyone. Voclio will never ask for your verification code via phone or email.
              </p>
            </td>
          </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding-top: 16px;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;" class="mobile-text">
                If you didn't request this code, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
        </table>
      `;

      const html = this.getTemplate("Verification Code", content);

      const { data, error } = await this.resend.emails.send({
        from: `Voclio <${this.fromEmail}>`,
        to: email,
        subject: subject,
        html: html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("✅ OTP email sent:", data.id);
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
      if (!this.useResend) {
        console.log(`\n📧 Development Mode - Password reset for ${email}: ${resetUrl}\n`);
        return true;
      }

      const content = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td>
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;" class="mobile-text">Hi <strong>${userName || "Friend"}</strong>,</p>
              <p style="margin: 0 0 16px; color: #4b5563; font-size: 15px; line-height: 1.6;" class="mobile-text">You requested to reset your password. No worries, we've got you covered!</p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.6;" class="mobile-text">Click the button below to reset your password:</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 0;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="50%" strokecolor="#6d28d9" fillcolor="#7c3aed">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.25); mso-hide: all;" class="button-link">Reset Password</a>
              <!--<![endif]-->
            </td>
          </tr>
          <tr>
            <td style="padding-top: 16px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;" class="mobile-text">Or copy and paste this link into your browser:</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0; word-break: break-all; font-size: 12px; background-color: #f3f4f6; padding: 12px; border-radius: 8px; color: #4b5563; line-height: 1.5;" class="url-box">${resetUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 16px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;" class="mobile-text">This link will expire in 1 hour.</p>
            </td>
          </tr>
        </table>
      `;

      const html = this.getTemplate("Password Reset", content);

      const { data, error } = await this.resend.emails.send({
        from: `Voclio <${this.fromEmail}>`,
        to: email,
        subject: "Reset Your Password - Voclio",
        html: html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("✅ Password reset email sent:", data.id);
      return true;
    } catch (error) {
      console.error("❌ Error sending password reset email:", error);
      if (config.nodeEnv === "development") {
        console.log(`\n📧 Reset link for ${email}: ${resetUrl}\n`);
      }
      throw error;
    }
  }

  async sendReminder(email, reminderData) {
    try {
      if (!this.useResend) {
        console.log(`\n📧 Development Mode - Reminder for ${email}: ${reminderData.title}\n`);
        return true;
      }

      const { title, message, reminder_time } = reminderData;

      const content = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;" class="info-box">
              <p style="font-size: 18px; font-weight: 600; color: #6d28d9; margin: 0;">${title}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 0;">
              <p style="font-size: 15px; margin: 0; color: #374151; line-height: 1.6;" class="mobile-text">${message}</p>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #f3f4f6; padding: 14px 16px; border-radius: 8px; text-align: center;" class="info-box">
                    <span style="font-size: 20px; vertical-align: middle;">⏰</span>
                    <span style="font-weight: 600; color: #374151; font-size: 15px; vertical-align: middle; margin-left: 8px;" class="mobile-text">${new Date(reminder_time).toLocaleString()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const html = this.getTemplate("Reminder", content);

      const { data, error } = await this.resend.emails.send({
        from: `Voclio <${this.fromEmail}>`,
        to: email,
        subject: `Reminder: ${title}`,
        html: html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("✅ Reminder email sent:", data.id);
      return true;
    } catch (error) {
      console.error("❌ Error sending reminder email:", error);
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
      // Check if Resend API key is configured
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
        console.log("⚠️  Email service running in development mode (Resend not configured)");
        return true; // Allow server to start
      }
      console.log("✅ Email service (Resend) is ready");
      return true;
    } catch (error) {
      console.warn("⚠️  Email service not configured:", error.message);
      return false;
    }
  }
}

export default new EmailService();
