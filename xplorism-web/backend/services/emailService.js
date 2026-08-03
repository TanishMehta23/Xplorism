import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';

// Force DNS lookup to prefer IPv4, preventing ENETUNREACH errors on IPv6-unsupported cloud environments like Render
dns.setDefaultResultOrder('ipv4first');

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
  const subject = '🔑 Your Xplorism Verification Code';
  const htmlContent = `
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
  `;

  // 1. Try Resend HTTP API first (Bypasses Render's port blocks completely)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Xplorism <onboarding@resend.dev>', // Resend's free sandbox testing sender
          to: email,
          subject: subject,
          html: htmlContent
        })
      });

      if (response.ok) {
        console.log(`✅ Real OTP email sent successfully via Resend HTTP API to ${email}`);
        return;
      }
      const errText = await response.text();
      console.warn(`Resend HTTP API failed: ${response.status} - ${errText}`);
    } catch (err) {
      console.warn(`Resend HTTP API connection failed: ${err.message}`);
    }
  }

  // 2. Fallback to standard SMTP (Works locally on your PC)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const mailOptions = {
      from: `"Xplorism Team" <${process.env.SMTP_FROM || 'noreply@xplorism.com'}>`,
      to: email,
      subject: subject,
      html: htmlContent
    };

    transporter.sendMail(mailOptions)
      .then(() => {
        console.log(`✅ Real OTP email sent successfully via SMTP to ${email}`);
      })
      .catch((error) => {
        console.error('❌ Failed to send SMTP email. Local console log:', error.message);
        logSimulation(email, otp);
      });
  } else {
    logSimulation(email, otp);
  }
};

const logSimulation = (email, otp) => {
  console.log('====================================');
  console.log(`✉️  EMAIL SIMULATION FOR: ${email}`);
  console.log(`🔑  OTP CODE: ${otp}`);
  console.log('====================================');
};
