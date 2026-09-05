import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Cloud, CloudRain, Snowflake, Wind, ArrowLeft, 
  MapPin, Droplets, Thermometer, Sparkles, Search, Compass,
  Calendar, CloudLightning, CloudDrizzle, CloudFog, Globe
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

// WMO Weather Codes mapping to Icons, Descriptions, and dynamic theme colors
const WEATHER_CODE_MAP = {
  0: { label: 'Clear Sky', labelKey: 'weather_clear_sky', icon: Sun, bg: 'bg-amber-500/10 border-amber-500/20', color: 'text-amber-500', iconBg: 'bg-amber-500/20', theme: 'sunny' },
  1: { label: 'Mainly Clear', labelKey: 'weather_mainly_clear', icon: Sun, bg: 'bg-yellow-500/10 border-yellow-500/20', color: 'text-yellow-500', iconBg: 'bg-yellow-500/20', theme: 'sunny' },
  2: { label: 'Partly Cloudy', labelKey: 'weather_partly_cloudy', icon: Cloud, bg: 'bg-sky-500/10 border-sky-500/20', color: 'text-sky-400', iconBg: 'bg-sky-500/20', theme: 'cloudy' },
  3: { label: 'Overcast', labelKey: 'weather_overcast', icon: Cloud, bg: 'bg-slate-500/10 border-slate-500/20', color: 'text-slate-400', iconBg: 'bg-slate-500/20', theme: 'overcast' },
  45: { label: 'Foggy', labelKey: 'weather_foggy', icon: CloudFog, bg: 'bg-zinc-500/10 border-zinc-500/20', color: 'text-zinc-400', iconBg: 'bg-zinc-500/20', theme: 'foggy' },
  48: { label: 'Depositing Rime Fog', labelKey: 'weather_rime_fog', icon: CloudFog, bg: 'bg-zinc-600/10 border-zinc-600/20', color: 'text-zinc-400', iconBg: 'bg-zinc-600/20', theme: 'foggy' },
  51: { label: 'Light Drizzle', labelKey: 'weather_light_drizzle', icon: CloudDrizzle, bg: 'bg-cyan-500/10 border-cyan-500/20', color: 'text-cyan-400', iconBg: 'bg-cyan-500/20', theme: 'rainy' },
  53: { label: 'Moderate Drizzle', labelKey: 'weather_moderate_drizzle', icon: CloudDrizzle, bg: 'bg-cyan-600/10 border-cyan-605/20', color: 'text-cyan-400', iconBg: 'bg-cyan-600/20', theme: 'rainy' },
  55: { label: 'Dense Drizzle', labelKey: 'weather_dense_drizzle', icon: CloudDrizzle, bg: 'bg-cyan-700/10 border-cyan-705/20', color: 'text-cyan-400', iconBg: 'bg-cyan-700/20', theme: 'rainy' },
  61: { label: 'Slight Rain', labelKey: 'weather_slight_rain', icon: CloudRain, bg: 'bg-blue-500/10 border-blue-500/20', color: 'text-blue-400', iconBg: 'bg-blue-500/20', theme: 'rainy' },
  63: { label: 'Moderate Rain', labelKey: 'weather_moderate_rain', icon: CloudRain, bg: 'bg-blue-600/10 border-blue-600/20', color: 'text-blue-450', iconBg: 'bg-blue-600/20', theme: 'rainy' },
  65: { label: 'Heavy Rain', labelKey: 'weather_heavy_rain', icon: CloudRain, bg: 'bg-blue-700/15 border-blue-700/20', color: 'text-blue-400', iconBg: 'bg-blue-700/20', theme: 'rainy' },
  71: { label: 'Slight Snowfall', labelKey: 'weather_slight_snow', icon: Snowflake, bg: 'bg-indigo-400/10 border-indigo-400/20', color: 'text-indigo-350', iconBg: 'bg-indigo-400/20', theme: 'snowy' },
  73: { label: 'Moderate Snowfall', labelKey: 'weather_moderate_snow', icon: Snowflake, bg: 'bg-indigo-500/10 border-indigo-500/20', color: 'text-indigo-400', iconBg: 'bg-indigo-500/20', theme: 'snowy' },
  75: { label: 'Heavy Snowfall', labelKey: 'weather_heavy_snow', icon: Snowflake, bg: 'bg-indigo-600/15 border-indigo-600/20', color: 'text-indigo-350', iconBg: 'bg-indigo-600/20', theme: 'snowy' },
  80: { label: 'Slight Rain Showers', labelKey: 'weather_slight_showers', icon: CloudRain, bg: 'bg-cyan-500/10 border-cyan-500/20', color: 'text-cyan-400', iconBg: 'bg-cyan-500/20', theme: 'rainy' },
  81: { label: 'Moderate Rain Showers', labelKey: 'weather_moderate_showers', icon: CloudRain, bg: 'bg-cyan-600/10 border-cyan-600/20', color: 'text-cyan-400', iconBg: 'bg-cyan-600/20', theme: 'rainy' },
  82: { label: 'Violent Rain Showers', labelKey: 'weather_violent_showers', icon: CloudRain, bg: 'bg-blue-700/15 border-blue-700/20', color: 'text-blue-400', iconBg: 'bg-blue-700/20', theme: 'rainy' },
  95: { label: 'Thunderstorm', labelKey: 'weather_thunderstorm', icon: CloudLightning, bg: 'bg-purple-500/10 border-purple-500/20', color: 'text-purple-400', iconBg: 'bg-purple-500/20', theme: 'thunder' },
  96: { label: 'Thunderstorm with Hail', labelKey: 'weather_thunder_hail', icon: CloudLightning, bg: 'bg-purple-600/15 border-purple-600/20', color: 'text-purple-400', iconBg: 'bg-purple-600/20', theme: 'thunder' },
  99: { label: 'Heavy Thunderstorm', labelKey: 'weather_heavy_thunder', icon: CloudLightning, bg: 'bg-violet-700/15 border-violet-700/20', color: 'text-violet-400', iconBg: 'bg-violet-700/20', theme: 'thunder' }
};

const getDefaultWeather = () => ({
  label: 'Unknown',
  icon: Cloud,
  bg: 'bg-slate-500/10 border-slate-500/20',
  color: 'text-slate-400',
  iconBg: 'bg-slate-500/20',
  theme: 'cloudy'
});

// A stunning animated wireframe SVG Globe component
const GlobeAnimation = () => {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center animate-float">
      {/* Globe Background Blur Glow */}
      <div className="absolute inset-4 rounded-full bg-rose-500/10 blur-xl animate-pulse" style={{ animationDuration: '4s' }} />
      
      {/* Spinning SVG Globe */}
      <svg className="w-36 h-36 text-rose-500/80 animate-spin-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
        {/* Outer Circumference */}
        <circle cx="50" cy="50" r="45" strokeWidth="1.5" />
        
        {/* Latitudes */}
        <line x1="5" y1="50" x2="95" y2="50" strokeWidth="0.8" />
        <path d="M6.5,35 Q50,42 93.5,35" />
        <path d="M6.5,65 Q50,58 93.5,65" />
        <path d="M15,20 Q50,26 85,20" strokeWidth="0.6" />
        <path d="M15,80 Q50,74 85,80" strokeWidth="0.6" />
        
        {/* Longitudes */}
        <line x1="50" y1="5" x2="50" y2="95" strokeWidth="0.8" />
        <path d="M35,6.5 Q42,50 35,93.5" />
        <path d="M65,6.5 Q58,50 65,93.5" />
        <path d="M20,15 Q26,50 20,85" strokeWidth="0.6" />
        <path d="M80,15 Q74,50 80,85" strokeWidth="0.6" />
      </svg>
      
      {/* Orbiting Satellite Marker */}
      <div className="absolute w-2 h-2 rounded-full bg-sky-400 border border-white shadow-md animate-orbit" />
    </div>
  );
};

export default function WeatherPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState('');

  // Custom location permission modal state
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // On mount, show the custom location permission modal (only if geolocation is supported)
  useEffect(() => {
    if (navigator.geolocation) {
      setShowLocationModal(true);
    } else {
      fetchWeatherForCity('Paris, France');
    }
  }, []);

  const handleAllowLocation = () => {
    setShowLocationModal(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode to get city name
        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const geoData = await geoResponse.json();
          const cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          fetchWeatherForCity(cityName, latitude, longitude);
        } catch (err) {
          console.warn('Reverse geocoding failed:', err.message);
          fetchWeatherForCity(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude);
        }
      },
      (err) => {
        console.warn('Geolocation access denied or failed. Falling back to Paris, France. Error:', err.message);
        fetchWeatherForCity('Paris, France');
      }
    );
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    fetchWeatherForCity('Paris, France');
  };

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        let results = [];
        try {
          const data = await api.get(`/geocode?q=${encodeURIComponent(query)}`);
          if (data && data.length > 0) {
            results = data;
          }
        } catch (backendErr) {
          console.warn('Backend autocomplete fallback triggered:', backendErr);
        }

        // Direct Open-Meteo search fallback if backend was rate-limited
        if (results.length === 0) {
          const directGeoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
          if (directGeoRes.ok) {
            const directGeoData = await directGeoRes.json();
            if (directGeoData && directGeoData.results) {
              results = directGeoData.results.map(r => ({
                place_id: r.id,
                display_name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
                lat: r.latitude,
                lon: r.longitude
              }));
            }
          }
        }

        if (results.length > 0) {
          setSuggestions(results.slice(0, 6));
        }
      } catch (err) {
        console.error('Weather autocomplete error:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside listener for suggestions
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchWeatherForCity = async (cityName, latCoords = null, lonCoords = null) => {
    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      let lat = latCoords;
      let lon = lonCoords;

      if (!lat || !lon) {
        // Try backend geocode first, with direct Open-Meteo fallback
        try {
          const geoData = await api.get(`/geocode?q=${encodeURIComponent(cityName)}`);
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lon = parseFloat(geoData[0].lon);
          }
        } catch (backendErr) {
          console.warn('Backend geocode failed, trying direct Open-Meteo geocode:', backendErr);
        }

        // Direct Open-Meteo fallback if backend was unavailable or rate-limited
        if (!lat || !lon) {
          const directGeoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
          if (directGeoRes.ok) {
            const directGeoData = await directGeoRes.json();
            if (directGeoData && directGeoData.results && directGeoData.results.length > 0) {
              lat = directGeoData.results[0].latitude;
              lon = directGeoData.results[0].longitude;
            }
          }
        }

        if (!lat || !lon) {
          throw new Error('City location details could not be resolved. Please try a different name.');
        }
      }

      // Query Open-Meteo API
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
      );

      if (!response.ok) {
        throw new Error('Failed to retrieve forecast data from weather service.');
      }

      const rawData = await response.json();
      setWeatherData(rawData);
      setSelectedCity(cityName);
      setQuery('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading weather data.');
    } finally {
      setLoading(false);
    }
  };

  const currentCondition = weatherData 
    ? (WEATHER_CODE_MAP[weatherData.current.weather_code] || getDefaultWeather())
    : getDefaultWeather();

  const CurrentIcon = currentCondition.icon;
  const weatherTheme = currentCondition.theme;

  // Background gradient configs based on the weather theme
  const getThemeBackground = () => {
    switch (weatherTheme) {
      case 'sunny':
        return isDarkMode
          ? 'from-slate-900 via-zinc-900 to-amber-950/40'
          : 'from-amber-200/40 via-orange-100/30 to-sky-100/20';
      case 'rainy':
        return isDarkMode
          ? 'from-blue-950 via-slate-900 to-indigo-950'
          : 'from-sky-200/40 via-blue-100/30 to-indigo-100/20';
      case 'snowy':
        return isDarkMode
          ? 'from-slate-900 via-indigo-950/30 to-slate-950'
          : 'from-sky-200/40 via-indigo-100/30 to-slate-100/20';
      case 'thunder':
        return isDarkMode
          ? 'from-purple-950 via-slate-900/95 to-violet-950'
          : 'from-purple-200/40 via-indigo-100/30 to-slate-100/20';
      case 'overcast':
      case 'foggy':
      default:
        return isDarkMode
          ? 'from-slate-900 via-zinc-900 to-slate-950'
          : 'from-slate-200/40 via-blue-100/30 to-slate-100/20';
    }
  };

  // Helper to generate dynamic atmospheric particles (rain, snow, rays, clouds)
  const renderAtmosphereParticles = () => {
    if (weatherTheme === 'rainy') {
      return Array.from({ length: 40 }).map((_, i) => (
        <span 
          key={i} 
          className="absolute bg-sky-400/40 dark:bg-sky-200/40 w-[1.5px] h-[35px] rounded-full animate-rain pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${0.8 + Math.random() * 0.7}s`
          }}
        />
      ));
    }
    if (weatherTheme === 'snowy') {
      return Array.from({ length: 30 }).map((_, i) => (
        <span 
          key={i} 
          className="absolute bg-slate-300 dark:bg-white rounded-full animate-snow pointer-events-none"
          style={{
            width: `${2 + Math.random() * 5}px`,
            height: `${2 + Math.random() * 5}px`,
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 10}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            opacity: 0.5 + Math.random() * 0.5
          }}
        />
      ));
    }
    if (weatherTheme === 'sunny') {
      return (
        <div className="absolute inset-0 bg-radial-sun opacity-20 dark:opacity-30 animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />
      );
    }
    if (weatherTheme === 'thunder') {
      return (
        <div className="absolute inset-0 bg-white/0 animate-lightning pointer-events-none" />
      );
    }
    return null;
  };

  const isDarkTheme = isDarkMode;

  const getCardStyles = () => {
    switch (weatherTheme) {
      case 'sunny':
        return isDarkMode
          ? 'bg-gradient-to-br from-amber-950/80 via-yellow-950/50 to-slate-900/80 border-amber-500/30 text-white'
          : 'bg-gradient-to-br from-amber-50 via-orange-50/70 to-yellow-50/60 border-amber-200/80 text-slate-900 shadow-sm';
      case 'cloudy':
      case 'overcast':
      case 'foggy':
        return isDarkMode
          ? 'bg-gradient-to-br from-slate-900/90 to-zinc-900/70 border-slate-700/50 text-white'
          : 'bg-gradient-to-br from-slate-50 via-sky-50/50 to-slate-100/70 border-slate-200 text-slate-900 shadow-sm';
      case 'rainy':
      case 'thunder':
        return isDarkMode
          ? 'bg-gradient-to-br from-blue-950/85 to-purple-950/60 border-blue-800/40 text-white'
          : 'bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-indigo-50/70 border-blue-200/80 text-slate-900 shadow-sm';
      case 'snowy':
        return isDarkMode
          ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900/40 border-indigo-500/30 text-white'
          : 'bg-gradient-to-br from-sky-50/90 via-indigo-50/70 to-slate-50 border-indigo-200/80 text-slate-900 shadow-sm';
      default:
        return isDarkMode
          ? 'bg-slate-900/60 border-slate-700 text-white'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm';
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-clip transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Decorative Ambient Blur Overlays */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Dynamic Animated Atmospheric Background Overlay (subtle) */}
      <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${getThemeBackground()} opacity-30 transition-all duration-700 pointer-events-none`} />
      
      {/* Atmosphere particles layer */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {renderAtmosphereParticles()}
      </div>

      <style>{`
        @keyframes rain {
          0% { transform: translateY(-50px) rotate(15deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(15deg); opacity: 0.2; }
        }
        @keyframes snow {
          0% { transform: translateY(-20px) translateX(0); }
          50% { transform: translateY(50vh) translateX(40px); }
          100% { transform: translateY(110vh) translateX(-20px); }
        }
        @keyframes lightning {
          0%, 95%, 98%, 100% { background-color: rgba(255, 255, 255, 0); }
          96%, 97% { background-color: rgba(255, 255, 255, 0.25); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translate(75px) rotate(0deg); }
          100% { transform: rotate(360deg) translate(75px) rotate(-360deg); }
        }
        .animate-rain { animation: rain linear infinite; }
        .animate-snow { animation: snow linear infinite; }
        .animate-lightning { animation: lightning 5s infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        .animate-orbit { animation: orbit 8s linear infinite; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .bg-radial-sun {
          background: radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0) 60%);
        }
      `}</style>

      <Navbar activeTab="weather" />

      {/* Custom Location Permission Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(100,116,139,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl w-full max-w-sm px-8 pt-8 pb-7 flex flex-col items-center text-center"
            >
              {/* Icon in soft circle */}
              <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-5">
                <MapPin className="h-6 w-6 text-rose-500" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                Enable Location
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px] mb-7">
                Allow Xplorism to use your location for <span className="font-semibold text-slate-700 dark:text-slate-200">real-time weather</span> at your current position.
              </p>

              {/* Side-by-side buttons */}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={handleSkipLocation}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.97]"
                >
                  Skip
                </button>
                <button
                  onClick={handleAllowLocation}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 border border-rose-500 cursor-pointer transition-all duration-150 hover:bg-rose-600 hover:border-rose-600 active:scale-[0.97]"
                >
                  Allow
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-[85vh] pb-24 space-y-6 sm:space-y-8">
        
        {/* Page Header (Consistent with all other pages) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pb-1 sm:pb-2 text-left">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
                <Sun className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-rose-500 uppercase tracking-widest">{t('climate_radar')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-1.5 sm:mb-2 text-slate-900 dark:text-white">
              {t('global_weather_forecast')}
            </h1>
            <p className="text-xs sm:text-sm md:text-base font-medium text-slate-500 dark:text-slate-400">
              {t('weather_desc')}
            </p>
          </div>
        </div>

        {/* Search widget */}
        <div className="w-full flex flex-col items-start space-y-4">
          <div className="w-full relative search-container">
            <div className="relative">
              <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5 sm:h-5 sm:w-5 pointer-events-none" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('search_city_placeholder')}
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl outline-none transition text-xs sm:text-sm shadow-sm border bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:border-rose-400 dark:focus:border-rose-500"
              />
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                          const geoResponse = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                          );
                          const geoData = await geoResponse.json();
                          const cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                          fetchWeatherForCity(cityName, latitude, longitude);
                        } catch (err) {
                          console.warn('Reverse geocoding failed:', err.message);
                          fetchWeatherForCity(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude);
                        }
                      },
                      (err) => {
                        console.warn('Geolocation access denied or failed. Falling back to Paris, France. Error:', err.message);
                        fetchWeatherForCity('Paris, France');
                      }
                    );
                  }
                }}
                className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                title="Use current location"
              >
                <MapPin className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </button>
            </div>

            {/* Auto-suggest dropdown */}
            <AnimatePresence>
              {showSuggestions && (suggestions.length > 0 || query.trim() === '') && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 z-40 max-h-52 overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800"
                >
                  {query.trim() === '' && (
                    <button
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const { latitude, longitude } = position.coords;
                              try {
                                const geoResponse = await fetch(
                                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                                );
                                const geoData = await geoResponse.json();
                                const cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                                fetchWeatherForCity(cityName, latitude, longitude);
                              } catch (err) {
                                console.warn('Reverse geocoding failed:', err.message);
                                fetchWeatherForCity(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude);
                              }
                            },
                            (err) => {
                              console.warn('Geolocation access denied or failed. Falling back to Paris, France. Error:', err.message);
                              fetchWeatherForCity('Paris, France');
                            }
                          );
                        }
                      }}
                      className="w-full text-left px-5 py-3.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition text-rose-500 text-xs flex items-center space-x-2 font-semibold"
                    >
                      <MapPin className="h-4 w-4 text-rose-500 shrink-0 animate-bounce-slow" />
                      <span>Use current location</span>
                    </button>
                  )}
                  {suggestions.map((item) => (
                    <button
                      key={item.place_id}
                      onClick={() => {
                        fetchWeatherForCity(item.display_name, item.lat, item.lon);
                      }}
                      className="w-full text-left px-5 py-3.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition text-slate-700 dark:text-slate-300 text-xs flex items-center space-x-2"
                    >
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span className="truncate font-semibold">{item.display_name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {error && (
          <div className="w-full p-4 rounded-2xl bg-red-50/90 dark:bg-red-950/40 backdrop-blur-sm border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm flex items-center space-x-2">
            <span>{error}</span>
          </div>
        )}

        {/* Forecast contents */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-10 w-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-sm animate-pulse font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('gathering_forecasts')}</p>
          </div>
        ) : weatherData ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full space-y-6 sm:space-y-8"
          >
            
            {/* Dynamic Weather Card matching current atmospheric conditions */}
            <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm flex flex-col md:flex-row items-center md:justify-between gap-6 sm:gap-8 relative overflow-hidden backdrop-blur-md ${getCardStyles()}`}>
              <div className="space-y-3 sm:space-y-4 text-center md:text-left z-10 w-full md:w-auto">
                <div className="flex items-center justify-center md:justify-start space-x-1.5 sm:space-x-2 text-rose-500">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 animate-bounce-slow" />
                  <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{selectedCity}</h2>
                </div>
                <div className="space-y-1">
                  <div className={`text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {Math.round(weatherData.current.temperature_2m)}°C
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2 pt-1">
                    <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${currentCondition.bg} ${currentCondition.color} border backdrop-blur-sm`}>
                      {t(currentCondition.labelKey) || currentCondition.label}
                    </span>
                  </div>
                </div>
              </div>
 
              {/* Climate stats list */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border shrink-0 w-full md:w-auto z-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-white/5 backdrop-blur-sm shadow-sm">
                <div className="flex flex-col items-center space-y-1.5 sm:space-y-2">
                  <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 animate-pulse" />
                  <div className="text-[8.5px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">{t('feels_like')}</div>
                  <div className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white">{Math.round(weatherData.current.apparent_temperature)}°C</div>
                </div>
                <div className="flex flex-col items-center space-y-1.5 sm:space-y-2">
                  <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-float" />
                  <div className="text-[8.5px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">{t('humidity_label')}</div>
                  <div className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white">{weatherData.current.relative_humidity_2m}%</div>
                </div>
                <div className="flex flex-col items-center space-y-1.5 sm:space-y-2">
                  <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 animate-float" style={{ animationDelay: '1s' }} />
                  <div className="text-[8.5px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">{t('wind_speed_label')}</div>
                  <div className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white">{weatherData.current.wind_speed_10m} km/h</div>
                </div>
              </div>

              {/* Decorative weather icon in background */}
              <CurrentIcon className={`absolute right-[-4%] bottom-[-8%] h-36 w-36 sm:h-44 sm:w-44 ${currentCondition.color} opacity-10 pointer-events-none animate-float`} />
            </div>

            {/* 7-Day Forecast Grid */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-xl font-bold flex items-center space-x-2 pl-1 text-slate-900 dark:text-white">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                <span>{t('extended_outlook')}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {weatherData.daily.time.map((dayTime, index) => {
                  const maxTemp = Math.round(weatherData.daily.temperature_2m_max[index]);
                  const minTemp = Math.round(weatherData.daily.temperature_2m_min[index]);
                  const code = weatherData.daily.weather_code[index];
                  const itemConfig = WEATHER_CODE_MAP[code] || getDefaultWeather();
                  const DayIcon = itemConfig.icon;

                  const dateObj = new Date(dayTime);
                  const isToday = index === 0;

                  return (
                    <motion.div 
                      key={dayTime}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white dark:bg-slate-800/80 hover:bg-slate-50/90 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer active:scale-95"
                    >
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                        {isToday ? t('today') : dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      
                      <div className={`my-3 p-2.5 rounded-full ${itemConfig.iconBg} ${itemConfig.color}`}>
                        <DayIcon className="h-6 w-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                      </div>

                      <div className="space-y-1 w-full">
                        <div className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-200">
                          {t(itemConfig.labelKey) || itemConfig.label}
                        </div>
                        <div className="flex justify-center space-x-1.5 text-xs font-extrabold pt-0.5">
                          <span className="text-slate-900 dark:text-white">{maxTemp}°</span>
                          <span className="text-slate-400 dark:text-slate-500 font-semibold">{minTemp}°</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        ) : (
          /* Premium Empty State with spinning wireframe Globe */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border p-12 sm:p-16 rounded-3xl text-center w-full shadow-sm flex flex-col items-center justify-center backdrop-blur-md bg-white/70 border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 min-h-[340px]"
          >
            <GlobeAnimation />
            <h3 className="text-xl sm:text-2xl font-extrabold mt-6 text-slate-900 dark:text-white">{t('discover_climates')}</h3>
            <p className="text-xs sm:text-sm mt-2 max-w-md leading-relaxed text-slate-500 dark:text-slate-300">
              {t('discover_climates_desc')}
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
