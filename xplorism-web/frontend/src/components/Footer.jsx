import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Mail } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl relative transition-all duration-200 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
            }`}>
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer text-sm font-bold border-none bg-transparent"
            >
              ✕
            </button>
            {activeModal === 'privacy' && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-rose-500">Privacy Policy</h3>
                <div className="text-xs space-y-2.5 max-h-[300px] overflow-y-auto pr-1 leading-relaxed text-slate-500">
                  <p>Welcome to Xplorism! We take your privacy seriously. All documents uploaded to our Document Vault are fully encrypted in memory and stored securely using AES-256-GCM encryption.</p>
                  <p>We only collect information necessary to facilitate collaborative trip planning, including your name, email address, trip destinations, itineraries, and shared expenses.</p>
                  <p>Your personal data is never sold or shared with unauthorized third parties. By using our services, you consent to our collection and storage of your trip metadata and encrypted files.</p>
                </div>
              </div>
            )}
            {activeModal === 'terms' && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-rose-500">Terms of Service</h3>
                <div className="text-xs space-y-2.5 max-h-[300px] overflow-y-auto pr-1 leading-relaxed text-slate-500">
                  <p>By registering and using Xplorism, you agree to comply with and be bound by the following terms of service.</p>
                  <p>You agree not to upload any malicious code, unauthorized materials, or illegal documents to the shared vaults or trip workspace scratchpads.</p>
                  <p>Collaborative trip creation, budgeting tools, and live chat services are provided "as-is" without warranty. We do our best to maintain real-time sync via WebSocket and Kafka services, but are not liable for transient network disruptions.</p>
                </div>
              </div>
            )}
            {activeModal === 'cookies' && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-rose-500">Cookie Settings</h3>
                <div className="text-xs space-y-2.5 max-h-[300px] overflow-y-auto pr-1 leading-relaxed text-slate-500">
                  <p>Xplorism uses essential cookies and local storage tokens to keep you logged in and preserve your active trip workspace preferences (such as selected tabs or dark mode).</p>
                  <p>We do not use tracking or advertising cookies. You can choose to disable cookies in your browser settings, but doing so will prevent you from logging in and accessing collaborative features.</p>
                </div>
              </div>
            )}
            {activeModal === 'help' && (
              <div>
                {helpSubmitted ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Inquiry Sent</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed px-4">
                      Your help inquiry has been sent successfully!
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
                    <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-rose-500">Help Center / Contact Us</h3>
                    <form onSubmit={handleHelpSubmit} className="space-y-3.5 mt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Your Email Address</label>
                        <input
                          type="email"
                          value={helpForm.email}
                          onChange={(e) => setHelpForm({ ...helpForm, email: e.target.value })}
                          placeholder="you@example.com"
                          className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 transition ${isDark
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
