import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, ChevronLeft, CheckCircle, ShieldCheck, Mail as MailAlert } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { nativeGoogleSignIn, initGoogleAuth } from '../services/googleAuth';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'otp' | 'reset-password'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, verifyOtp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // New States
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // OTP States
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpType, setOtpType] = useState('login'); // 'login' | 'register' | 'forgot'
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Reset Password States
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const handleNativeGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const idToken = await nativeGoogleSignIn();
      await loginWithGoogle(idToken);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      if (err.message && (err.message.includes('cancel') || err.message.includes('12501') || err.message.includes('16'))) {
        // User cancelled the prompt
        return;
      }
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCallback = async (response) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (isNative) {
      initGoogleAuth();
      return undefined;
    }

    if (!clientId || !isOpen || mode !== 'login') {
      return undefined;
    }

    let cancelled = false;
    let retryTimer;

    const renderGoogleButton = () => {
      const googleApi = window.google?.accounts?.id;
      const targetBtn = document.getElementById('modal-google-signin-btn');

      if (!googleApi || !targetBtn) {
        return false;
      }

      targetBtn.innerHTML = '';
      googleApi.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });
      googleApi.renderButton(targetBtn, {
        theme: 'outline',
        size: 'large',
        width: '352',
        text: 'signin_with',
      });
      return true;
    };

    const startPolling = () => {
      retryTimer = window.setInterval(() => {
        if (cancelled) {
          return;
        }

        if (renderGoogleButton()) {
          clearInterval(retryTimer);
        }
      }, 100);
    };

    if (!renderGoogleButton()) {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

      if (script) {
        script.addEventListener('load', renderGoogleButton, { once: true });
        startPolling();
      } else {
        const googleScript = document.createElement('script');
        googleScript.src = 'https://accounts.google.com/gsi/client';
        googleScript.async = true;
        googleScript.defer = true;
        googleScript.onload = renderGoogleButton;
        document.head.appendChild(googleScript);
        startPolling();
      }
    }

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearInterval(retryTimer);
      }
    };
  }, [isOpen, loginWithGoogle, clientId, mode, isNative]);

  // Load remembered email on open
  useEffect(() => {
    if (isOpen) {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, [isOpen]);

  // Reset fields when mode changes or modal opens/closes
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setName('');
    if (!localStorage.getItem('rememberedEmail')) {
      setEmail('');
    }
    setPassword('');
    setConfirmPassword('');
    setResetEmail('');
    setResetSuccess('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPassword(false);
    setShowNewPassword(false);
    setOtp('');
    setResendTimer(0);
  }, [initialMode, isOpen]);

  // Timer for OTP resend countdown
  useEffect(() => {
    let interval;
    if (resendTimer > 0 && mode === 'otp') {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, mode]);

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email: pendingEmail });
      setOtp('');
      setResendTimer(60); // 60 second cooldown
      setError(''); // Clear any previous error
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      setLoading(true);
      try {
        const data = await login(email, password);
        
        // Remember email logic
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        if (data && data.requiresOtp) {
          setPendingEmail(email);
          setOtpType('login');
          setMode('otp');
          setOtp('');
        } else {
          onClose();
          navigate('/dashboard');
        }
      } catch (err) {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name || !email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      try {
        const data = await register(name, email, password);
        if (data && data.requiresOtp) {
          setPendingEmail(email);
          setOtpType('register');
          setMode('otp');
          setOtp('');
        } else {
          onClose();
          navigate('/dashboard');
        }
      } catch (err) {
        setError(err.message || 'Registration failed. Try a different email.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }

    setOtpLoading(true);
    try {
      if (otpType === 'forgot') {
        const data = await api.post('/auth/verify-otp', { email: pendingEmail, otp });
        if (data && data.verified && data.resetToken) {
          setResetToken(data.resetToken);
          setMode('reset-password');
        } else {
          setError('Failed to verify OTP');
        }
      } else {
        await verifyOtp(pendingEmail, otp);
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email: resetEmail });
      if (data && data.requiresOtp) {
        setPendingEmail(resetEmail);
        setOtpType('forgot');
        setMode('otp');
        setOtp('');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (!newPassword || !confirmNewPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: pendingEmail,
        resetToken,
        newPassword
      });
      setResetSuccess('Your password has been reset successfully. Please log in.');
      setMode('login');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please request a new code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal content container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white text-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] shadow-2xl relative z-10 overflow-y-auto border border-slate-100 font-sans"
        >
          {/* Header section with branding & close button */}
          <div className="px-8 pt-8 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <img 
                  src="/logo.png" 
                  alt="Xplorism Logo" 
                  className="h-8 w-8 object-contain rounded-full shadow-sm" 
                />
                <span className="text-slate-900 font-extrabold tracking-tight text-lg">
                  Xplorism
                </span>
              </div>
              <p className="text-slate-500 mt-2 text-xs font-normal">
                {mode === 'login' && 'Welcome back! Sign in to continue.'}
                {mode === 'register' && 'Create an account to start exploring.'}
                {mode === 'forgot' && 'Reset your account password.'}
                {mode === 'otp' && 'Verify your security OTP code.'}
                {mode === 'reset-password' && 'Enter a secure new password.'}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition duration-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sliding Tabs (Hide on forgot/otp/reset-password modes) */}
          {!['forgot', 'otp', 'reset-password'].includes(mode) && (
            <div className="px-8 pb-2">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="px-8 pb-8 pt-2">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start space-x-2.5 text-rose-600 text-xs font-medium"
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {resetSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start space-x-2.5 text-emerald-800 text-xs font-medium"
              >
                <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
                <span>{resetSuccess}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'forgot' && (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition duration-150 mb-4 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Login</span>
                  </button>

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1.5" htmlFor="modal-reset-email">
                        Email Address
                      </label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
                          <Mail className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          id="modal-reset-email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs text-slate-800 placeholder-slate-400 transition"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {mode === 'otp' && (
                <motion.div
                  key="otp-verification"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() => { setMode(otpType === 'forgot' ? 'forgot' : 'login'); setError(''); }}
                    className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition duration-150 mb-4 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-1.5 bg-rose-50 rounded-xl text-rose-500">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Enter OTP</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Sent to {pendingEmail}</p>
                    </div>
                  </div>

                  {/* Spam folder warning */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-100 flex items-start space-x-2 text-amber-700 text-xs"
                  >
                    <MailAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="font-medium">Didn't receive? Check your spam folder.</span>
                  </motion.div>

                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1.5" htmlFor="modal-otp">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        id="modal-otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="w-full text-center tracking-[10px] font-mono text-xl py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                        maxLength={6}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpLoading ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify Code</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>

                    {/* Resend OTP Button */}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || resendLoading}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendLoading ? (
                        <div className="h-4 w-4 border-2 border-slate-400/30 border-t-slate-700 rounded-full animate-spin mx-auto" />
                      ) : resendTimer > 0 ? (
                        <span>Resend OTP in {resendTimer}s</span>
                      ) : (
                        <span>Didn't receive? Resend OTP</span>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {mode === 'reset-password' && (
                <motion.div
                  key="reset-password-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h4 className="font-bold text-slate-900 text-sm mb-4">Reset Password</h4>

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1.5" htmlFor="modal-new-password">
                        New Password
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Lock className="h-4 w-4" />
                        </span>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          id="modal-new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs text-slate-800 placeholder-slate-400 transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition duration-150 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1.5" htmlFor="modal-confirm-new-password">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Lock className="h-4 w-4" />
                        </span>
                        <input
                          type="password"
                          id="modal-confirm-new-password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs text-slate-800 placeholder-slate-400 transition"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {!['forgot', 'otp', 'reset-password'].includes(mode) && (
                <motion.div
                  key="auth-forms"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                      <div>
                        <label className="block text-slate-600 text-xs font-semibold mb-1.5" htmlFor="modal-name">
                          Full Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <User className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            id="modal-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs text-slate-800 placeholder-slate-400 transition"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1.5" htmlFor="modal-email">
                        Email Address
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Mail className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          id="modal-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs text-slate-800 placeholder-slate-400 transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-slate-600 text-xs font-semibold" htmlFor="modal-password">
                          Password
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => { setMode('forgot'); setError(''); }}
                            className="text-[11px] text-rose-500 hover:text-rose-600 font-medium hover:underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Lock className="h-4 w-4" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="modal-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs text-slate-800 placeholder-slate-400 transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition duration-150 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div>
                        <label className="block text-slate-600 text-xs font-semibold mb-1.5" htmlFor="modal-confirm-password">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <Lock className="h-4 w-4" />
                          </span>
                          <input
                            type="password"
                            id="modal-confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs text-slate-800 placeholder-slate-400 transition"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Remember me checkbox (only on sign in) */}
                    {mode === 'login' && (
                      <div className="flex items-center pt-1">
                        <label className="flex items-center space-x-2 text-slate-600 text-xs cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-rose-500 focus:ring-rose-500/40 focus:ring-offset-0 focus:ring-2 cursor-pointer"
                          />
                          <span>Remember me</span>
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 animate-glow"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {clientId && mode === 'login' && (
                    <>
                      <div className="relative my-4 flex items-center justify-center">
                        <div className="border-t border-slate-100 w-full"></div>
                        <span className="absolute bg-white px-3 text-[10px] text-slate-400 uppercase tracking-wider">Or continue with</span>
                      </div>

                      {isNative ? (
                        <button
                          type="button"
                          onClick={handleNativeGoogleSignIn}
                          disabled={loading}
                          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2 text-xs font-semibold text-slate-700 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Sign in with Google</span>
                        </button>
                      ) : (
                        <div className="flex justify-center">
                          <div id="modal-google-signin-btn" className="w-full flex justify-center min-h-[40px]"></div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="mt-6 text-center border-t border-slate-100 pt-4">
                    <span className="text-slate-400 text-[11px]">
                      {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError('');
                      }}
                      className="text-rose-500 hover:text-rose-600 text-[11px] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      {mode === 'login' ? 'Create an Account' : 'Sign In'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
