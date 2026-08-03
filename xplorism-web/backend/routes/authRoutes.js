import express from 'express';
import { 
  register, 
  login, 
  googleLogin, 
  verifyOtp, 
  requestForgotPassword, 
  resetPassword 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', requestForgotPassword);
router.post('/reset-password', resetPassword);

export default router;
