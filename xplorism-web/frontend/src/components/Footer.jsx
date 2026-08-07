import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <footer className={`border-t pt-16 pb-12 mt-auto mt-16 sm:mt-24 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-950'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-10 pb-12 border-b ${
          isDark ? 'border-slate-900' : 'border-slate-100'
        }`}>
          {/* Column 1: Branding and Socials */}
          <div className="col-span-2 md:col-span-4 space-y-5">
            <div className="flex items-center space-x-2.5 text-xl font-bold">
              <img
                src="/logo.png"
                alt="Xplorism Logo"
                className="h-10 w-10 object-contain rounded-full shadow-sm"
              />
              <span className={`font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Xplorism</span>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed max-w-sm transition-colors duration-200 ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
            }`}>
              {t('footer_slogan')}
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-450 hover:border-rose-900/55'
                    : 'bg-white border border-slate-150 text-slate-550 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50/20'
                }`}
                aria-label="Twitter"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    : 'bg-white border border-slate-150 text-slate-550 hover:text-slate-900 hover:border-slate-350 hover:bg-slate-50/50'
                }`}
                aria-label="GitHub"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a
                href="#"
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-550 hover:border-rose-900/55'
                    : 'bg-white border border-slate-150 text-slate-550 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/20'
                }`}
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Features */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-200' : 'text-slate-800'
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
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>{t('resources_title')}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('travel_guides')}</Link></li>
              <li><Link to="/" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('help_center')}</Link></li>
              <li><Link to="/community" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('community_feed_footer')}</Link></li>
              <li><Link to="/" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('terms_of_service')}</Link></li>
              <li><Link to="/" className={`text-xs sm:text-sm transition-all duration-200 hover:translate-x-1.5 inline-block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-655 hover:text-black'}`}>{t('privacy_policy')}</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="col-span-2 md:col-span-4 space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>{t('stay_updated')}</h4>
            <p className={`text-xs sm:text-sm leading-relaxed transition-colors duration-200 ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
            }`}>
              {t('newsletter_desc')}
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder={t('email_placeholder')}
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-1 transition ${
                    isDark
                      ? 'bg-slate-900 border border-slate-800 text-white placeholder-slate-550 focus:border-slate-700 focus:ring-slate-700'
                      : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-400'
                  }`}
                  required
                />
              </div>
              <button
                type="submit"
                className={`p-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1 cursor-pointer ${
                  isDark
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
        <div className={`flex flex-col sm:flex-row items-center justify-between pt-8 text-xs transition-colors duration-200 ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <p className={`transition-colors duration-200 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}>&copy; {new Date().getFullYear()} Xplorism. {t('all_rights_reserved')}</p>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <a href="#" className={`transition-all duration-200 hover:scale-105 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}>{t('privacy_policy')}</a>
            <a href="#" className={`transition-all duration-200 hover:scale-105 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}>{t('terms_of_service')}</a>
            <a href="#" className={`transition-all duration-200 hover:scale-105 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}>{t('cookie_settings')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
