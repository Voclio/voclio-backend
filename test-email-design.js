/**
 * Test Email Design
 * Run this to see the new email template
 */

import emailService from './src/services/email.service.js';

console.log('📧 Testing New Email Design...\n');

// Test email address
const testEmail = process.env.EMAIL_USER || 'test@example.com';
const testOTP = '123456';

console.log(`Sending test OTP to: ${testEmail}`);
console.log(`OTP Code: ${testOTP}\n`);

try {
  await emailService.sendOTP(testEmail, testOTP, 'registration');
  console.log('✅ Email sent successfully!');
  console.log('📬 Check your inbox for the new design\n');
} catch (error) {
  console.error('❌ Error sending email:', error.message);
  console.log('\n💡 Make sure you have configured:');
  console.log('   - EMAIL_USER in .env');
  console.log('   - EMAIL_APP_PASSWORD in .env');
  console.log('   - Gmail App Password (not regular password)');
  console.log('   - Generate at: https://myaccount.google.com/apppasswords\n');
}

process.exit(0);
