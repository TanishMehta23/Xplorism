import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendOtpEmail } from '../services/emailService.js';
import convert from 'heic-convert';
import sharp from 'sharp';

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
      type: 'register',
      resendCount: 0
    });

    sendOtpEmail(email, otp, name).catch(err => console.error('Error sending register OTP email:', err));

    res.status(200).json({
      requiresOtp: true,
      email,
      message: 'Verification OTP sent to your email. Check spam if you don\'t see it.',
      expiresIn: 600
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
      type: 'login',
      resendCount: 0
    });

    sendOtpEmail(email, otp, user.name).catch(err => console.error('Error sending login OTP email:', err));

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
    } else if (cachedData.type === 'update-profile') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(cachedData.password, salt);

      const userResult = await query(
        `UPDATE users 
         SET name = $1, 
             email = $2, 
             password = $3,
             profile_photo = COALESCE($4, profile_photo), 
             preferences = COALESCE($5, preferences), 
             travel_history = COALESCE($6, travel_history)
         WHERE id = $7 
         RETURNING id, name, email, created_at, google_id, profile_photo, preferences, travel_history`,
        [
          cachedData.name, 
          cachedData.email, 
          hashedPassword, 
          cachedData.profilePhoto || null, 
          cachedData.preferences ? JSON.stringify(cachedData.preferences) : null, 
          cachedData.travelHistory ? JSON.stringify(cachedData.travelHistory) : null, 
          cachedData.userId
        ]
      );

      const updatedUser = userResult.rows[0];

      // Generate a fresh JWT
      const token = jwt.sign(
        { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Profile and password updated successfully',
        token,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          profilePhoto: updatedUser.profile_photo,
          preferences: updatedUser.preferences,
          travelHistory: updatedUser.travel_history
        }
      });
    }

    res.status(400).json({ message: 'Invalid action type' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend OTP (Helper for spam handling)
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cachedData = otpCache.get(email);
    if (!cachedData) {
      return res.status(400).json({ message: 'No active OTP request found. Please start fresh.' });
    }

    // Check if too many resend attempts (prevent spam)
    if (!cachedData.resendCount) {
      cachedData.resendCount = 1;
    } else if (cachedData.resendCount >= 3) {
      return res.status(429).json({ message: 'Too many resend attempts. Please wait 10 minutes before trying again.' });
    } else {
      cachedData.resendCount += 1;
    }

    // Generate new OTP
    const newOtp = generateOtp();
    cachedData.otp = newOtp;
    cachedData.expiresAt = Date.now() + 10 * 60 * 1000; // Reset 10 min timer
    otpCache.set(email, cachedData);

    // Determine user name
    const userName = cachedData.name || cachedData.email.split('@')[0];
    sendOtpEmail(email, newOtp, userName).catch(err => console.error('Error sending resend OTP email:', err));

    res.status(200).json({
      message: 'Verification OTP resent successfully. Please check your inbox and spam folder.',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
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
      type: 'forgot',
      resendCount: 0
    });

    sendOtpEmail(email, otp, user.name).catch(err => console.error('Error sending forgot password OTP email:', err));

    res.status(200).json({
      requiresOtp: true,
      email,
      message: 'OTP sent to your email. Check spam if you don\'t see it.',
      expiresIn: 600
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

// Get User Profile & Stats
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user details
    const userResult = await query(
      'SELECT id, name, email, created_at, google_id, profile_photo, preferences, travel_history FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Fetch stats
    const tripsResult = await query(
      'SELECT COUNT(*) as count, COALESCE(SUM(budget), 0) as total_budget FROM trips WHERE user_id = $1',
      [userId]
    );
    const favoritesResult = await query(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = $1',
      [userId]
    );

    const stats = {
      tripsCount: parseInt(tripsResult.rows[0].count, 10),
      totalBudget: parseFloat(tripsResult.rows[0].total_budget),
      favoritesCount: parseInt(favoritesResult.rows[0].count, 10)
    };

    res.json({
      user,
      stats
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let { name, email, password, profilePhoto, preferences, travelHistory } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    // Process all profile photos on the backend using sharp (for resizing, format normalization to JPEG, and compression)
    if (profilePhoto && (profilePhoto.startsWith('data:image/') || profilePhoto.startsWith('data:application/octet-stream;base64,'))) {
      try {
        console.log('Processing and resizing profile photo using sharp on the backend...');
        const base64Data = profilePhoto.replace(/^data:[^;]+;base64,/, "");
        const inputBuffer = Buffer.from(base64Data, 'base64');
        
        let outputBuffer;
        if (profilePhoto.startsWith('data:image/heic') || profilePhoto.startsWith('data:image/heif') || profilePhoto.includes('ftypheic') || profilePhoto.includes('ftypmif1')) {
          // HEIC conversion with heic-convert fallback
          try {
            outputBuffer = await sharp(inputBuffer)
              .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 60 })
              .toBuffer();
          } catch (sharpHeicErr) {
            console.error('Sharp HEIC decoding failed, falling back to heic-convert...', sharpHeicErr);
            const convertedBuffer = await convert({
              buffer: inputBuffer,
              format: 'JPEG',
              quality: 0.6
            });
            outputBuffer = await sharp(convertedBuffer)
              .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 60 })
              .toBuffer();
          }
        } else {
          // Standard JPEG, PNG, WEBP conversion and resizing
          outputBuffer = await sharp(inputBuffer)
            .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 60 })
            .toBuffer();
        }
        
        profilePhoto = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
        console.log('Profile photo processed successfully via sharp. Length:', profilePhoto.length);
      } catch (err) {
        console.error('Failed to process profile photo on backend:', err);
      }
    }

    // Check email uniqueness if email is changed
    const emailCheck = await query(
      'SELECT * FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already taken by another account' });
    }

    // If password change is requested, we require OTP verification first
    if (password && password.trim() !== '') {
      const otp = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

      otpCache.set(email, {
        userId,
        name,
        email,
        password, // Keep password plain until OTP verified
        profilePhoto,
        preferences,
        travelHistory,
        otp,
        expiresAt,
        type: 'update-profile'
      });

      sendOtpEmail(email, otp, name).catch(err => console.error('Error sending profile update OTP email:', err));

      return res.status(200).json({
        requiresOtp: true,
        email,
        message: 'An OTP has been sent to your email to verify password change'
      });
    }

    // Otherwise, update details immediately
    const userResult = await query(
      `UPDATE users 
       SET name = $1, 
           email = $2, 
           profile_photo = COALESCE($3, profile_photo), 
           preferences = COALESCE($4, preferences), 
           travel_history = COALESCE($5, travel_history) 
       WHERE id = $6 
       RETURNING id, name, email, created_at, google_id, profile_photo, preferences, travel_history`,
      [
        name, 
        email, 
        profilePhoto || null, 
        preferences ? JSON.stringify(preferences) : null, 
        travelHistory ? JSON.stringify(travelHistory) : null, 
        userId
      ]
    );

    const updatedUser = userResult.rows[0];

    // Generate a fresh JWT token to reflect the updated details
    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Profile updated successfully',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePhoto: updatedUser.profile_photo,
        preferences: updatedUser.preferences,
        travelHistory: updatedUser.travel_history
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

