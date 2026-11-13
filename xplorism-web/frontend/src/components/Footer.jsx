import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Mail, ShieldCheck, FileText, Cookie, HelpCircle, X, Check, Lock, Database, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Footer() {
  const [activeModal, setActiveModal] = useState(null);
  const [helpForm, setHelpForm] = useState({ email: '', subject: '', message: '' });
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpSubmitted, setHelpSubmitted] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const handleOpenTravelGuides = (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event('open-xplorism-ai'));
  };

  const [cookiePrefs, setCookiePrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('xplorism_cookie_prefs');
      return saved ? JSON.parse(saved) : { essential: true, analytics: true, functional: true };
    } catch {
      return { essential: true, analytics: true, functional: true };
    }
  });
  const [cookieSaved, setCookieSaved] = useState(false);

  const handleSaveCookies = () => {
    try {
      localStorage.setItem('xplorism_cookie_prefs', JSON.stringify(cookiePrefs));
    } catch (e) {
      console.error(e);
    }
    setCookieSaved(true);
    setTimeout(() => {
      setCookieSaved(false);
      setActiveModal(null);
    }, 900);
  };

  const handleOpenHelp = (e) => {
    e.preventDefault();
    setHelpForm({
      email: user?.email || '',
      subject: '',
      message: ''
    });
    setHelpSubmitted(false);
    setActiveModal('help');
  };

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    setHelpSubmitting(true);
    try {
      await api.post('/trips/help-center', helpForm);
      setHelpForm({ email: '', subject: '', message: '' });
      setHelpSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to send support email. Please try again.');
    } finally {
      setHelpSubmitting(false);
    }
  };

  return (
    <footer className={`border-t pt-16 pb-12 mt-auto mt-16 sm:mt-24 transition-colors duration-200 ${isDark ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-950'
      }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-10 pb-12 border-b ${isDark ? 'border-slate-900' : 'border-slate-100'
          }`}>
          {/* Column 1: Branding and Socials */}
          <div className="col-span-2 md:col-span-4 space-y-5">
            <div className="flex items-center space-x-2.5 text-xl font-bold">
              <img
                src="/logo-removebg.png"
                alt="Xplorism Logo"
                className="h-10 w-10 object-contain rounded-full shadow-sm"
              />
              <span className={`font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'
                }`}>Xplorism</span>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed max-w-sm transition-colors duration-200 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
              }`}>
              {t('footer_slogan')}
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/TanishMehta23/Xplorism"
                target="_blank"
                rel="noopener noreferrer"
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    : 'bg-white border border-slate-150 text-slate-550 hover:text-slate-900 hover:border-slate-350 hover:bg-slate-50/50'
                  }`}
                aria-label="GitHub Repository"
                title="GitHub Repository"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Features */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>{t('features_title')}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/dashboard" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('itinerary_builder')}</Link></li>
              <li><Link to="/tracker" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('interactive_map')}</Link></li>
              <li><Link to="/weather" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('weather_forecast')}</Link></li>
              <li><Link to="/budgets" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('budget_manager')}</Link></li>
              <li><Link to="/vault" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('document_vault')}</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>{t('resources_title')}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/" onClick={handleOpenTravelGuides} className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('travel_guides')}</Link></li>
              <li><Link to="/" onClick={handleOpenHelp} className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('help_center')}</Link></li>
              <li><Link to="/community" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('community_feed_footer')}</Link></li>
              <li>
                <button
                  onClick={() => setActiveModal('terms')}
                  className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block bg-transparent border-none p-0 outline-none cursor-pointer text-left ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'
                    }`}
                >
                  {t('terms_of_service')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('privacy')}
                  className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block bg-transparent border-none p-0 outline-none cursor-pointer text-left ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'
                    }`}
                >
                  {t('privacy_policy')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="col-span-2 md:col-span-4 space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>{t('stay_updated')}</h4>
            <p className={`text-xs sm:text-sm leading-relaxed transition-colors duration-200 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
              }`}>
              {t('newsletter_desc')}
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder={t('email_placeholder')}
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-1 transition ${isDark
                      ? 'bg-slate-900 border border-slate-800 text-white placeholder-slate-550 focus:border-slate-700 focus:ring-slate-700'
                      : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                  required
                />
              </div>
              <button
                type="submit"
                className={`p-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1 cursor-pointer ${isDark
                    ? 'bg-white hover:bg-slate-100 text-slate-950'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
              >
                <span className="hidden sm:inline">{t('subscribe')}</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className={`flex flex-col sm:flex-row items-center justify-between pt-8 text-xs transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
          <p className={`transition-colors duration-200 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}>&copy; {new Date().getFullYear()} Xplorism. {t('all_rights_reserved')}</p>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <button onClick={() => setActiveModal('privacy')} className={`transition-all duration-200 hover:scale-105 cursor-pointer bg-transparent border-none p-0 outline-none ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}>{t('privacy_policy')}</button>
            <button onClick={() => setActiveModal('terms')} className={`transition-all duration-200 hover:scale-105 cursor-pointer bg-transparent border-none p-0 outline-none ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}>{t('terms_of_service')}</button>
            <button onClick={() => setActiveModal('cookies')} className={`transition-all duration-200 hover:scale-105 cursor-pointer bg-transparent border-none p-0 outline-none ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}>{t('cookie_settings')}</button>
          </div>
        </div>
      </div>

      {activeModal && (
        <div 
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md cursor-pointer animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative transition-all duration-200 cursor-default flex flex-col max-h-[88vh] overflow-hidden ${
              isDark 
                ? 'bg-slate-900/95 border-slate-800 text-white shadow-black/60' 
                : 'bg-white border-slate-100 text-slate-800 shadow-slate-900/15'
            }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                  {activeModal === 'privacy' && <ShieldCheck className="h-4.5 w-4.5" />}
                  {activeModal === 'terms' && <FileText className="h-4.5 w-4.5" />}
                  {activeModal === 'cookies' && <Cookie className="h-4.5 w-4.5" />}
                  {activeModal === 'help' && <HelpCircle className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    {activeModal === 'privacy' && t('privacy_policy')}
                    {activeModal === 'terms' && t('terms_of_service')}
                    {activeModal === 'cookies' && t('cookie_settings')}
                    {activeModal === 'help' && 'Help Center & Support'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {activeModal === 'privacy' && 'Data Protection & Security'}
                    {activeModal === 'terms' && 'Platform Guidelines & Usage'}
                    {activeModal === 'cookies' && 'Preferences & Storage'}
                    {activeModal === 'help' && 'Assistance & Inquiries'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none bg-transparent"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            {activeModal === 'privacy' && (
              <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
                  <Lock className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">End-to-End Encryption</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Every passport scan, flight ticket, and identification document uploaded to your Document Vault is fully encrypted in memory and stored at rest using industry-standard AES-256-GCM cryptography.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 px-1">
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">1. Information We Collect</h5>
                    <p className="text-slate-500 dark:text-slate-400">
                      We collect only the essential details necessary to facilitate collaborative trip planning: your name, verified email address, destination choices, schedules, itineraries, and collaborative expense logs.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">2. How Your Data is Used</h5>
                    <p className="text-slate-500 dark:text-slate-400">
                      Your itineraries and preferences are used solely to generate travel recommendations, optimize packing checklists, provide live weather forecasts, and sync real-time changes with your chosen group members.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">3. Zero Data Monetization</h5>
                    <p className="text-slate-500 dark:text-slate-400">
                      We do not sell, rent, or trade your personal data, travel itineraries, or encrypted files to any third parties or advertisers.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white text-xs font-bold transition cursor-pointer border-none shadow-sm"
                  >
                    I Understand
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'terms' && (
              <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
                  <Database className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">Platform Integrity</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      By accessing and using Xplorism, you agree to respectful collaboration and lawful usage across all shared workspaces and community feeds.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 px-1">
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">1. User Accounts & Security</h5>
                    <p className="text-slate-500 dark:text-slate-400">
                      You are responsible for maintaining the confidentiality of your session credentials and ensuring that access to your shared trips is granted only to trusted companions.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">2. Acceptable Use</h5>
                    <p className="text-slate-500 dark:text-slate-400">
                      You agree not to upload malicious code, unauthorized materials, or fraudulent documents to shared vaults or trip scratchpads, nor abuse rate limits or public community channels.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">3. Service Availability</h5>
                    <p className="text-slate-500 dark:text-slate-400">
                      Our live collaboration and AI planning engines are provided with high availability. While we strive for seamless real-time synchronization, transient disruptions in third-party maps or weather APIs may occasionally occur.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white text-xs font-bold transition cursor-pointer border-none shadow-sm"
                  >
                    Agree & Close
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'cookies' && (
              <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <p className="text-slate-500 dark:text-slate-400 px-1">
                  Manage how cookies and local storage are utilized on Xplorism. We prioritize privacy and never track your activity across third-party websites.
                </p>

                <div className="space-y-2.5">
                  {/* Essential Cookies */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="pr-3">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Essential & Session Cookies</h4>
                        <span className="text-[9px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-md font-bold uppercase">Required</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Required for authentication tokens, session persistence, and workspace access.
                      </p>
                    </div>
                    <div className="h-5 w-9 sm:h-6 sm:w-11 rounded-full bg-rose-500 opacity-80 flex items-center justify-end px-1 cursor-not-allowed">
                      <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>

                  {/* Functional Cookies */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="pr-3">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Functional Preferences</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Remembers your theme mode (Dark/Light), language choice, and active tabs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCookiePrefs(p => ({ ...p, functional: !p.functional }))}
                      className={`h-5 w-9 sm:h-6 sm:w-11 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-1 border-none ${
                        cookiePrefs.functional ? 'bg-rose-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="pr-3">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Performance & Analytics</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Anonymous telemetry to help us identify slow network queries and optimize app performance.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCookiePrefs(p => ({ ...p, analytics: !p.analytics }))}
                      className={`h-5 w-9 sm:h-6 sm:w-11 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-1 border-none ${
                        cookiePrefs.analytics ? 'bg-rose-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleSaveCookies}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border-none shadow-sm"
                  >
                    {cookieSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Preferences Saved</span>
                      </>
                    ) : (
                      <span>Save Preferences</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'help' && (
              <div className="flex-1 overflow-y-auto py-5 pr-1">
                {helpSubmitted ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Check className="h-6 w-6 stroke-[2.5]" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Inquiry Sent</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed px-4">
                      Your inquiry has been received. Our support team will get back to you shortly!
                    </p>
                    <div className="pt-4">
                      <button
                        onClick={() => setActiveModal(null)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white text-xs font-bold transition cursor-pointer border-none shadow-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <form onSubmit={handleHelpSubmit} className="space-y-3 mt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Your Email Address</label>
                        <input
                          type="email"
                          value={helpForm.email}
                          onChange={(e) => setHelpForm({ ...helpForm, email: e.target.value })}
                          placeholder="you@example.com"
                          readOnly={Boolean(user?.email)}
                          disabled={Boolean(user?.email)}
                          className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 transition ${
                            user?.email ? 'opacity-70 cursor-not-allowed select-none ' : ''
                          }${isDark
                              ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-slate-700 focus:ring-slate-700'
                              : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-400'
                            }`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Subject</label>
                        <input
                          type="text"
                          value={helpForm.subject}
                          onChange={(e) => setHelpForm({ ...helpForm, subject: e.target.value })}
                          placeholder="How can we help you?"
                          className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 transition ${isDark
                              ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-slate-700 focus:ring-slate-700'
                              : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-400'
                            }`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Message</label>
                        <textarea
                          value={helpForm.message}
                          onChange={(e) => setHelpForm({ ...helpForm, message: e.target.value })}
                          placeholder="Describe your issue or query..."
                          rows={4}
                          className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 transition ${isDark
                              ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-slate-700 focus:ring-slate-700'
                              : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-400'
                            }`}
                          required
                        />
                      </div>
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={helpSubmitting}
                          className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer border-none shadow-sm"
                        >
                          {helpSubmitting ? 'Sending...' : 'Send Inquiry'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
