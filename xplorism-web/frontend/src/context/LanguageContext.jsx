import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文 (简体)' }
];

// Helper to extract language from googtrans cookie (e.g. "/en/es" -> "es")
function getLanguageFromCookie() {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (match && match[1]) {
    const parts = match[1].split('/');
    const lang = parts[parts.length - 1];
    if (lang && SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      return lang;
    }
  }
  return localStorage.getItem('language') || 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getLanguageFromCookie);

  useEffect(() => {
    // Keep state synchronized with current cookie on mount
    const currentLang = getLanguageFromCookie();
    if (currentLang !== language) {
      setLanguageState(currentLang);
    }
  }, []);

  const setLanguage = (langCode) => {
    try {
      localStorage.setItem('language', langCode);
      setLanguageState(langCode);

      if (langCode === 'en') {
        // Clear cookie across root and host domains to revert to original page language
        const host = window.location.hostname;
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
        if (host.includes('.')) {
          const domainParts = host.split('.');
          if (domainParts.length > 1) {
            const rootDomain = '.' + domainParts.slice(-2).join('.');
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
          }
        }
      } else {
        // Set host-only cookie for path=/ so it works cleanly on localhost, custom domains, and *.onrender.com
        document.cookie = `googtrans=/en/${langCode}; path=/;`;
      }

      // If Google Translate combo box is rendered in DOM, trigger its change event directly
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = langCode;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Reload window so Google Translate initializes cleanly with the updated cookie
      window.location.reload();
    } catch (err) {
      console.warn('Failed to switch language via googtrans cookie:', err);
    }
  };

  // Pass-through identity translation function to keep all components functional
  const t = (key) => key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
