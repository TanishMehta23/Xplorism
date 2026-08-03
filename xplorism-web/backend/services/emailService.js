import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendOtpEmail = async (email, otp, name = 'Valued Traveler') => {
  const mailOptions = {
    from: `"Xplorism Team" <${process.env.SMTP_FROM || 'noreply@xplorism.com'}>`,
    to: email,
    subject: '🔑 Your Xplorism Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488; text-align: center;">Welcome to Xplorism</h2>
        <p>Hello ${name},</p>
        <p>You requested a verification code to access your Xplorism account. Please use the following One-Time Password (OTP) to complete your request:</p>
        <div style="background-color: #f0fdfa; border: 1px dashed #0d9488; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; color: #0f766e; letter-spacing: 4px;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b;">This verification code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Xplorism — Premium AI Trip Planner</p>
      </div>
    `,
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Real OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send real email via SMTP. Fallback to console log:', error.message);
      console.log('====================================');
      console.log(`✉️  EMAIL SIMULATION FOR: ${email}`);
      console.log(`🔑  OTP CODE: ${otp}`);
      console.log('====================================');
    }
  } else {
    console.log('⚠️ SMTP credentials not configured. Local fallback log:');
    console.log('====================================');
    console.log(`✉️  EMAIL SIMULATION FOR: ${email}`);
    console.log(`🔑  OTP CODE: ${otp}`);
    console.log('====================================');
  }
};
