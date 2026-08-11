import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Globe, DollarSign, Calendar, Thermometer,
  Bell, Newspaper, Heart, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function TravelPreferencesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Form State
  const [preferences, setPreferences] = useState({
    preferredTravelStyle: 'Balanced Mix',
    preferredCurrency: 'USD ($)',
    timezone: 'IST (GMT+5:30)',
    dateFormat: 'DD/MM/YYYY',
    temperatureUnit: 'C',
    emailNotifications: true,
    weeklyDigest: false,
    favoriteThemes: ['Nature', 'History', 'Food', 'Shopping']
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const travelStyles = ['Adventure', 'Luxury', 'Budget', 'Balanced Mix', 'Cultural'];
  const currencies = ['USD ($)', 'EUR (€)', 'GBP (£)', 'INR (₹)', 'JPY (¥)', 'AUD ($)', 'CAD ($)'];
  const timezones = ['IST (GMT+5:30)', 'EST (GMT-5)', 'CST (GMT-6)', 'PST (GMT-8)', 'UTC (GMT+0)', 'CET (GMT+1)', 'JST (GMT+9)'];
  const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
  const availableThemes = ['Nature', 'History', 'Food', 'Shopping', 'Nightlife', 'Beaches', 'Adventure', 'Art & Culture'];

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/preferences/${user.id}`);

      if (response?.data) {
        setPreferences({
          preferredTravelStyle: response.data.preferredTravelStyle || 'Balanced Mix',
          preferredCurrency: response.data.preferredCurrency || 'USD ($)',
          timezone: response.data.locale?.timezone || 'IST (GMT+5:30)',
          dateFormat: response.data.locale?.dateFormat || 'DD/MM/YYYY',
          temperatureUnit: response.data.display?.temperatureUnit || 'C',
          emailNotifications: response.data.notifications?.emailNotifications ?? true,
          weeklyDigest: response.data.notifications?.weeklyDigest ?? false,
          favoriteThemes: response.data.favoriteThemes || ['Nature', 'History', 'Food', 'Shopping']
        });
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        preferredTravelStyle: preferences.preferredTravelStyle,
        preferredCurrency: preferences.preferredCurrency,
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat,
        temperatureUnit: preferences.temperatureUnit,
        emailNotifications: preferences.emailNotifications,
        weeklyDigest: preferences.weeklyDigest,
        favoriteThemes: preferences.favoriteThemes
      };

      await api.put(`/preferences/${user.id}`, payload);
      setSuccess('Preferences saved successfully!');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = (theme) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteThemes: prev.favoriteThemes.includes(theme)
        ? prev.favoriteThemes.filter((t) => t !== theme)
        : [...prev.favoriteThemes, theme]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
        <Navbar activeTab="profile" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Navbar activeTab="profile" />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-rose-500" />
            <h1 className="text-3xl font-bold text-slate-900">Travel Preferences</h1>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700"
            >
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preferences Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
          {/* Travel Style */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Preferred Travel Style
            </label>
            <select
              value={preferences.preferredTravelStyle}
              onChange={(e) => setPreferences({ ...preferences, preferredTravelStyle: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
            >
              {travelStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Preferred Currency
            </label>
            <select
              value={preferences.preferredCurrency}
              onChange={(e) => setPreferences({ ...preferences, preferredCurrency: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          {/* Locale & Display Settings */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Locale & Display Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Timezone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Date Format</label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                >
                  {dateFormats.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Temperature Unit */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Temperature Unit</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPreferences({ ...preferences, temperatureUnit: 'C' })}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition ${
                    preferences.temperatureUnit === 'C'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  °C
                </button>
                <button
                  onClick={() => setPreferences({ ...preferences, temperatureUnit: 'F' })}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition ${
                    preferences.temperatureUnit === 'F'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  °F
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Notifications</h3>

            <div className="space-y-4">
              {/* Email Notifications */}
              <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Email Notifications</p>
                    <p className="text-xs text-slate-500">Recommendations and trip reminders</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  className="w-5 h-5 rounded cursor-pointer accent-blue-500"
                />
              </label>

              {/* Weekly Digest */}
              <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
                <div className="flex items-center gap-3">
                  <Newspaper className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Weekly Digest</p>
                    <p className="text-xs text-slate-500">Curated newsletters and travel deals</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.weeklyDigest}
                  onChange={(e) => setPreferences({ ...preferences, weeklyDigest: e.target.checked })}
                  className="w-5 h-5 rounded cursor-pointer accent-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Favorite Travel Themes */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Favorite Travel Themes</h3>
            <p className="text-xs text-slate-500 mb-4">Choose themes to personalize your recommendations.</p>

            <div className="flex flex-wrap gap-3">
              {availableThemes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => toggleTheme(theme)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition border-2 ${
                    preferences.favoriteThemes.includes(theme)
                      ? 'bg-rose-100 border-rose-500 text-rose-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-full bg-blue-500 text-white font-bold text-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
