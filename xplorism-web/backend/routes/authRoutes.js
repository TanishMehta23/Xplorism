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

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', requestForgotPassword);
router.post('/reset-password', resetPassword);

// User profile endpoints (Protected)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;

