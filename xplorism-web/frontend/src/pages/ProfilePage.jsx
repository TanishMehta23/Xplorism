import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, Compass, Edit2, Key, CheckCircle, 
  AlertCircle, LogOut, Loader2, Heart, DollarSign, ArrowLeft, ShieldCheck,
  ChevronDown
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // State
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ tripsCount: 0, totalBudget: 0, favoritesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpError, setOtpError] = useState('');

  // Account Card Feedback Messages
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Preferences Card Feedback Messages
  const [prefError, setPrefError] = useState('');
  const [prefSuccess, setPrefSuccess] = useState('');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  // Preference State (Mock details for rich aesthetics)
  const [preferences, setPreferences] = useState({
    travelStyle: 'Balanced',
    notifications: true,
    currency: 'USD',
    newsletter: false
  });

  const [selectedThemes, setSelectedThemes] = useState(['Adventure', 'Food', 'Nature']);

  // Fetch Profile & Stats from Backend
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const data = await api.get('/auth/profile');
        setProfile(data.user);
        setStats(data.stats);
        setName(data.user.name);
        setEmail(data.user.email);
      } catch (err) {
        console.error('Failed to load profile details:', err);
        setAccountError('Could not fetch profile information.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.style-select-container')) {
        setIsStyleOpen(false);
      }
      if (!e.target.closest('.currency-select-container')) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setAccountError('');
    setAccountSuccess('');

    if (!name.trim() || !email.trim()) {
      setAccountError('Name and email are required.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setAccountError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setAccountError('Passwords do not match.');
        return;
      }
    }

    try {
      setUpdating(true);
      const data = await api.put('/auth/profile', {
        name,
        email,
        ...(password && { password })
      });

      // If OTP verification is required for password change
      if (data && data.requiresOtp) {
        setOtpEmail(data.email);
        setOtpCode('');
        setOtpError('');
        setShowOtpModal(true);
        return;
      }

      // Update auth context state and localStorage (if changed immediately without OTP)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setProfile(prev => ({ ...prev, name: data.user.name, email: data.user.email }));
      setAccountSuccess('Profile updated successfully!');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error(err);
      setAccountError(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a 6-digit OTP code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const data = await api.post('/auth/verify-otp', {
        email: otpEmail,
        otp: otpCode
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setProfile(prev => ({ ...prev, name: data.user.name, email: data.user.email }));
      setAccountSuccess('Profile and password updated successfully!');
      setShowOtpModal(false);
      setPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      setOtpError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const memberSinceDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Navbar activeTab="profile" />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar activeTab="profile" />

      {/* Main Container expanded to max-w-7xl for more spacious spacing */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>{t('profile_title')}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('profile_desc')}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all select-none self-start md:self-auto cursor-pointer"
            style={{ 
              borderColor: 'var(--border-primary)', 
              backgroundColor: 'var(--bg-secondary)', 
              color: 'var(--text-primary)' 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('back_to_dashboard')}</span>
          </button>
        </div>

        {/* Outer grid spanning full width: 3 columns layout on desktop to fill empty space */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
          
          {/* COLUMN 1: User Card & statistics */}
          <div className="space-y-6 w-full">
            
            {/* User Main Card */}
            <div className="rounded-3xl border p-6 text-center shadow-md relative overflow-hidden w-full" 
                 style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              
              {/* Premium Gradient Top Background Decoration */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500" />

              {/* Avatar circle */}
              <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold shadow-inner mb-4 mt-2 select-none border-4"
                   style={{ 
                     backgroundColor: 'var(--bg-tertiary)', 
                     color: 'var(--text-primary)', 
                     borderColor: 'var(--border-secondary)' 
                   }}>
                {name ? name.charAt(0).toUpperCase() : 'T'}
              </div>

              <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{name}</h2>
              <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-tertiary)' }}>{email}</p>
              
              <div className="flex items-center justify-center space-x-1.5 mt-4 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span>{t('joined')} {memberSinceDate}</span>
              </div>

              {profile?.google_id && (
                <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {t('google_account_linked')}
                </span>
              )}

              {/* Log Out option here as requested */}
              <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-2.5 rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold cursor-pointer transition border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('log_out_session')}</span>
                </button>
              </div>

            </div>

            {/* Travel Stats Widget */}
            <div className="rounded-3xl border p-6 shadow-md w-full"
                 style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              
              <h3 className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>{t('travel_stats')}</h3>
              
              <div className="space-y-4">
                {/* Trips */}
                <div className="flex items-center justify-between p-3 rounded-2xl transition hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('trips_planned')}</h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('total_itineraries')}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{stats.tripsCount}</span>
                </div>

                {/* Favorites */}
                <div className="flex items-center justify-between p-3 rounded-2xl transition hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('favorites')}</h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('saved_locations')}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{stats.favoritesCount}</span>
                </div>

                {/* Budget */}
                <div className="flex items-center justify-between p-3 rounded-2xl transition hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('total_estimated_budget')}</h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('total_spent')}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                    ${stats.totalBudget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* COLUMN 2: Account Details Settings Form */}
          <div className="w-full">
            
            <div className="rounded-3xl border shadow-md p-6 md:p-8 w-full h-full flex flex-col"
                 style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              
              {/* Error Banner */}
              {accountError && (
                <div className="flex items-center space-x-2 p-4 mb-6 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{accountError}</span>
                </div>
              )}

              {/* Success Banner */}
              {accountSuccess && (
                <div className="flex items-center space-x-2 p-4 mb-6 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{accountSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4 flex-1">
                <h3 className="text-base font-black mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                  <Edit2 className="h-4 w-4 text-blue-500" />
                  <span>{t('account_details')}</span>
                </h3>

                {/* Name Input - Safe inline paddings to prevent overlapping */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{t('full_name')}</label>
                  <div className="relative" style={{ position: 'relative' }}>
                    <User 
                      style={{ 
                        position: 'absolute', 
                        left: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--text-tertiary)',
                        width: '16px',
                        height: '16px',
                        zIndex: 10
                      }} 
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tanish"
                      className="w-full py-2.5 rounded-2xl border text-sm font-semibold transition focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      style={{ 
                        borderColor: 'var(--border-primary)', 
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-tertiary)',
                        paddingLeft: '42px',
                        paddingRight: '16px'
                      }}
                    />
                  </div>
                </div>

                {/* Email Input - Safe inline paddings to prevent overlapping */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{t('email_address')}</label>
                  <div className="relative" style={{ position: 'relative' }}>
                    <Mail 
                      style={{ 
                        position: 'absolute', 
                        left: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--text-tertiary)',
                        width: '16px',
                        height: '16px',
                        zIndex: 10
                      }} 
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tanish@example.com"
                      className="w-full py-2.5 rounded-2xl border text-sm font-semibold transition focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      style={{ 
                        borderColor: 'var(--border-primary)', 
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-tertiary)',
                        paddingLeft: '42px',
                        paddingRight: '16px'
                      }}
                    />
                  </div>
                </div>

                {/* Password Fields */}
                <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wide mb-2 flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Key className="h-3.5 w-3.5 text-blue-500" />
                    <span>{t('change_password_label')}</span>
                  </h4>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('new_password_label')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold transition focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      style={{ 
                        borderColor: 'var(--border-primary)', 
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-tertiary)'
                      }}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('confirm_new_password_label')}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold transition focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      style={{ 
                        borderColor: 'var(--border-primary)', 
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-tertiary)'
                      }}
                    />
                  </div>
                </div>

                {/* Account Security Checklist (Fills empty vertical space beautifully) */}
                <div className="pt-6 border-t space-y-3" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wide flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" style={{ width: '14px', height: '14px' }} />
                    <span>{t('security_checklist')}</span>
                  </h4>
                  
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" style={{ width: '16px', height: '16px' }} />
                      <span>Verified Email Address</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" style={{ width: '16px', height: '16px' }} />
                      <span>Secure Password Configured</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" style={{ width: '16px', height: '16px' }} />
                      <span>OAuth Provider: {profile?.google_id ? 'Google OAuth' : 'Standard Email'}</span>
                    </div>
                  </div>
                </div>

                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 mt-auto">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-3 rounded-full text-white font-semibold text-xs uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 active:scale-95 shadow-md disabled:opacity-50"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>{t('save_changes')}</span>
                    )}
                  </button>
                </div>

              </form>

            </div>

          </div>

          {/* COLUMN 3: Travel Preferences Card */}
          <div className="w-full">
            
            <div className="rounded-3xl border shadow-md p-6 md:p-8 w-full h-full flex flex-col"
                 style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              
              <div className="space-y-6 flex-1 flex flex-col justify-between w-full">
                <div className="space-y-6 flex-1 w-full">
                <h3 className="text-base font-black mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                  <Compass className="h-4 w-4 text-blue-500" />
                  <span>{t('travel_preferences_title')}</span>
                </h3>

                {/* Error Banner */}
                {prefError && (
                  <div className="flex items-center space-x-2 p-4 mb-6 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{prefError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {prefSuccess && (
                  <div className="flex items-center space-x-2 p-4 mb-6 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>{prefSuccess}</span>
                  </div>
                )}

                {/* Travel Style Selector */}
                {(() => {
                  const stylesList = [
                    { value: 'Adventure', label: t('style_adventure') },
                    { value: 'Leisure', label: t('style_leisure') },
                    { value: 'Balanced', label: t('style_balanced') },
                    { value: 'Budget', label: t('style_budget') },
                    { value: 'Culinary', label: t('style_culinary') }
                  ];
                  const activeStyle = stylesList.find(s => s.value === preferences.travelStyle) || stylesList[2];

                  return (
                    <div className="space-y-2 relative style-select-container">
                      <label className="text-xs font-extrabold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>{t('preferred_style')}</label>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setIsStyleOpen(!isStyleOpen);
                          setIsCurrencyOpen(false);
                        }}
                        className="w-full py-2.5 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-between cursor-pointer focus:outline-none transition-all duration-200"
                        style={{ 
                          borderColor: 'var(--border-primary)', 
                          color: 'var(--text-primary)', 
                          backgroundColor: 'var(--bg-tertiary)' 
                        }}
                      >
                        <span>{activeStyle.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isStyleOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} />
                      </button>

                      <AnimatePresence>
                        {isStyleOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute left-0 right-0 mt-1 rounded-2xl border shadow-xl overflow-hidden z-[100]"
                            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
                          >
                            {stylesList.map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                  setPreferences({ ...preferences, travelStyle: item.value });
                                  setIsStyleOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center justify-between transition cursor-pointer"
                                style={{ 
                                  color: preferences.travelStyle === item.value ? 'var(--rose-500)' : 'var(--text-secondary)',
                                  backgroundColor: preferences.travelStyle === item.value ? 'rgba(244,63,94,0.08)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  if (preferences.travelStyle !== item.value) {
                                    e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.04)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (preferences.travelStyle !== item.value) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <span>{item.label}</span>
                                {preferences.travelStyle === item.value && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* Currency Preference */}
                {(() => {
                  const currenciesList = [
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                    { value: 'INR', label: 'INR (₹)' }
                  ];
                  const activeCurrency = currenciesList.find(c => c.value === preferences.currency) || currenciesList[0];

                  return (
                    <div className="space-y-2 relative currency-select-container">
                      <label className="text-xs font-extrabold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>{t('preferred_currency')}</label>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setIsCurrencyOpen(!isCurrencyOpen);
                          setIsStyleOpen(false);
                        }}
                        className="w-full py-2.5 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-between cursor-pointer focus:outline-none transition-all duration-200"
                        style={{ 
                          borderColor: 'var(--border-primary)', 
                          color: 'var(--text-primary)', 
                          backgroundColor: 'var(--bg-tertiary)' 
                        }}
                      >
                        <span>{activeCurrency.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} />
                      </button>

                      <AnimatePresence>
                        {isCurrencyOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute left-0 right-0 mt-1 rounded-2xl border shadow-xl overflow-hidden z-[100]"
                            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
                          >
                            {currenciesList.map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                  setPreferences({ ...preferences, currency: item.value });
                                  setIsCurrencyOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center justify-between transition cursor-pointer"
                                style={{ 
                                  color: preferences.currency === item.value ? 'var(--rose-500)' : 'var(--text-secondary)',
                                  backgroundColor: preferences.currency === item.value ? 'rgba(244,63,94,0.08)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  if (preferences.currency !== item.value) {
                                    e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.04)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (preferences.currency !== item.value) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <span>{item.label}</span>
                                {preferences.currency === item.value && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* Toggle Options */}
                <div className="space-y-4 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                  
                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('email_notifications')}</h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('recommendations_desc')}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifications}
                      onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                      className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Newsletter Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <div>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('weekly_digest')}</h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('curated_news_desc')}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.newsletter}
                      onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                      className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                    />
                  </div>

                </div>

                {/* Favorite Travel Themes (Fills empty vertical space) */}
                <div className="pt-6 border-t space-y-3" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wide flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Compass className="h-3.5 w-3.5 text-blue-500" />
                    <span>{t('favorite_themes')}</span>
                  </h4>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Choose themes to personalize your recommendations.</p>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Nature', 'History', 'Food', 'Shopping', 'Nightlife', 'Beaches', 'Adventure'].map((theme) => {
                      const isSelected = selectedThemes.includes(theme);
                      return (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedThemes(selectedThemes.filter(t => t !== theme));
                            } else {
                              setSelectedThemes([...selectedThemes, theme]);
                            }
                          }}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold border transition cursor-pointer select-none active:scale-95"
                          style={{
                            backgroundColor: isSelected ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)',
                            borderColor: isSelected ? '#3b82f6' : 'var(--border-primary)',
                            color: isSelected ? '#3b82f6' : 'var(--text-secondary)'
                          }}
                        >
                          {theme}
                        </button>
                      );
                    })}
                  </div>

                </div>

                <div className="flex justify-end pt-4 mt-auto">
                  <button
                    onClick={() => {
                      setPrefError('');
                      setPrefSuccess('');
                      // Simulate save action
                      setTimeout(() => {
                        setPrefSuccess('Preferences saved successfully!');
                      }, 300);
                    }}
                    className="px-6 py-3 rounded-full text-white font-semibold text-xs uppercase tracking-wider transition cursor-pointer flex items-center active:scale-95 shadow-md"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                  >
                    {t('save_preferences')}
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      </main>

      {/* OTP Verification Modal (For Password Changes) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
          <div className="rounded-3xl border p-6 max-w-sm w-full shadow-2xl relative" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            
            <div className="flex items-center space-x-3 mb-4 text-blue-500">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Security Verification</h3>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>OTP sent to {otpEmail}</p>
              </div>
            </div>

            <p className="text-xs mb-6 leading-relaxed font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
              To save your new password, please enter the 6-digit verification code sent to your email address.
            </p>

            {otpError && (
              <div className="flex items-center space-x-2 p-3 mb-4 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full text-center tracking-[12px] font-mono text-2xl py-3 rounded-2xl border transition focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-primary)', 
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '12px'
                  }}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 font-sans"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 font-sans flex items-center space-x-1.5"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify & Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
          <div className="rounded-3xl border p-6 max-w-sm w-full shadow-xl relative" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <LogOut className="h-5 w-5" />
              <h3 className="text-lg font-bold font-sans" style={{ color: 'var(--text-primary)' }}>Log Out</h3>
            </div>
            <p className="text-sm mb-6 leading-relaxed font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to log out of your session?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 font-sans"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 font-sans"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
