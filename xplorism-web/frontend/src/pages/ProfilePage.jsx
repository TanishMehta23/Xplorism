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
import { useCurrency } from '../contexts/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const { setPreferredCurrency } = useCurrency();
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
  // Unified Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [isDateFormatOpen, setIsDateFormatOpen] = useState(false);
  const [photoStatus, setPhotoStatus] = useState(null); // { type: 'uploading'|'success'|'error', msg: string }

  // Preference State (Mock details for rich aesthetics)
  const [preferences, setPreferences] = useState({
    travelStyle: 'Balanced',
    notifications: true,
    currency: 'DEFAULT',
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
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [newEmergencyContact, setNewEmergencyContact] = useState({ name: '', relation: '', phone: '', bloodGroup: '' });
  const [localeSettings, setLocaleSettings] = useState({ timezone: 'GMT+5:30', dateFormat: 'DD/MM/YYYY', tempUnit: 'C' });
  const [hoveredPastTripId, setHoveredPastTripId] = useState(null);

  // Fetch Profile & Stats from Backend
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [data, tripsData] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/trips').catch(() => []) // Fallback to empty array if trips fetch fails
        ]);

        setProfile(data.user);
        setStats(data.stats);
        setName(data.user.name);
        setEmail(data.user.email);

        // Safely parse JSON if they come back as strings from the database
        if (typeof data.user.preferences === 'string') {
          try { data.user.preferences = JSON.parse(data.user.preferences); } catch (e) { data.user.preferences = {}; }
        }
        if (typeof data.user.travel_history === 'string') {
          try { data.user.travel_history = JSON.parse(data.user.travel_history); } catch (e) { data.user.travel_history = []; }
        }

        const photoUrl = data.user.profile_photo || data.user.profilePhoto;
        if (photoUrl && photoUrl !== 'null' && photoUrl !== 'undefined') {
          setProfilePhoto(photoUrl);
        }
        if (data.user.preferences) {
          setPreferences({
            travelStyle: data.user.preferences.travelStyle || 'Balanced',
            notifications: data.user.preferences.notifications !== false,
            currency: data.user.preferences.currency || 'DEFAULT',
            newsletter: !!data.user.preferences.newsletter
          });
          if (data.user.preferences.favoriteThemes) {
            setSelectedThemes(data.user.preferences.favoriteThemes);
          }
          if (data.user.preferences.coTravelers) {
            setCoTravelers(data.user.preferences.coTravelers);
          }
          if (data.user.preferences.emergencyContacts) {
            setEmergencyContacts(data.user.preferences.emergencyContacts);
          } else if (data.user.preferences.emergencyContact && data.user.preferences.emergencyContact.name) {
            setEmergencyContacts([data.user.preferences.emergencyContact]);
          }
          if (data.user.preferences.localeSettings) {
            setLocaleSettings(data.user.preferences.localeSettings);
          }
        }
        
        // Combine manual travel history with past trips from itineraries
        let manualHistory = Array.isArray(data.user.travel_history) ? data.user.travel_history : [];
        const now = new Date();
        const pastTrips = (Array.isArray(tripsData) ? tripsData : [])
          .filter(trip => new Date(trip.endDate) < now)
          .map(trip => {
            const startStr = new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
            const endStr = new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
            return {
              id: `auto-${trip.id}`,
              destination: trip.destination,
              dates: startStr === endStr ? startStr : `${startStr} - ${endStr}`,
              notes: 'Generated from past itinerary'
            };
          });

        // Filter out duplicate destinations if manual history already has them
        const manualDestinations = new Set(manualHistory.map(t => t.destination.toLowerCase()));
        const uniquePastTrips = pastTrips.filter(t => !manualDestinations.has(t.destination.toLowerCase()));

        const newTravelHistory = [...uniquePastTrips, ...manualHistory];
        setTravelHistory(newTravelHistory);

        // If we "caught" new past trips from the itinerary, store them in the database permanently
        if (uniquePastTrips.length > 0) {
          api.put('/auth/profile', {
            name: data.user.name,
            email: data.user.email,
            travelHistory: newTravelHistory
          }).catch(e => console.error('Failed to sync new past trips to database:', e));
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
        showToast('Could not fetch profile information.', 'error');
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
      if (!e.target.closest('.timezone-select-container')) {
        setIsTimezoneOpen(false);
      }
      if (!e.target.closest('.dateformat-select-container')) {
        setIsDateFormatOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handlePhotoChange = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setPhotoStatus({ type: 'error', msg: `Photo must be under ${MAX_MB} MB` });
      return;
    }

    setPhotoStatus({ type: 'uploading', msg: 'Uploading...' });

    const reader = new FileReader();
    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      setPhotoStatus({ type: 'error', msg: 'Failed to read file.' });
    };
    reader.onloadend = async () => {
      console.log('FileReader finished reading file, sending base64 to server...');
      let base64Data = reader.result;
      
      // Normalize HEIC prefix if needed so the backend can detect it
      if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
        if (base64Data.startsWith('data:;base64,')) {
          base64Data = base64Data.replace('data:;base64,', 'data:image/heic;base64,');
        } else if (base64Data.startsWith('data:application/octet-stream;base64,')) {
          base64Data = base64Data.replace('data:application/octet-stream;base64,', 'data:image/heic;base64,');
        }
      }

      try {
        setUpdating(true);
        const data = await api.put('/auth/profile', {
          name,
          email,
          profilePhoto: base64Data
        });
        
        console.log('Server response received:', data);
        const returnedPhoto = data.user.profilePhoto || data.user.profile_photo;
        
        if (returnedPhoto) {
          setProfilePhoto(returnedPhoto);
          updateUser({ profilePhoto: returnedPhoto });
        }
        
        setPhotoStatus({ type: 'success', msg: 'Photo updated!' });
        setTimeout(() => setPhotoStatus(null), 3000);
      } catch (err) {
        console.error('Upload failed with error:', err);
        setPhotoStatus({ type: 'error', msg: 'Upload failed. Try again.' });
      } finally {
        setUpdating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePreferences = async (updatedPreferences = {}) => {
    // Sanitize in case it's a React click event
    const cleanPrefs = (updatedPreferences && (updatedPreferences.nativeEvent || updatedPreferences.target)) ? {} : updatedPreferences;
    
    try {
      const data = await api.put('/auth/profile', {
        name,
        email,
        preferences: {
          ...preferences,
          favoriteThemes: selectedThemes,
          coTravelers,
          emergencyContacts,
          localeSettings,
          ...cleanPrefs
        }
      });
      localStorage.setItem('user', JSON.stringify({
        ...JSON.parse(localStorage.getItem('user')),
        preferences: data.user.preferences
      }));
      setProfile(prev => ({ ...prev, preferences: data.user.preferences }));
      setPreferredCurrency(data.user.preferences.currency || 'DEFAULT');
      showToast('Preferences saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save preferences.', 'error');
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
      showToast('Travel history updated!', 'success');
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

  const handleAddEmergencyContact = async (e) => {
    e.preventDefault();
    if (emergencyContacts.length >= 5) return;
    const updated = [...emergencyContacts, { ...newEmergencyContact, id: Date.now() }];
    setEmergencyContacts(updated);
    setNewEmergencyContact({ name: '', relation: '', phone: '', bloodGroup: '' });
    await handleSavePreferences({ emergencyContacts: updated });
  };

  const handleRemoveEmergencyContact = async (id) => {
    const updated = emergencyContacts.filter(c => c.id !== id);
    setEmergencyContacts(updated);
    await handleSavePreferences({ emergencyContacts: updated });
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
      showToast('Past trip removed from history.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    

    if (!name.trim() || !email.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }

    if (password) {
      if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
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
      showToast('Profile updated successfully!', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update profile.', 'error');
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
      showToast('Profile and password updated successfully!', 'success');
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

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-10">

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
            <div className="rounded-3xl border shadow-lg relative overflow-hidden w-full"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>

              {/* Full-width hero gradient banner */}
              <div className="relative h-24 bg-gradient-to-r from-violet-500 via-rose-500 to-orange-400 overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.4)_0%,_transparent_70%)]" />
              </div>

              {/* Avatar overlapping banner */}
              <div className="flex flex-col items-center -mt-12 px-6 pb-6">
                <div className="relative mb-1">
                  <div className="relative w-24 h-24 rounded-full shadow-xl border-4 border-white dark:border-slate-800 overflow-hidden group"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    {/* Photo or Initials */}
                    {profilePhoto && profilePhoto !== '' && profilePhoto !== 'null' && profilePhoto !== 'undefined' ? (
                      <img src={profilePhoto} alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold select-none"
                        style={{ color: 'var(--text-primary)' }}>
                        {name ? name.charAt(0).toUpperCase() : 'T'}
                      </span>
                    )}
                    {/* Upload Overlay on hover */}
                    <label className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200 z-10 ${photoStatus?.type === 'uploading'
                        ? 'bg-black/60 opacity-100'
                        : 'bg-black/60 opacity-0 group-hover:opacity-100'
                      }`}>
                      {photoStatus?.type === 'uploading' ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <>
                          <Edit2 className="h-5 w-5 text-white" />
                          <span className="text-[9px] text-white font-bold mt-1 uppercase tracking-wider">Change</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" disabled={photoStatus?.type === 'uploading'} />
                    </label>
                  </div>
                  {/* Mobile Edit Badge */}
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-transform hover:scale-110 active:scale-95">
                    <Edit2 className="h-3.5 w-3.5" />
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>

                {/* Upload hint & inline status */}
                <div className="flex flex-col items-center mb-2">
                  {photoStatus ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${photoStatus.type === 'uploading' ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' :
                        photoStatus.type === 'success' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' :
                          'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
                      }`}>
                      {photoStatus.msg}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Hover to change · Max 5 MB</span>
                  )}
                </div>

                <h2 className="text-xl font-black tracking-tight text-center" style={{ color: 'var(--text-primary)' }}>{name}</h2>
                <p className="text-xs font-semibold mt-0.5 text-center" style={{ color: 'var(--text-tertiary)' }}>{email}</p>

                <div className="flex items-center justify-center space-x-1.5 mt-3 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  <span>{t('joined')} {memberSinceDate}</span>
                </div>

                {profile?.google_id && (
                  <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {t('google_account_linked')}
                  </span>
                )}

                <div className="w-full mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-2.5 rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold cursor-pointer transition border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 active:scale-95"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('log_out_session')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Travel Stats Widget */}
            <div className="rounded-3xl border shadow-md p-6 w-full"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>

              <h3 className="text-[10px] font-black uppercase tracking-widest mb-5" style={{ color: 'var(--text-tertiary)' }}>{t('travel_stats')}</h3>

              <div className="space-y-3">
                {/* Trips */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/5 border border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('trips_planned')}</h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('total_itineraries')}</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.tripsCount}</span>
                </div>

                {/* Favorites */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/5 border border-rose-100 dark:border-rose-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('favorites')}</h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('saved_locations')}</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400">{stats.favoritesCount}</span>
                </div>

                {/* Budget */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('total_estimated_budget')}</h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('total_spent')}</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
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
                      { value: 'DEFAULT', label: 'Default (Native to Destination)' },
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
                      {(() => {
                        const timezones = [
                          { value: 'GMT-8:00', label: 'PST (GMT-8)' },
                          { value: 'GMT+0:00', label: 'UTC (GMT+0)' },
                          { value: 'GMT+1:00', label: 'CET (GMT+1)' },
                          { value: 'GMT+5:30', label: 'IST (GMT+5:30)' },
                          { value: 'GMT+9:00', label: 'JST (GMT+9)' }
                        ];
                        const activeTz = timezones.find(t => t.value === localeSettings.timezone) || timezones[3];

                        return (
                          <div className="space-y-1.5 relative timezone-select-container">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Timezone</label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsTimezoneOpen(!isTimezoneOpen);
                                setIsDateFormatOpen(false);
                                setIsCurrencyOpen(false);
                                setIsStyleOpen(false);
                              }}
                              className="w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer focus:outline-none transition-all duration-200"
                              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                            >
                              <span>{activeTz.label}</span>
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isTimezoneOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} />
                            </button>

                            <AnimatePresence>
                              {isTimezoneOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className="absolute left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden z-[100]"
                                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
                                >
                                  {timezones.map((item) => (
                                    <button
                                      key={item.value}
                                      type="button"
                                      onClick={() => {
                                        setLocaleSettings({ ...localeSettings, timezone: item.value });
                                        setIsTimezoneOpen(false);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                                      style={{
                                        color: localeSettings.timezone === item.value ? 'var(--rose-500)' : 'var(--text-secondary)',
                                        backgroundColor: localeSettings.timezone === item.value ? 'rgba(244,63,94,0.08)' : 'transparent'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (localeSettings.timezone !== item.value) e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.04)';
                                      }}
                                      onMouseLeave={(e) => {
                                        if (localeSettings.timezone !== item.value) e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      <span>{item.label}</span>
                                      {localeSettings.timezone === item.value && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })()}

                      {/* Date Format */}
                      {(() => {
                        const formats = [
                          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                        ];
                        const activeFormat = formats.find(f => f.value === localeSettings.dateFormat) || formats[0];

                        return (
                          <div className="space-y-1.5 relative dateformat-select-container">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Date Format</label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDateFormatOpen(!isDateFormatOpen);
                                setIsTimezoneOpen(false);
                                setIsCurrencyOpen(false);
                                setIsStyleOpen(false);
                              }}
                              className="w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer focus:outline-none transition-all duration-200"
                              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                            >
                              <span>{activeFormat.label}</span>
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isDateFormatOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} />
                            </button>

                            <AnimatePresence>
                              {isDateFormatOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className="absolute left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden z-[100]"
                                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
                                >
                                  {formats.map((item) => (
                                    <button
                                      key={item.value}
                                      type="button"
                                      onClick={() => {
                                        setLocaleSettings({ ...localeSettings, dateFormat: item.value });
                                        setIsDateFormatOpen(false);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                                      style={{
                                        color: localeSettings.dateFormat === item.value ? 'var(--rose-500)' : 'var(--text-secondary)',
                                        backgroundColor: localeSettings.dateFormat === item.value ? 'rgba(244,63,94,0.08)' : 'transparent'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (localeSettings.dateFormat !== item.value) e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.04)';
                                      }}
                                      onMouseLeave={(e) => {
                                        if (localeSettings.dateFormat !== item.value) e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      <span>{item.label}</span>
                                      {localeSettings.dateFormat === item.value && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })()}
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
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition select-none cursor-pointer ${localeSettings.tempUnit === unit
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
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t('email_notifications')}</h4>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('recommendations_desc')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${preferences.notifications ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                      </button>
                    </div>



                  </div>

                  <div className="flex justify-end pt-4 mt-auto">
                    <button
                      onClick={handleSavePreferences}
                      className="px-6 py-3 rounded-full text-white font-semibold text-xs uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 active:scale-95 shadow-md"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                    >
                      <span>{t('save_preferences')}</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* TRAVEL LOGS & EMERGENCY GRID */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
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
                        className={`rounded-2xl border p-4 relative transition-all duration-200 group flex flex-col justify-between ${isHovered
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

          {/* Emergency Info & Documents Vault Section */}
          <div className="rounded-3xl border shadow-md p-6 md:p-8 flex flex-col justify-between"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div>
              <h3 className="text-xl font-black flex items-center space-x-2 mb-1" style={{ color: 'var(--text-primary)' }}>
                <Activity className="h-5 w-5 text-rose-500" />
                <span>Emergency Profile & Documents</span>
              </h3>
              <p className="text-xs mb-6" style={{ color: 'var(--text-tertiary)' }}>Keep emergency contact info and documents accessible.</p>

              {emergencyContacts.length > 0 && (
                <div className="mb-6 grid grid-cols-1 gap-3 max-h-[160px] overflow-y-auto pr-2">
                  {emergencyContacts.map((contact) => (
                    <div key={contact.id} className="rounded-xl border p-3 flex items-center justify-between bg-rose-50/30 dark:bg-rose-950/20"
                         style={{ borderColor: 'var(--border-primary)' }}>
                      <div>
                        <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{contact.name}</h4>
                        <p className="text-[10px] text-rose-500 font-semibold">{contact.relation} • {contact.bloodGroup}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{contact.phone}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveEmergencyContact(contact.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Remove contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {emergencyContacts.length < 5 ? (
                <form onSubmit={handleAddEmergencyContact} className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Contact Name</label>
                        <input
                          type="text"
                          value={newEmergencyContact.name}
                          onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, name: e.target.value })}
                          placeholder="Jane Doe"
                          required
                          className="w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Relationship</label>
                        <input
                          type="text"
                          value={newEmergencyContact.relation}
                          onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, relation: e.target.value })}
                          placeholder="Spouse / Parent"
                          required
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
                          value={newEmergencyContact.phone}
                          onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, phone: e.target.value })}
                          placeholder="+91 9999999999"
                          required
                          className="w-full px-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Blood Group</label>
                        <select
                          value={newEmergencyContact.bloodGroup}
                          onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, bloodGroup: e.target.value })}
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
                      className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition hover:bg-rose-700 active:scale-95 shadow-md cursor-pointer flex items-center space-x-1.5"
                      style={{ backgroundColor: '#e11d48' }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Contact</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-4 border-t text-center text-xs font-semibold" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-tertiary)' }}>
                  Maximum limit of 5 emergency contacts reached.
                </div>
              )}

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
      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-36 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center space-x-2 border backdrop-blur-md"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: toast.type === 'error' ? 'rgba(239, 68, 68, 1)' : 'rgba(16, 185, 129, 1)',
              borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
            }}
          >
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
