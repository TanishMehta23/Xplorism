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

  // Request location permission on mount to show local weather, with Paris as a fallback
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherForCity('Your Location', latitude, longitude);
        },
        (err) => {
          console.warn('Geolocation access denied or failed. Falling back to Paris, France. Error:', err.message);
          fetchWeatherForCity('Paris, France');
        }
      );
    } else {
      fetchWeatherForCity('Paris, France');
    }
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await api.get(`/geocode?q=${encodeURIComponent(query)}`);
        if (data && data.length > 0) {
          setSuggestions(data.slice(0, 6));
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
        // Resolve city name to coordinates
        const geoData = await api.get(`/geocode?q=${encodeURIComponent(cityName)}`);
        if (!geoData || geoData.length === 0) {
          throw new Error('City location details could not be resolved.');
        }
        lat = parseFloat(geoData[0].lat);
        lon = parseFloat(geoData[0].lon);
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
        return 'from-amber-400/90 via-orange-200/70 to-sky-200/60';
      case 'rainy':
        return 'from-blue-950 via-slate-900 to-indigo-950';
      case 'snowy':
        return 'from-sky-300/80 via-indigo-100 to-slate-200';
      case 'thunder':
        return 'from-purple-950 via-slate-900/95 to-violet-950';
      case 'overcast':
      case 'foggy':
      default:
        return 'from-slate-400/80 via-slate-200/60 to-blue-100/50';
    }
  };

  // Helper to generate dynamic atmospheric particles (rain, snow, rays, clouds)
  const renderAtmosphereParticles = () => {
    if (weatherTheme === 'rainy') {
      return Array.from({ length: 40 }).map((_, i) => (
        <span 
          key={i} 
          className="absolute bg-sky-200/40 w-[1.5px] h-[35px] rounded-full animate-rain pointer-events-none"
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
          className="absolute bg-white rounded-full animate-snow pointer-events-none"
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
        <div className="absolute inset-0 bg-radial-sun opacity-30 animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />
      );
    }
    if (weatherTheme === 'thunder') {
      return (
        <div className="absolute inset-0 bg-white/0 animate-lightning pointer-events-none" />
      );
    }
    return null;
  };

  const isDarkTheme = ['rainy', 'thunder'].includes(weatherTheme);

  const getCardStyles = () => {
    switch (weatherTheme) {
      case 'sunny':
        return isDarkTheme
          ? 'bg-gradient-to-br from-amber-950/70 to-yellow-900/50 border-amber-500/30 text-white'
          : 'bg-gradient-to-br from-amber-100/90 via-orange-50/80 to-sky-50/70 border-amber-300/50 text-slate-900';
      case 'cloudy':
      case 'overcast':
      case 'foggy':
        return isDarkTheme
          ? 'bg-gradient-to-br from-slate-900/80 to-zinc-900/60 border-slate-700/40 text-white'
          : 'bg-gradient-to-br from-slate-200/95 via-slate-100/90 to-blue-50/80 border-slate-300 text-slate-900 shadow-inner';
      case 'rainy':
      case 'thunder':
        return isDarkTheme
          ? 'bg-gradient-to-br from-blue-950/85 to-purple-950/60 border-blue-800/40 text-white'
          : 'bg-gradient-to-br from-blue-100/90 via-sky-100/80 to-indigo-50/70 border-blue-200/50 text-slate-900';
      case 'snowy':
        return isDarkTheme
          ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900/40 border-indigo-500/30 text-white'
          : 'bg-gradient-to-br from-blue-50/95 via-indigo-50/80 to-slate-50/70 border-indigo-200/50 text-slate-900';
      default:
        return isDarkTheme
          ? 'bg-slate-900/60 border-white/10 text-white'
          : 'bg-white/80 border-white/40 text-slate-800';
    }
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'text-white' : 'text-slate-800'} flex flex-col font-sans transition-colors duration-500 relative overflow-hidden`}>
      
      {/* Dynamic Animated Atmospheric Background */}
      <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${getThemeBackground()} transition-all duration-700`} />
      
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

      {/* Main Layout container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-start space-y-8">
        
        {/* Page Header (Centered title with absolutely positioned back button on desktop) */}
        <div className="w-full relative flex flex-col items-center justify-center text-center">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center justify-center space-x-2.5"
            >
              <Compass className="h-7 w-7 text-rose-500 animate-spin-slow shrink-0" />
              <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{t('global_weather_forecast')}</span>
            </motion.h1>
            <p className={isDarkTheme ? 'text-slate-300 text-sm font-semibold' : 'text-slate-500 text-sm font-semibold'}>
              {t('weather_desc')}
            </p>
          </div>
          
          <div className="md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 mt-4 md:mt-0">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl border active:scale-95 transition-all select-none cursor-pointer shrink-0 ${
                isDarkTheme 
                  ? 'bg-slate-900/40 border-white/10 hover:bg-slate-900/60 text-white' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('back_to_dashboard')}</span>
            </button>
          </div>
        </div>

        {/* Search widget wrapper */}
        <div className="w-full flex flex-col items-center space-y-6">

          {/* Search bar widget */}
          <div className="w-full max-w-lg relative search-container">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('search_city_placeholder')}
                className={`w-full pl-12 pr-4 py-3.5 rounded-full outline-none transition text-sm shadow-md ${isDarkTheme ? 'bg-slate-900/80 border-slate-700/80 text-white focus:border-rose-500' : 'bg-white border-slate-200 text-slate-800 focus:border-rose-400'}`}
              />
            </div>

            {/* Auto-suggest dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 z-40 max-h-52 overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100"
                >
                  {suggestions.map((item) => (
                    <button
                      key={item.place_id}
                      onClick={() => {
                        fetchWeatherForCity(item.display_name, item.lat, item.lon);
                      }}
                      className="w-full text-left px-5 py-3.5 hover:bg-slate-100/50 transition text-slate-700 text-xs flex items-center space-x-2"
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
          <div className="w-full max-w-lg p-4 rounded-2xl bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 text-sm flex items-center space-x-2">
            <span>{error}</span>
          </div>
        )}

        {/* Forecast contents */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
            <div className={`h-10 w-10 border-4 border-slate-300 border-t-rose-500 rounded-full animate-spin`} />
            <p className={`text-sm animate-pulse font-semibold ${isDarkTheme ? 'text-slate-300' : 'text-slate-650'}`}>{t('gathering_forecasts')}</p>
          </div>
        ) : weatherData ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full space-y-8"
          >
            
            {/* Dynamic Weather Card matching current atmospheric conditions */}
            <div className={`border rounded-3xl p-8 shadow-lg flex flex-col md:flex-row items-center md:justify-between gap-8 relative overflow-hidden backdrop-blur-md ${getCardStyles()}`}>
              <div className="space-y-4 text-center md:text-left z-10">
                <div className="flex items-center justify-center md:justify-start space-x-2 text-rose-500">
                  <MapPin className="h-5 w-5 animate-bounce-slow" />
                  <h2 className={`text-lg font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{selectedCity}</h2>
                </div>
                <div className="space-y-1">
                  <div className={`text-6xl md:text-7xl font-extrabold tracking-tighter ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {Math.round(weatherData.current.temperature_2m)}°C
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentCondition.bg} ${currentCondition.color} border backdrop-blur-sm`}>
                      {t(currentCondition.labelKey) || currentCondition.label}
                    </span>
                  </div>
                </div>
              </div>
 
              {/* Climate stats list */}
              <div className={`grid grid-cols-3 gap-6 md:gap-8 p-6 rounded-2xl border shrink-0 w-full md:w-auto z-10 ${isDarkTheme ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50/50 border-slate-200/40'}`}>
                <div className="flex flex-col items-center space-y-2">
                  <Thermometer className="h-5 w-5 text-rose-500 animate-pulse" />
                  <div className={`text-[10px] uppercase font-bold tracking-wider ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>{t('feels_like')}</div>
                  <div className="font-extrabold text-sm">{Math.round(weatherData.current.apparent_temperature)}°C</div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Droplets className="h-5 w-5 text-blue-400 animate-float" />
                  <div className={`text-[10px] uppercase font-bold tracking-wider ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>{t('humidity_label')}</div>
                  <div className="font-extrabold text-sm">{weatherData.current.relative_humidity_2m}%</div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Wind className="h-5 w-5 text-teal-400 animate-float" style={{ animationDelay: '1s' }} />
                  <div className={`text-[10px] uppercase font-bold tracking-wider ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>{t('wind_speed_label')}</div>
                  <div className="font-extrabold text-sm">{weatherData.current.wind_speed_10m} km/h</div>
                </div>
              </div>

              {/* Decorative weather icon in background */}
              <CurrentIcon className={`absolute right-[-4%] bottom-[-8%] h-44 w-44 ${currentCondition.color} opacity-10 pointer-events-none animate-float`} />
            </div>

            {/* 7-Day Forecast Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center space-x-2 pl-1">
                <Calendar className="h-4.5 w-4.5 text-rose-500" />
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
                      className={`border rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all duration-300 shadow-md group cursor-pointer active:scale-95 ${isDarkTheme ? 'bg-slate-900/40 hover:bg-slate-900/60 border-white/5' : 'bg-white/50 hover:bg-white/80 border-white/30'}`}
                    >
                      <span className={`text-[10px] font-bold tracking-wider uppercase ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>
                        {isToday ? t('today') : dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      
                      <div className={`my-3 p-2.5 rounded-full ${itemConfig.iconBg} ${itemConfig.color}`}>
                        <DayIcon className="h-6 w-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                      </div>

                      <div className="space-y-1">
                        <div className={`text-[10px] font-bold truncate w-24 ${isDarkTheme ? 'text-slate-200' : 'text-slate-650'}`}>
                          {t(itemConfig.labelKey) || itemConfig.label}
                        </div>
                        <div className="flex justify-center space-x-1.5 text-xs font-extrabold pt-0.5">
                          <span>{maxTemp}°</span>
                          <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-400'}>{minTemp}°</span>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`border p-12 rounded-3xl text-center w-full max-w-lg shadow-lg flex flex-col items-center backdrop-blur-md ${isDarkTheme ? 'bg-slate-900/60 border-white/10' : 'bg-white/85 border-white/30'}`}
          >
            <GlobeAnimation />
            <h3 className={`text-xl font-extrabold mt-6 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{t('discover_climates')}</h3>
            <p className={`text-xs mt-2 max-w-xs leading-relaxed ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>
              {t('discover_climates_desc')}
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className={`w-full text-center py-6 border-t text-xs font-medium ${isDarkTheme ? 'bg-slate-950/80 border-white/5 text-slate-400' : 'bg-white/85 border-slate-100 text-slate-450'}`}>
        <span>© {new Date().getFullYear()} Xplorism. {t('powered_by')}</span>
      </footer>
    </div>
  );
}
