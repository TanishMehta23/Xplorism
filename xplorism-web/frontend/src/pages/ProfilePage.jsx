import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, Compass, Edit2, Key, CheckCircle, 
  AlertCircle, LogOut, Loader2, Heart, DollarSign, ArrowLeft, ShieldCheck,
  ChevronDown, Trash2, Plus, Users, FileText, Globe, Activity
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
  
  // Real Profile & Travel History States
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [travelHistory, setTravelHistory] = useState([]);
  const [showLogPastModal, setShowLogPastModal] = useState(false);
  const [newPastTrip, setNewPastTrip] = useState({ destination: '', dates: '', notes: '' });

  // Additional settings and feature states
  const [coTravelers, setCoTravelers] = useState([]);
  const [emergencyContact, setEmergencyContact] = useState({ name: '', relation: '', phone: '', bloodGroup: '' });
  const [localeSettings, setLocaleSettings] = useState({ timezone: 'GMT+5:30', dateFormat: 'DD/MM/YYYY', tempUnit: 'C' });
  const [hoveredPastTripId, setHoveredPastTripId] = useState(null);

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
        
        if (data.user.profile_photo) {
          setProfilePhoto(data.user.profile_photo);
        }
        if (data.user.preferences) {
          setPreferences({
            travelStyle: data.user.preferences.travelStyle || 'Balanced',
            notifications: data.user.preferences.notifications !== false,
            currency: data.user.preferences.currency || 'USD',
            newsletter: !!data.user.preferences.newsletter
          });
          if (data.user.preferences.favoriteThemes) {
            setSelectedThemes(data.user.preferences.favoriteThemes);
          }
          if (data.user.preferences.coTravelers) {
            setCoTravelers(data.user.preferences.coTravelers);
          }
          if (data.user.preferences.emergencyContact) {
            setEmergencyContact(data.user.preferences.emergencyContact);
          }
          if (data.user.preferences.localeSettings) {
            setLocaleSettings(data.user.preferences.localeSettings);
          }
        }
        if (data.user.travel_history) {
          setTravelHistory(data.user.travel_history);
        }
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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setAccountError('Photo must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = async () => {
        // Create a canvas to compress the image
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress image to JPEG at 0.7 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setProfilePhoto(compressedBase64);

        try {
          setUpdating(true);
          const data = await api.put('/auth/profile', {
            name,
            email,
            profilePhoto: compressedBase64
          });
          setAccountSuccess('Profile photo updated successfully!');
        } catch (err) {
          console.error(err);
          setAccountError('Failed to upload profile photo.');
        } finally {
          setUpdating(false);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePreferences = async (updatedPreferences = {}) => {
    setPrefError('');
    setPrefSuccess('');
    try {
      const data = await api.put('/auth/profile', {
        name,
        email,
        preferences: {
          ...preferences,
          favoriteThemes: selectedThemes,
          coTravelers,
          emergencyContact,
          localeSettings,
          ...updatedPreferences
        }
      });
      setProfile(prev => ({ ...prev, preferences: data.user.preferences }));
      setPrefSuccess('Preferences saved successfully!');
    } catch (err) {
      console.error(err);
      setPrefError('Failed to save preferences.');
    }
  };

  const handleAddPastTrip = async (e) => {
    e.preventDefault();
    if (!newPastTrip.destination || !newPastTrip.dates) {
      alert('Please fill in destination and dates.');
      return;
    }
    const updatedHistory = [
      ...travelHistory,
      {
        id: Date.now().toString(),
        destination: newPastTrip.destination,
        dates: newPastTrip.dates,
        notes: newPastTrip.notes
      }
    ];
    setTravelHistory(updatedHistory);
    try {
      await api.put('/auth/profile', {
        name,
        email,
        travelHistory: updatedHistory
      });
      setNewPastTrip({ destination: '', dates: '', notes: '' });
      setShowLogPastModal(false);
      setAccountSuccess('Travel history updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to save travel history.');
    }
  };

  const [showAddCompanionModal, setShowAddCompanionModal] = useState(false);
  const [newCompanion, setNewCompanion] = useState({ name: '', relation: 'Friend', email: '' });

  const handleAddCompanion = async (e) => {
    e.preventDefault();
    if (!newCompanion.name || !newCompanion.email) {
      alert('Please fill in name and email.');
      return;
    }
    const updated = [
      ...coTravelers,
      {
        id: Date.now().toString(),
        name: newCompanion.name,
        relation: newCompanion.relation,
        email: newCompanion.email
      }
    ];
    setCoTravelers(updated);
    await handleSavePreferences({ coTravelers: updated });
    setNewCompanion({ name: '', relation: 'Friend', email: '' });
    setShowAddCompanionModal(false);
  };

  const handleRemoveCompanion = async (id) => {
    if (!window.confirm('Remove this co-traveler?')) return;
    const updated = coTravelers.filter(c => c.id !== id);
    setCoTravelers(updated);
    await handleSavePreferences({ coTravelers: updated });
  };

  const handleSaveEmergencyContact = async (e) => {
    e.preventDefault();
    await handleSavePreferences({ emergencyContact });
  };

  const handleRemovePastTrip = async (id) => {
    if (!window.confirm('Remove this past trip from history?')) return;
    const updatedHistory = travelHistory.filter(t => t.id !== id);
    setTravelHistory(updatedHistory);
    try {
      await api.put('/auth/profile', {
        name,
        email,
        travelHistory: updatedHistory
      });
      setAccountSuccess('Past trip removed from history.');
    } catch (err) {
      console.error(err);
    }
  };

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
            <div className="relative mx-auto w-24 h-24 mb-4 mt-2">
              <div className="w-full h-full rounded-full flex items-center justify-center text-3xl font-extrabold shadow-inner select-none border-4 group overflow-hidden"
                   style={{ 
                     backgroundColor: 'var(--bg-tertiary)', 
                     color: 'var(--text-primary)', 
                     borderColor: 'var(--border-secondary)'
                   }}>
                {profilePhoto && profilePhoto !== "" ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{name ? name.charAt(0).toUpperCase() : 'T'}</span>
                )}
                
                {/* Upload Overlay (Hover) */}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200">
                  <Edit2 className="h-4 w-4 text-white" />
                  <span className="text-[8px] text-white font-bold mt-1 uppercase tracking-wider">Change</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>

              {/* Floating Edit Icon Badge (Visible on Mobile) */}
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-transform hover:scale-110 active:scale-95">
                <Edit2 className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
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

                {/* Locale & Settings */}
                <div className="space-y-4 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wide flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span>Locale & Display Settings</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Timezone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Timezone</label>
                      <select
                        value={localeSettings.timezone}
                        onChange={(e) => setLocaleSettings({ ...localeSettings, timezone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-all duration-200"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <option value="GMT-8:00">PST (GMT-8)</option>
                        <option value="GMT+0:00">UTC (GMT+0)</option>
                        <option value="GMT+1:00">CET (GMT+1)</option>
                        <option value="GMT+5:30">IST (GMT+5:30)</option>
                        <option value="GMT+9:00">JST (GMT+9)</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Date Format</label>
                      <select
                        value={localeSettings.dateFormat}
                        onChange={(e) => setLocaleSettings({ ...localeSettings, dateFormat: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-all duration-200"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  {/* Temp Unit */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <h5 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>Temperature Unit</h5>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Preferred temperature scale</p>
                    </div>
                    <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl">
                      {['C', 'F'].map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setLocaleSettings({ ...localeSettings, tempUnit: unit })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition select-none cursor-pointer ${
                            localeSettings.tempUnit === unit
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'text-slate-555 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
                          }`}
                        >
                          °{unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

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

                <div className="flex justify-between pt-4 mt-auto gap-3">
                  <button
                    onClick={() => navigate('/preferences')}
                    className="flex-1 px-4 py-3 rounded-full font-semibold text-xs uppercase tracking-wider transition cursor-pointer border"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-secondary)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                  >
                    {t('manage_preferences') || 'Manage All Preferences'}
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 px-6 py-3 rounded-full text-white font-semibold text-xs uppercase tracking-wider transition cursor-pointer flex items-center active:scale-95 shadow-md"
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

      {/* TRAVEL MAP & HISTORY SECTION */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* Interactive World Map */}
          <div className="rounded-3xl border shadow-md p-6 md:p-8 flex flex-col justify-between"
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div>
              <h3 className="text-xl font-black flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                <Globe className="h-5 w-5 text-blue-500" />
                <span>Interactive Travel Map</span>
              </h3>
              <p className="text-xs mb-6" style={{ color: 'var(--text-tertiary)' }}>Visual route map connecting your trips to your home base.</p>
            </div>

            <div className="relative flex-1 flex items-center justify-center min-h-[300px]">
              {(() => {
                const CITY_COORDINATES = {
                  'new delhi': { x: 650, y: 245, label: 'New Delhi' },
                  'delhi': { x: 650, y: 245, label: 'New Delhi' },
                  'dharamshala': { x: 645, y: 230, label: 'Dharamshala' },
                  'kyoto': { x: 780, y: 220, label: 'Kyoto' },
                  'tokyo': { x: 790, y: 215, label: 'Tokyo' },
                  'paris': { x: 480, y: 170, label: 'Paris' },
                  'london': { x: 465, y: 155, label: 'London' },
                  'sydney': { x: 880, y: 410, label: 'Sydney' },
                  'new york': { x: 270, y: 190, label: 'New York' },
                  'san francisco': { x: 180, y: 195, label: 'San Francisco' },
                  'rome': { x: 505, y: 190, label: 'Rome' },
                  'cairo': { x: 550, y: 240, label: 'Cairo' },
                  'cape town': { x: 540, y: 395, label: 'Cape Town' },
                  'rio de janeiro': { x: 380, y: 350, label: 'Rio de Janeiro' },
                  'dubai': { x: 600, y: 240, label: 'Dubai' },
                  'singapore': { x: 710, y: 295, label: 'Singapore' },
                  'bangkok': { x: 690, y: 275, label: 'Bangkok' },
                  'toronto': { x: 260, y: 175, label: 'Toronto' }
                };

                const getCityCoords = (destination) => {
                  const clean = destination.toLowerCase().trim();
                  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
                    if (clean.includes(key)) return coords;
                  }
                  let hash = 0;
                  for (let i = 0; i < destination.length; i++) {
                    hash = destination.charCodeAt(i) + ((hash << 5) - hash);
                  }
                  const x = 200 + (Math.abs(hash) % 600);
                  const y = 100 + (Math.abs(hash >> 2) % 280);
                  return { x, y, label: destination };
                };

                return (
                  <svg viewBox="0 0 1000 500" className="w-full h-auto bg-slate-955 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Continent regions */}
                    <circle cx="230" cy="180" r="110" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <circle cx="360" cy="350" r="90" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <circle cx="490" cy="160" r="60" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <circle cx="530" cy="290" r="85" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <circle cx="680" cy="220" r="120" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <circle cx="850" cy="380" r="70" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />

                    {/* Home Pin (New Delhi) */}
                    <g>
                      <circle cx="650" cy="245" r="8" className="fill-rose-500/30 animate-ping" />
                      <circle cx="650" cy="245" r="5" className="fill-rose-500" />
                      <text x="650" y="232" className="fill-rose-400 text-[10px] font-bold text-center" textAnchor="middle">Home</text>
                    </g>

                    {/* Trip Pins & Arcs */}
                    {travelHistory.map((trip) => {
                      const coords = getCityCoords(trip.destination);
                      const homeX = 650;
                      const homeY = 245;
                      const isHovered = hoveredPastTripId === trip.id;
                      
                      if (coords.x === homeX && coords.y === homeY) return null;

                      return (
                        <g key={trip.id}>
                          <path
                            d={`M ${homeX} ${homeY} Q ${(homeX + coords.x)/2} ${Math.min(homeY, coords.y) - 60} ${coords.x} ${coords.y}`}
                            fill="none"
                            stroke={isHovered ? '#fb7185' : '#3b82f6'}
                            strokeWidth={isHovered ? 2.5 : 1}
                            strokeDasharray="4 4"
                            className="transition-all duration-300 opacity-60"
                          />
                          <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={isHovered ? 12 : 6}
                            className={`transition-all duration-300 cursor-pointer fill-rose-500/20`}
                          />
                          <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={isHovered ? 7 : 4}
                            className={`transition-all duration-300 cursor-pointer ${isHovered ? 'fill-rose-400' : 'fill-blue-400'}`}
                            onMouseEnter={() => setHoveredPastTripId(trip.id)}
                            onMouseLeave={() => setHoveredPastTripId(null)}
                          />
                          {isHovered && (
                            <g>
                              <rect x={coords.x - 50} y={coords.y - 32} width="100" height="20" rx="6" className="fill-slate-900 stroke-slate-800" strokeWidth="1" />
                              <text x={coords.x} y={coords.y - 18} className="fill-white text-[9px] font-bold" textAnchor="middle">{coords.label}</text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>

          {/* Travel History Logs listing */}
          <div className="rounded-3xl border shadow-md p-6 md:p-8 flex flex-col justify-between"
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <span>Travel Logs & History</span>
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Keep track of your past adventures and destinations.</p>
                </div>
                <button
                  onClick={() => setShowLogPastModal(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer hover:bg-indigo-700 active:scale-95 shadow-md shrink-0"
                  style={{ backgroundColor: '#4f46e5' }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Trip</span>
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {travelHistory.length === 0 ? (
                  <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-8 text-center dark:bg-indigo-950/10 dark:border-indigo-900/30">
                    <Compass className="h-8 w-8 text-indigo-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No past trips logged yet</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Add a past trip to map your adventures.</p>
                  </div>
                ) : (
                  travelHistory.map((trip) => {
                    const isHovered = hoveredPastTripId === trip.id;
                    return (
                      <div
                        key={trip.id}
                        onMouseEnter={() => setHoveredPastTripId(trip.id)}
                        onMouseLeave={() => setHoveredPastTripId(null)}
                        className={`rounded-2xl border p-4 relative transition-all duration-200 group flex flex-col justify-between ${
                          isHovered 
                            ? 'border-rose-450 bg-rose-50/10 shadow-md' 
                            : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 pr-6">
                          <h4 className="text-sm font-bold truncate pr-6" style={{ color: 'var(--text-primary)' }}>{trip.destination}</h4>
                          <button
                            onClick={() => handleRemovePastTrip(trip.id)}
                            className="p-1 rounded-full hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0 absolute top-4 right-4"
                            title="Remove past trip"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-1 text-[9px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded-full w-fit mb-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{trip.dates}</span>
                        </div>
                        {trip.notes && (
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{trip.notes}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CO-TRAVELERS & EMERGENCY GRID */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* Co-Travelers & Family Section */}
          <div className="rounded-3xl border shadow-md p-6 md:p-8"
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                  <Users className="h-5 w-5 text-teal-500" />
                  <span>Co-Travelers & Companions</span>
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Manage travel partners you frequently plan itineraries with.</p>
              </div>
              <button
                onClick={() => setShowAddCompanionModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer hover:bg-teal-700 active:scale-95 shadow-md shrink-0"
                style={{ backgroundColor: '#0d9488' }}
              >
                <Plus className="h-4 w-4" />
                <span>Add Companion</span>
              </button>
            </div>

            {coTravelers.length === 0 ? (
              <div className="bg-teal-50/50 border border-teal-100/50 rounded-2xl p-8 text-center dark:bg-teal-950/10 dark:border-teal-900/30">
                <Users className="h-8 w-8 text-teal-300 mx-auto mb-3" />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No companions added yet</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Add family or friends to sync itineraries together.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                {coTravelers.map((traveler) => (
                  <div key={traveler.id} className="rounded-2xl border p-4 relative flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-900/40"
                       style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="h-10 w-10 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center font-extrabold text-sm uppercase">
                      {traveler.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{traveler.name}</h4>
                      <p className="text-[10px] font-bold text-teal-600">{traveler.relation}</p>
                      <p className="text-[9px] truncate" style={{ color: 'var(--text-tertiary)' }}>{traveler.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCompanion(traveler.id)}
                      className="p-1 rounded-full hover:bg-rose-500/10 text-slate-450 hover:text-rose-500 transition cursor-pointer absolute top-4 right-4"
                      title="Remove companion"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Info & Documents Vault Section */}
          <div className="rounded-3xl border shadow-md p-6 md:p-8 flex flex-col justify-between"
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div>
              <h3 className="text-xl font-black flex items-center space-x-2 mb-1" style={{ color: 'var(--text-primary)' }}>
                <Activity className="h-5 w-5 text-rose-500" />
                <span>Emergency Profile & Documents</span>
              </h3>
              <p className="text-xs mb-6" style={{ color: 'var(--text-tertiary)' }}>Keep emergency contact info and documents accessible.</p>

              <form onSubmit={handleSaveEmergencyContact} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Contact Name</label>
                      <input
                        type="text"
                        value={emergencyContact.name}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Relationship</label>
                      <input
                        type="text"
                        value={emergencyContact.relation}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                        placeholder="Spouse / Parent"
                        className="w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Phone Number</label>
                      <input
                        type="text"
                        value={emergencyContact.phone}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                        placeholder="+91 9999999999"
                        className="w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Blood Group</label>
                      <select
                        value={emergencyContact.bloodGroup}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, bloodGroup: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <option value="">Select Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition hover:bg-rose-700 active:scale-95 shadow-md cursor-pointer"
                    style={{ backgroundColor: '#e11d48' }}
                  >
                    Save Contact Info
                  </button>
                </div>
              </form>

              {/* Vault Documents quick access panel */}
              <div className="pt-6 border-t mt-6" style={{ borderColor: 'var(--border-secondary)' }}>
                <h4 className="text-xs font-extrabold uppercase tracking-wide flex items-center space-x-1.5 mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <FileText className="h-4 w-4 text-rose-500" />
                  <span>Linked Vault Documents</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <a href="/vault" className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 hover:bg-rose-500/10 border border-slate-200/40 dark:border-slate-800 transition">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>Passport Scan</span>
                  </a>
                  <a href="/vault" className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 hover:bg-rose-500/10 border border-slate-200/40 dark:border-slate-800 transition">
                    <FileText className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>Travel Insurance</span>
                  </a>
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

      {/* Log Past Trip Modal */}
      {showLogPastModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
          <div className="rounded-3xl border p-6 max-w-md w-full shadow-2xl relative" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            
            <div className="flex items-center space-x-3 mb-4 text-indigo-500">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Compass className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Log a Past Trip</h3>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Add a memory to your profile history</p>
              </div>
            </div>

            <form onSubmit={handleAddPastTrip} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Kyoto, Japan"
                  value={newPastTrip.destination}
                  onChange={(e) => setNewPastTrip({ ...newPastTrip, destination: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>Dates / Season</label>
                <input
                  type="text"
                  placeholder="e.g. October 2024 / Spring 2025"
                  value={newPastTrip.dates}
                  onChange={(e) => setNewPastTrip({ ...newPastTrip, dates: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>Memories & Notes</label>
                <textarea
                  placeholder="What was the highlight? Best food, sights, etc."
                  value={newPastTrip.notes}
                  onChange={(e) => setNewPastTrip({ ...newPastTrip, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <button
                  type="button"
                  onClick={() => setShowLogPastModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1.5"
                  style={{ backgroundColor: '#4f46e5' }}
                >
                  <span>Save Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Companion Modal */}
      {showAddCompanionModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
          <div className="rounded-3xl border p-6 max-w-md w-full shadow-2xl relative" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            
            <div className="flex items-center space-x-3 mb-4 text-teal-500">
              <div className="p-2 bg-teal-500/10 rounded-xl">
                <Users className="h-6 w-6 text-teal-500" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Add a Co-Traveler</h3>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Save partner details for group planning</p>
              </div>
            </div>

            <form onSubmit={handleAddCompanion} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newCompanion.name}
                  onChange={(e) => setNewCompanion({ ...newCompanion, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>Relationship</label>
                <select
                  value={newCompanion.relation}
                  onChange={(e) => setNewCompanion({ ...newCompanion, relation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <option value="Friend">Friend</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Family">Family Member</option>
                  <option value="Colleague">Colleague</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={newCompanion.email}
                  onChange={(e) => setNewCompanion({ ...newCompanion, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCompanionModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1.5"
                  style={{ backgroundColor: '#0d9488' }}
                >
                  <span>Add Companion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
