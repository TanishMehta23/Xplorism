import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';

// Force DNS lookup to prefer IPv4, preventing ENETUNREACH errors on IPv6-unsupported cloud environments like Render
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 5,
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
  lookup: (hostname, options, callback) => {
    return dns.lookup(hostname, { ...options, family: 4 }, callback);
  }
});

const tryBrevoApi = async (email, name, subject, htmlContent) => {
  const apiKey = process.env.BREVO_API_KEY || (process.env.SMTP_HOST === 'smtp-relay.brevo.com' ? process.env.SMTP_PASS : null);
  const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_FROM || 'xplorism1@gmail.com';
  
  if (!apiKey) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: "Xplorism",
          email: senderEmail
        },
        to: [{ email, name: name || email.split('@')[0] }],
        subject: subject,
        htmlContent: htmlContent
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ Email sent instantly via Brevo HTTP API to ${email}`);
      return true;
    }
    const errText = await response.text();
    console.warn(`Brevo HTTP API failed: ${response.status} - ${errText}`);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`Brevo HTTP API connection failed or timed out: ${err.message}`);
  }
  return false;
};

export const sendOtpEmail = async (email, otp, name = 'Valued Traveler') => {
  const subject = 'Your Xplorism Verification Code';
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

  // 1. PRIMARY: Use Gmail SMTP (Ensures delivery directly from Gmail and shows in Sent folder)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const mailOptions = {
      from: `"Xplorism" <${process.env.SMTP_USER || 'xplorism1@gmail.com'}>`,
      to: email,
      subject: subject,
      html: htmlContent,
      headers: {
        'X-Priority': '3',
        'Importance': 'normal',
        'X-Mailer': 'Xplorism/1.0',
        'List-Unsubscribe': '<mailto:support@xplorism.com>',
        'Reply-To': process.env.SMTP_USER || 'xplorism1@gmail.com',
        'Precedence': 'normal',
        'Auto-Submitted': 'no',
        'X-MSMail-Priority': 'Normal'
      }
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully via Gmail SMTP to ${email}`);
      return;
    } catch (error) {
      console.error('❌ Failed to send OTP via SMTP:', error.message);
    }
  }

  // 2. SECONDARY: Try Brevo HTTP API (over HTTPS / Port 443)
  const sentViaBrevo = await tryBrevoApi(email, name, subject, htmlContent);
  if (sentViaBrevo) return;

  // 2. FALLBACK: Resend API (only if SMTP not configured)
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL, // Must be a verified domain like noreply@yourdomain.com
          to: email,
          subject: subject,
          html: htmlContent
        })
      });

      if (response.ok) {
        console.log(`✅ OTP email sent successfully via Resend to ${email}`);
        return;
      }
      const errText = await response.text();
      console.warn(`Resend API failed: ${response.status} - ${errText}`);
    } catch (err) {
      console.warn(`Resend API connection failed: ${err.message}`);
    }
  }

  // 3. LAST RESORT: Fallback to console simulation
  logSimulation(email);
};

const logSimulation = (email) => {
  console.log(`✉️  [SIMULATION] Email service simulated for: ${email}`);
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
        <a href="${process.env.CLIENT_URL || 'https://xplorism.vercel.app'}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Itinerary on Xplorism</a>
      </p>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Xplorism — Premium AI Trip Planner</p>
    </div>
  `;

  // 1. PRIMARY: Use Gmail SMTP for reliable delivery
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const mailOptions = {
      from: `"Xplorism" <${process.env.SMTP_USER || 'xplorism1@gmail.com'}>`,
      to: email,
      subject: subject,
      html: htmlContent,
      headers: {
        'X-Priority': '3',
        'Importance': 'normal',
        'X-Mailer': 'Xplorism/1.0',
        'List-Unsubscribe': '<mailto:support@xplorism.com>',
        'Reply-To': process.env.SMTP_USER || 'xplorism1@gmail.com',
        'Precedence': 'bulk',
        'Auto-Submitted': 'auto-generated',
        'X-MSMail-Priority': 'Normal'
      }
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Trip reminder email sent successfully via Gmail SMTP to ${email}`);
      return;
    } catch (error) {
      console.error('❌ Failed to send trip reminder via SMTP:', error.message);
    }
  }

  // 2. SECONDARY: Try Brevo HTTP API (over HTTPS / Port 443)
  const sentViaBrevo = await tryBrevoApi(email, name, subject, htmlContent);
  if (sentViaBrevo) return;

  // 2. FALLBACK: Resend API (only if SMTP not configured)
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: subject,
          html: htmlContent
        })
      });
      if (response.ok) {
        console.log(`✅ Trip reminder email sent successfully via Resend to ${email}`);
        return;
      }
    } catch (err) {
      console.warn(`Resend API failed for reminder: ${err.message}`);
    }
  }

  // 3. LAST RESORT: Fallback to console simulation
  logSimulationReminder(email, trip.destination);
};

const logSimulationReminder = (email, destination) => {
  console.log('====================================');
  console.log(`✉️  EMAIL REMINDER SIMULATION FOR: ${email}`);
  console.log(`🗺️  DESTINATION: ${destination}`);
  console.log('====================================');
};

export const sendTripInvitationEmail = async (email, trip, hostName, inviteLinkApprove, inviteLinkDecline) => {
  const subject = `✈️ You're Invited to Join a Trip to ${trip.destination}!`;
  
  const startDate = trip.start_date || trip.startDate;
  const endDate = trip.end_date || trip.endDate;
  const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString() : 'N/A';
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString() : 'N/A';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ef4444; text-align: center;">🎒 Xplorism Trip Invitation</h2>
      <p>Hello,</p>
      <p><strong>${hostName}</strong> has invited you to collaborate on their upcoming trip to <strong>${trip.destination}</strong>!</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #0f172a;">Trip details:</h4>
        <p style="margin: 5px 0;">🗺️ <strong>Destination:</strong> ${trip.destination}</p>
        <p style="margin: 5px 0;">📅 <strong>Dates:</strong> ${formattedStartDate} to ${formattedEndDate}</p>
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${inviteLinkApprove}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">Approve Request</a>
        <a href="${inviteLinkDecline}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Decline Request</a>
      </p>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Xplorism — Premium AI Trip Planner</p>
    </div>
  `;

  // 1. PRIMARY: Use Gmail SMTP for reliable delivery
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const mailOptions = {
      from: `"Xplorism" <${process.env.SMTP_USER || 'xplorism1@gmail.com'}>`,
      to: email,
      subject: subject,
      html: htmlContent,
      headers: {
        'X-Priority': '3',
        'Importance': 'normal',
        'X-Mailer': 'Xplorism/1.0',
        'List-Unsubscribe': '<mailto:support@xplorism.com>',
        'Reply-To': process.env.SMTP_USER || 'xplorism1@gmail.com',
        'Precedence': 'normal',
        'Auto-Submitted': 'no',
        'X-MSMail-Priority': 'Normal'
      }
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Trip invitation email sent successfully via Gmail SMTP to ${email}`);
      return;
    } catch (error) {
      console.error('❌ Failed to send trip invitation via SMTP:', error.message);
    }
  }

  // 2. SECONDARY: Try Brevo HTTP API (over HTTPS / Port 443)
  const sentViaBrevo = await tryBrevoApi(email, null, subject, htmlContent);
  if (sentViaBrevo) return;

  // 2. FALLBACK: Resend API (only if SMTP not configured)
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: subject,
          html: htmlContent
        })
      });
      if (response.ok) {
        console.log(`✅ Trip invitation email sent successfully via Resend to ${email}`);
        return;
      }
    } catch (err) {
      console.warn(`Resend API failed for invitation: ${err.message}`);
    }
  }

  // 3. LAST RESORT: Fallback to console simulation
  logSimulationInvitation(email, trip.destination, hostName);
};

const logSimulationInvitation = (email, destination, hostName) => {
  console.log('====================================');
  console.log(`✉️  EMAIL INVITATION SIMULATION FOR: ${email}`);
  console.log(`👤  HOST: ${hostName}`);
  console.log(`🗺️  DESTINATION: ${destination}`);
  console.log('====================================');
};

export const sendSupportEmail = async (userEmail, subject, message) => {
  const targetEmail = 'xplorism1@gmail.com';
  const mailSubject = `📩 Xplorism Help Center: ${subject}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ef4444; text-align: center;">📩 Help Center Inquiry</h2>
      <p>A new support request has been submitted.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;">👤 <strong>From (User):</strong> ${userEmail}</p>
        <p style="margin: 5px 0;">📌 <strong>Subject:</strong> ${subject}</p>
        <p style="margin: 15px 0 5px 0;">💬 <strong>Message:</strong></p>
        <p style="margin: 5px 0; white-space: pre-wrap; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">${message}</p>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Xplorism — Support System</p>
    </div>
  `;

  const sentViaBrevo = await tryBrevoApi(targetEmail, 'Xplorism Admin', mailSubject, htmlContent);
  if (sentViaBrevo) return;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const mailOptions = {
      from: `"Xplorism Help Center" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: mailSubject,
      html: htmlContent,
      replyTo: userEmail
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Support email sent successfully via SMTP to ${targetEmail}`);
      return;
    } catch (error) {
      console.error('❌ Failed to send support email via SMTP:', error.message);
    }
  }

  console.log('====================================');
  console.log(`✉️  SUPPORT EMAIL SIMULATION FOR: ${targetEmail}`);
  console.log(`👤  USER: ${userEmail}`);
  console.log(`📌  SUBJECT: ${subject}`);
  console.log(`💬  MESSAGE: ${message}`);
  console.log('====================================');
};


