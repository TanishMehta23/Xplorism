import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ChevronLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // New States
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'otp' | 'reset-password'
  
  // OTP states
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpType, setOtpType] = useState('login'); // 'login' | 'register' | 'forgot'
  const [pendingEmail, setPendingEmail] = useState('');
  
  // Forgot password & reset password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Handle remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || view !== 'login') {
      return undefined;
    }

    let cancelled = false;
    let retryTimer;

    const renderGoogleButton = () => {
      const googleApi = window.google?.accounts?.id;
      const googleBtn = document.getElementById('google-signin-btn');

      if (!googleApi || !googleBtn) {
        return false;
      }

      googleBtn.innerHTML = '';
      googleApi.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });
      googleApi.renderButton(googleBtn, {
        theme: 'filled_black',
        size: 'large',
        width: '382',
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
  }, [loginWithGoogle, clientId, view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      
      // Store email if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (data && data.requiresOtp) {
        setPendingEmail(email);
        setOtpType('login');
        setView('otp');
        setOtp('');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
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
          setView('reset-password');
        } else {
          setError('Failed to verify OTP');
        }
      } else {
        await verifyOtp(pendingEmail, otp);
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
        setView('otp');
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
      setView('login');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please request a new code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#040d12] bg-grid-pattern text-slate-100 flex items-center justify-center p-6 overflow-hidden">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-600/10 blur-[130px] animate-blob" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-600/10 blur-[130px] animate-blob animation-delay-2000" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 80 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 text-3xl font-extrabold tracking-tight">
            <img 
              src="/logo.png" 
              alt="Xplorism Logo" 
              className="h-10 w-10 object-contain rounded-full shadow-sm" 
            />
            <span className="text-white font-extrabold tracking-tight">
              Xplorism
            </span>
          </Link>
          <p className="text-slate-400 mt-2 text-sm">
            {view === 'login' && 'Welcome back! Log in to access your trips'}
            {view === 'forgot' && 'Reset your account password'}
            {view === 'otp' && 'Verify your security OTP'}
            {view === 'reset-password' && 'Enter a secure new password'}
          </p>
        </div>

        {/* Card Form container */}
        <div className="glass p-8 rounded-3xl shadow-2xl relative border border-slate-800/40 hover:border-slate-700/30 transition-all duration-300">
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-3 text-red-300 text-sm"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {resetSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-sm"
                  >
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{resetSuccess}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-teal-400 transition-colors">
                        <Mail className="h-5 w-5" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-slate-300 text-sm font-semibold" htmlFor="password">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setView('forgot');
                          setError('');
                          setResetSuccess('');
                        }}
                        className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-teal-400 transition-colors">
                        <Lock className="h-5 w-5" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-12 py-3 rounded-xl glass-input text-sm focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2.5 text-slate-300 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900/60 text-teal-500 focus:ring-teal-500/40 focus:ring-offset-0 focus:ring-2 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-semibold text-sm transition-all duration-300 shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                {clientId && (
                  <>
                    <div className="relative my-6 flex items-center justify-center">
                      <div className="border-t border-slate-800/65 w-full"></div>
                      <span className="absolute bg-[#0b1513] px-3 text-xs text-slate-500 uppercase tracking-wider">Or continue with</span>
                    </div>

                    <div className="flex justify-center">
                      <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]"></div>
                    </div>
                  </>
                )}

                <div className="mt-8 text-center border-t border-slate-800/60 pt-6">
                  <span className="text-slate-400 text-xs">Don't have an account? </span>
                  <Link to="/register" className="text-teal-400 hover:text-teal-300 text-xs font-semibold hover:underline">
                    Create an Account
                  </Link>
                </div>
              </motion.div>
            )}

            {view === 'forgot' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Login</span>
                </button>

                <h3 className="text-lg font-bold text-white mb-2">Forgot Password?</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Enter your email address and we'll send you a 6-digit OTP code to reset your password.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-3 text-red-300 text-sm"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="resetEmail">
                      Email Address
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-teal-400 transition-colors">
                        <Mail className="h-5 w-5" />
                      </span>
                      <input
                        type="email"
                        id="resetEmail"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-semibold text-sm transition-all duration-300 shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Verification OTP</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {view === 'otp' && (
              <motion.div
                key="otp-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setView(otpType === 'forgot' ? 'forgot' : 'login');
                    setError('');
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>

                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-teal-500/10 rounded-xl">
                    <ShieldCheck className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Enter OTP Code</h3>
                    <p className="text-[11px] text-teal-400 font-medium">OTP sent to {pendingEmail}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-6">
                  Please enter the 6-digit verification code sent to your email to confirm your identity. Check your email inbox or server logs.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-3 text-red-300 text-sm"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="otpCode">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="otpCode"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full text-center tracking-[12px] font-mono text-2xl py-3 rounded-xl glass-input focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                      maxLength={6}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-semibold text-sm transition-all duration-300 shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {view === 'reset-password' && (
              <motion.div
                key="reset-password-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Set a secure new password for your account.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-3 text-red-300 text-sm"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="newPassword">
                      New Password
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-teal-400 transition-colors">
                        <Lock className="h-5 w-5" />
                      </span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-12 py-3 rounded-xl glass-input text-sm focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="confirmNewPassword">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-teal-400 transition-colors">
                        <Lock className="h-5 w-5" />
                      </span>
                      <input
                        type="password"
                        id="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-semibold text-sm transition-all duration-300 shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
