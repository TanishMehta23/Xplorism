import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Reset fields when mode changes or modal opens/closes
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [initialMode, isOpen]);

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
        await login(email, password);
        onClose();
        navigate('/dashboard');
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
        await register(name, email, password);
        onClose();
        navigate('/dashboard');
      } catch (err) {
        setError(err.message || 'Registration failed. Try a different email.');
      } finally {
        setLoading(false);
      }
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
          className="bg-white text-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden border border-slate-100 font-sans"
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
                {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create an account to start exploring.'}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition duration-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sliding Tabs */}
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
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
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
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1.5" htmlFor="modal-password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    id="modal-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                    required
                  />
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
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
