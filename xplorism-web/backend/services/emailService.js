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

export const sendTripReminderEmail = async (email, trip, notifications, name = 'Traveler') => {
  const subject = `✈️ Your Upcoming Trip Reminder: ${trip.destination}`;
  
  const alertsHtml = notifications.map(n => `
    <li style="margin-bottom: 10px; color: #b45309; background-color: #fffbeb; border: 1px solid #fde68a; padding: 10px; border-radius: 6px; list-style-type: none;">
      <strong>⚠️ ${n.title}:</strong> ${n.message}
    </li>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ef4444; text-align: center;">🎒 Your Xplorism Trip Reminder</h2>
      <p>Hello ${name},</p>
      <p>You have an upcoming trip planned to <strong>${trip.destination}</strong> starting on <strong>${new Date(trip.startDate).toLocaleDateString()}</strong>!</p>
      
      ${notifications.length > 0 ? `
        <h3 style="color: #334155; margin-top: 20px;">Current Alerts & Reminders:</h3>
        <ul style="padding-left: 0;">
          ${alertsHtml}
        </ul>
      ` : ''}

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <h4 style="margin-top: 0; color: #0f172a;">Trip Summary:</h4>
        <p style="margin: 5px 0;">🗺️ <strong>Destination:</strong> ${trip.destination}</p>
        <p style="margin: 5px 0;">📅 <strong>Dates:</strong> ${new Date(trip.startDate).toLocaleDateString()} to ${new Date(trip.endDate).toLocaleDateString()}</p>
        <p style="margin: 5px 0;">👥 <strong>Travelers:</strong> ${trip.travelers}</p>
        <p style="margin: 5px 0;">💰 <strong>Total Budget:</strong> ${trip.budget}</p>
      </div>

      <p style="margin-top: 25px; text-align: center;">
        <a href="https://xplorism.com" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Itinerary on Xplorism</a>
      </p>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Xplorism — Premium AI Trip Planner</p>
    </div>
  `;

  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Xplorism <onboarding@resend.dev>',
          to: email,
          subject: subject,
          html: htmlContent
        })
      });
      if (response.ok) {
        console.log(`✅ Real Reminder email sent successfully via Resend to ${email}`);
        return;
      }
    } catch (err) {
      console.warn(`Resend HTTP API failed: ${err.message}`);
    }
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const mailOptions = {
      from: `"Xplorism Team" <${process.env.SMTP_FROM || 'noreply@xplorism.com'}>`,
      to: email,
      subject: subject,
      html: htmlContent
    };
    transporter.sendMail(mailOptions)
      .then(() => console.log(`✅ Reminder email sent successfully via SMTP to ${email}`))
      .catch((error) => {
        console.error('❌ Failed to send SMTP reminder email:', error.message);
        logSimulationReminder(email, trip.destination);
      });
  } else {
    logSimulationReminder(email, trip.destination);
  }
};

const logSimulationReminder = (email, destination) => {
  console.log('====================================');
  console.log(`✉️  EMAIL REMINDER SIMULATION FOR: ${email}`);
  console.log(`🗺️  DESTINATION: ${destination}`);
  console.log('====================================');
};

