import express from 'express';
import { 
  register, 
  login, 
  googleLogin, 
  verifyOtp, 
  resendOtp,
  requestForgotPassword, 
  resetPassword,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', googleLogin);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/forgot-password', authLimiter, requestForgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// User profile endpoints (Protected - exempt from authLimiter)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;

