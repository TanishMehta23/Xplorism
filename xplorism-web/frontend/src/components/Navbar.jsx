import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Compass, Sun, Moon, DollarSign, Hotel, User, Plane, Globe, ChevronDown, FolderLock, Users, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { api, SOCKET_URL } from '../services/api';
import { io } from 'socket.io-client';

export default function Navbar({ activeTab }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [emailingTripId, setEmailingTripId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const data = await api.get('/notifications');
        setNotifications(data);
        const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        const unread = data.filter(n => !readIds.includes(n.id)).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);

    // Global real-time socket connection for user-specific notifications
    const socket = io(SOCKET_URL);
    socket.emit('join-user-room', { userId: user.id });

    socket.on('new-notification', (notif) => {
      setNotifications((prev) => {
        if (prev.some(n => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user]);

  const handleNotificationsClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsDropdownOpen(false);
    if (!isNotificationsOpen) {
      const readIds = notifications.map(n => n.id);
      localStorage.setItem('readNotifications', JSON.stringify(readIds));
      setUnreadCount(0);
    }
  };

  const handleEmailReminder = async (tripId) => {
    setEmailingTripId(tripId);
    try {
      await api.post('/notifications/email-reminder', { tripId });
      alert('Trip reminder details sent to your email!');
    } catch (err) {
      console.error(err);
      alert('Failed to send email reminders.');
    } finally {
      setEmailingTripId(null);
    }
  };

  const handleRespondToInvitation = async (tripId, status) => {
    try {
      await api.post(`/trips/${tripId}/collaborators/respond`, { status });
      const data = await api.get('/notifications');
      setNotifications(data);
      const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      const unread = data.filter(n => !readIds.includes(n.id)).length;
      setUnreadCount(unread);
      if (status === 'approved') {
        navigate(`/trips/${tripId}/collaborate`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to respond to invitation.');
    }
  };

  // Close dropdown and mobile menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.profile-container') && !e.target.closest('.notifications-container')) {
        setIsDropdownOpen(false);
        setIsLangOpen(false);
        setIsNotificationsOpen(false);
      }
      if (!e.target.closest('.mobile-menu-toggle') && !e.target.closest('.mobile-menu-drawer')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [notifications]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'T';

  return (
    <>
      <nav className="relative z-30 w-full" style={{ backgroundColor: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}>
      <style>{`
        .nav-link {
          position: relative;
          transition: color 0.2s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 100%;
          transform: scaleX(0);
          height: 2px;
          bottom: -2px;
          left: 0;
          background-color: #f43f5e; /* rose-500 */
          transform-origin: bottom left;
          transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1); /* slow and smooth */
        }
        .nav-button:hover .nav-link::after {
          transform: scaleX(1);
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        
        {/* Left Section: Logo */}
        <div 
          className="flex items-center space-x-2 sm:space-x-3 text-xl sm:text-2xl font-bold tracking-tight cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <img 
            src="/logo.png" 
            alt="Xplorism Logo" 
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-full shadow-sm" 
          />
          <span style={{ color: 'var(--text-primary)' }} className="font-extrabold tracking-tight">
            Xplorism
          </span>
        </div>
        
        {/* Right Section: Nav Links + Profile Avatar Dropdown */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Desktop Nav Links aligned to the right */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
            <button 
              onClick={() => navigate('/dashboard')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'trips' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Compass className="h-4 w-4" />
              <span className="nav-link">{t('trips')}</span>
            </button>
            <button 
              onClick={() => navigate('/shared-trips')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'shared-trips' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Users className="h-4 w-4" />
              <span className="nav-link">{t('shared_trips')}</span>
            </button>
            <button 
              onClick={() => navigate('/weather')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'weather' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Sun className="h-4 w-4" />
              <span className="nav-link">{t('weather')}</span>
            </button>
            <button 
              onClick={() => navigate('/tracker')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'tracker' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Plane className="h-4 w-4" />
              <span className="nav-link">{t('tracker')}</span>
            </button>
            <button 
              onClick={() => navigate('/hotels')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'hotels' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Hotel className="h-4 w-4" />
              <span className="nav-link">{t('hotels')}</span>
            </button>
            <button 
              onClick={() => navigate('/budgets')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'budgets' ? 'text-rose-500 font-bold' : ''}`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="nav-link">{t('budgets')}</span>
            </button>
            <button 
              onClick={() => navigate('/vault')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'vault' ? 'text-rose-500 font-bold' : ''}`}
            >
              <FolderLock className="h-4 w-4" />
              <span className="nav-link">{t('vault')}</span>
            </button>
            <button 
              onClick={() => navigate('/community')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'community' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Users className="h-4 w-4" />
              <span className="nav-link">{t('community')}</span>
            </button>
          </div>



          {/* Notifications Dropdown Container */}
          {user && (
            <div className="relative notifications-container mr-2">
              <button
                onClick={handleNotificationsClick}
                className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition relative cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-[-60px] sm:right-0 mt-3 w-[calc(100vw-32px)] sm:w-80 max-w-xs rounded-2xl shadow-xl p-4 z-50 border max-h-[400px] overflow-y-auto"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                  >
                    <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: 'var(--border-secondary)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Alerts & Reminders</span>
                    </div>

                    <div className="space-y-3">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="p-3 rounded-xl border space-y-2 transition duration-200"
                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                          >
                             <div className="flex items-center space-x-2">
                              <span className="text-sm">
                                {n.type === 'trip' ? '✈️' : n.type === 'packing' ? '🎒' : n.type === 'invitation' ? '✉️' : '🌤️'}
                              </span>
                              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{n.title}</span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                            {n.type === 'invitation' ? (
                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => handleRespondToInvitation(n.tripId, 'approved')}
                                  className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1 px-2.5 rounded-lg transition cursor-pointer shadow-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRespondToInvitation(n.tripId, 'declined')}
                                  className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-bold py-1 px-2.5 rounded-lg transition cursor-pointer shadow-sm"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <button
                                disabled={emailingTripId === n.tripId}
                                onClick={() => handleEmailReminder(n.tripId)}
                                className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                              >
                                <span>{emailingTripId === n.tripId ? 'Sending...' : '📧 Email Me Reminders'}</span>
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          No active alerts or reminders!
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Profile Dropdown Container */}
          <div className="relative profile-container">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 rounded-full font-extrabold flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer select-none text-sm tracking-wide border"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
            >
              {userInitial}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-2xl shadow-xl py-2 z-50 border"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                  <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('logged_in_as')}</p>
                  <p className="text-xs font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Traveler'}</p>
                </div>
                
                {/* Theme Selector */}
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center space-x-2 cursor-pointer border-b"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(217,119,6,0.12)' : '#fffbeb'; e.currentTarget.style.color = '#d97706'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  )}
                  <span>{theme === 'dark' ? t('light_mode') : t('dark_mode')}</span>
                </button>

                {/* Language Selector Dropdown */}
                {(() => {
                  const languagesList = [
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                    { code: 'es', label: 'Español', flag: '🇪🇸' },
                    { code: 'fr', label: 'Français', flag: '🇫🇷' },
                    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                    { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
                    { code: 'ar', label: 'العربية (Arabic)', flag: '🇦🇪' },
                    { code: 'pt', label: 'Português', flag: '🇵🇹' }
                  ];
                  const currentLangObj = languagesList.find(l => l.code === language) || languagesList[0];

                  return (
                    <div className="px-4 py-2 border-b relative" style={{ borderColor: 'var(--border-secondary)' }}>
                      <p className="text-[9px] uppercase font-bold tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Language / Idioma</p>
                      
                      <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="w-full text-xs font-bold py-1.5 px-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                      >
                        <span className="flex items-center space-x-1.5">
                          <span className="text-sm leading-none">{currentLangObj.flag}</span>
                          <span>{currentLangObj.label}</span>
                        </span>
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} />
                      </button>

                      <AnimatePresence>
                        {isLangOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute left-4 right-4 mt-1 rounded-xl border shadow-xl overflow-hidden z-[100]"
                            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
                          >
                            {languagesList.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setLanguage(lang.code);
                                  setIsLangOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                                style={{ 
                                  color: language === lang.code ? 'var(--rose-500)' : 'var(--text-secondary)',
                                  backgroundColor: language === lang.code ? 'rgba(244,63,94,0.08)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  if (language !== lang.code) {
                                    e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.04)';
                                  }
                                }}
                                  onMouseLeave={(e) => {
                                  if (language !== lang.code) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <span className="flex items-center space-x-2">
                                  <span className="text-sm leading-none">{lang.flag}</span>
                                  <span>{lang.label}</span>
                                </span>
                                {language === lang.code && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                 <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center space-x-2 cursor-pointer border-b"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.12)'; e.currentTarget.style.color = '#3b82f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{t('profile')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center space-x-2 cursor-pointer text-rose-500"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
            className="mobile-menu-toggle flex md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu-drawer md:hidden w-full overflow-hidden border-t px-6 py-4 space-y-3"
            style={{ 
              backgroundColor: 'var(--nav-bg)', 
              borderColor: 'var(--nav-border)' 
            }}
          >
            <div className="flex flex-col space-y-2.5">
              <button 
                onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} 
                className={`py-2 px-3 rounded-xl text-left text-sm font-bold flex items-center space-x-2.5 transition ${activeTab === 'trips' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'}`}
                style={{ color: activeTab === 'trips' ? '' : 'var(--text-secondary)' }}
              >
                <Compass className="h-4 w-4" />
                <span>{t('trips')}</span>
              </button>
              <button 
                onClick={() => { navigate('/shared-trips'); setIsMobileMenuOpen(false); }} 
                className={`py-2 px-3 rounded-xl text-left text-sm font-bold flex items-center space-x-2.5 transition ${activeTab === 'shared-trips' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'}`}
                style={{ color: activeTab === 'shared-trips' ? '' : 'var(--text-secondary)' }}
              >
                <Users className="h-4 w-4" />
                <span>{t('shared_trips')}</span>
              </button>
              <button 
                onClick={() => { navigate('/weather'); setIsMobileMenuOpen(false); }} 
                className={`py-2 px-3 rounded-xl text-left text-sm font-bold flex items-center space-x-2.5 transition ${activeTab === 'weather' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'}`}
                style={{ color: activeTab === 'weather' ? '' : 'var(--text-secondary)' }}
              >
                <Sun className="h-4 w-4" />
                <span>{t('weather')}</span>
              </button>
              <button 
                onClick={() => { navigate('/tracker'); setIsMobileMenuOpen(false); }} 
                className={`py-2 px-3 rounded-xl text-left text-sm font-bold flex items-center space-x-2.5 transition ${activeTab === 'tracker' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'}`}
                style={{ color: activeTab === 'tracker' ? '' : 'var(--text-secondary)' }}
              >
                <Plane className="h-4 w-4" />
                <span>{t('tracker')}</span>
              </button>
              <button 
                onClick={() => { navigate('/hotels'); setIsMobileMenuOpen(false); }} 
                className={`py-2 px-3 rounded-xl text-left text-sm font-bold flex items-center space-x-2.5 transition ${activeTab === 'hotels' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'}`}
                style={{ color: activeTab === 'hotels' ? '' : 'var(--text-secondary)' }}
              >
                <Hotel className="h-4 w-4" />
                <span>{t('hotels')}</span>
              </button>
              <button 
                onClick={() => { navigate('/budgets'); setIsMobileMenuOpen(false); }} 
                className={`py-2 px-3 rounded-xl text-left text-sm font-bold flex items-center space-x-2.5 transition ${activeTab === 'budgets' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'}`}
                style={{ color: activeTab === 'budgets' ? '' : 'var(--text-secondary)' }}
              >
                <DollarSign className="h-4 w-4" />
                <span>{t('budgets')}</span>
              </button>
              <button 
                onClick={() => { navigate('/vault'); setIsMobileMenuOpen(false); }} 
                className={`py-2 px-3 rounded-xl text-left text-sm font-bold flex items-center space-x-2.5 transition ${activeTab === 'vault' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'}`}
                style={{ color: activeTab === 'vault' ? '' : 'var(--text-secondary)' }}
              >
                <FolderLock className="h-4 w-4" />
                <span>{t('vault')}</span>
              </button>
              <button 
                onClick={() => { navigate('/community'); setIsMobileMenuOpen(false); }} 
                className={`py-2 px-3 rounded-xl text-left text-sm font-bold flex items-center space-x-2.5 transition ${activeTab === 'community' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'}`}
                style={{ color: activeTab === 'community' ? '' : 'var(--text-secondary)' }}
              >
                <Users className="h-4 w-4" />
                <span>{t('community')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>

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
    </>
  );
}
