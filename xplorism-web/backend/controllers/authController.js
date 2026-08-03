import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendOtpEmail } from '../services/emailService.js';

// In-memory OTP cache
// Map of: email -> { name, email, password, otp, expiresAt, type }
const otpCache = new Map();

// Helper to generate 6 digit code
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register a request (Sends OTP)
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    otpCache.set(email, {
      name,
      email,
      password,
      otp,
      expiresAt,
      type: 'register'
    });

    await sendOtpEmail(email, otp, name);

    res.status(200).json({
      requiresOtp: true,
      email,
      message: 'Verification OTP sent to your email'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user (Sends OTP)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find user
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Account not found' });
    }

    const user = userResult.rows[0];

    // Check if user has a password set (e.g. if they registered via Google Sign-In)
    if (!user.password || typeof user.password !== 'string') {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please sign in with Google.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    otpCache.set(email, {
      id: user.id,
      name: user.name,
      email: user.email,
      otp,
      expiresAt,
      type: 'login'
    });

    await sendOtpEmail(email, otp, user.name);

    res.status(200).json({
      requiresOtp: true,
      email,
      message: 'Verification OTP sent to your email'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const cachedData = otpCache.get(email);
    if (!cachedData) {
      return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
    }

    if (Date.now() > cachedData.expiresAt) {
      otpCache.delete(email);
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    if (cachedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP cache
    otpCache.delete(email);

    if (cachedData.type === 'register') {
      // Create user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(cachedData.password, salt);

      const newUser = await query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [cachedData.name, cachedData.email, hashedPassword]
      );

      const user = newUser.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } else if (cachedData.type === 'login') {
      // Generate JWT
      const token = jwt.sign(
        { id: cachedData.id, email: cachedData.email, name: cachedData.name },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: cachedData.id,
          name: cachedData.name,
          email: cachedData.email,
        },
      });
    } else if (cachedData.type === 'forgot') {
      // Return a temporary reset token
      const resetToken = jwt.sign(
        { email: cachedData.email, verified: true },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '15m' }
      );

      return res.json({
        verified: true,
        resetToken,
        message: 'OTP verified successfully. You can now reset your password.'
      });
    }

    res.status(400).json({ message: 'Invalid action type' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request Forgot Password (Sends OTP)
export const requestForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Account not found' });
    }

    const user = userResult.rows[0];
    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpCache.set(email, {
      email,
      otp,
      expiresAt,
      type: 'forgot'
    });

    await sendOtpEmail(email, otp, user.name);

    res.status(200).json({
      requiresOtp: true,
      email,
      message: 'OTP sent to your email.'
    });
  } catch (error) {
    console.error('Forgot password OTP request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password with Reset Token
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
      if (decoded.email !== email || !decoded.verified) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
    } catch (e) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Google Login / Register (Google is SSO, no OTP required as they already MFA verify on Google)
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Credential token is required' });
    }

    // Verify token with Google's API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const payload = await googleRes.json();
    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user already exists with this google_id
    let userResult = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user = userResult.rows[0];

    if (!user) {
      // Check if user already exists with this email but without google_id
      userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
      user = userResult.rows[0];

      if (user) {
        // Link google_id to the existing user account
        const updateResult = await query(
          'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING id, name, email',
          [googleId, user.id]
        );
        user = updateResult.rows[0];
      } else {
        // Create new user (password is null)
        const insertResult = await query(
          'INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING id, name, email',
          [name || email.split('@')[0], email, googleId]
        );
        user = insertResult.rows[0];
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
