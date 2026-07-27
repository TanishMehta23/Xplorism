import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Cloud, CloudRain, Snowflake, Wind, ArrowLeft, 
  MapPin, Droplets, Thermometer, Sparkles, Search, Compass,
  Calendar, CloudLightning, CloudDrizzle, CloudFog
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// WMO Weather Codes mapping to Icons, Descriptions, and dynamic theme colors
const WEATHER_CODE_MAP = {
  0: { label: 'Clear Sky', icon: Sun, bg: 'bg-amber-50/70 border-amber-100', color: 'text-amber-500', iconBg: 'bg-amber-100/50' },
  1: { label: 'Mainly Clear', icon: Sun, bg: 'bg-yellow-50/70 border-yellow-100', color: 'text-yellow-500', iconBg: 'bg-yellow-100/50' },
  2: { label: 'Partly Cloudy', icon: Cloud, bg: 'bg-sky-50/70 border-sky-100', color: 'text-sky-500', iconBg: 'bg-sky-100/50' },
  3: { label: 'Overcast', icon: Cloud, bg: 'bg-slate-100/70 border-slate-200', color: 'text-slate-500', iconBg: 'bg-slate-200/50' },
  45: { label: 'Foggy', icon: CloudFog, bg: 'bg-zinc-100/70 border-zinc-200', color: 'text-zinc-500', iconBg: 'bg-zinc-200/50' },
  48: { label: 'Depositing Rime Fog', icon: CloudFog, bg: 'bg-zinc-100/70 border-zinc-250', color: 'text-zinc-650', iconBg: 'bg-zinc-200/50' },
  51: { label: 'Light Drizzle', icon: CloudDrizzle, bg: 'bg-cyan-50/70 border-cyan-100', color: 'text-cyan-500', iconBg: 'bg-cyan-100/50' },
  53: { label: 'Moderate Drizzle', icon: CloudDrizzle, bg: 'bg-cyan-50/70 border-cyan-200', color: 'text-cyan-600', iconBg: 'bg-cyan-100/50' },
  55: { label: 'Dense Drizzle', icon: CloudDrizzle, bg: 'bg-cyan-100/70 border-cyan-250', color: 'text-cyan-700', iconBg: 'bg-cyan-200/50' },
  61: { label: 'Slight Rain', icon: CloudRain, bg: 'bg-blue-50/70 border-blue-100', color: 'text-blue-500', iconBg: 'bg-blue-100/50' },
  63: { label: 'Moderate Rain', icon: CloudRain, bg: 'bg-blue-50/70 border-blue-200', color: 'text-blue-600', iconBg: 'bg-blue-100/50' },
  65: { label: 'Heavy Rain', icon: CloudRain, bg: 'bg-blue-100/70 border-blue-250', color: 'text-blue-700', iconBg: 'bg-blue-200/50' },
  71: { label: 'Slight Snowfall', icon: Snowflake, bg: 'bg-indigo-50/50 border-indigo-100', color: 'text-indigo-400', iconBg: 'bg-indigo-100/30' },
  73: { label: 'Moderate Snowfall', icon: Snowflake, bg: 'bg-indigo-50/60 border-indigo-200', color: 'text-indigo-500', iconBg: 'bg-indigo-100/40' },
  75: { label: 'Heavy Snowfall', icon: Snowflake, bg: 'bg-indigo-100/70 border-indigo-250', color: 'text-indigo-650', iconBg: 'bg-indigo-200/50' },
  80: { label: 'Slight Rain Showers', icon: CloudRain, bg: 'bg-cyan-50/70 border-cyan-100', color: 'text-cyan-600', iconBg: 'bg-cyan-100/50' },
  81: { label: 'Moderate Rain Showers', icon: CloudRain, bg: 'bg-cyan-50/70 border-cyan-200', color: 'text-cyan-700', iconBg: 'bg-cyan-100/50' },
  82: { label: 'Violent Rain Showers', icon: CloudRain, bg: 'bg-blue-100/80 border-blue-300', color: 'text-blue-800', iconBg: 'bg-blue-200/50' },
  95: { label: 'Thunderstorm', icon: CloudLightning, bg: 'bg-purple-50/70 border-purple-100', color: 'text-purple-650', iconBg: 'bg-purple-100/50' },
  96: { label: 'Thunderstorm with Hail', icon: CloudLightning, bg: 'bg-purple-100/70 border-purple-200', color: 'text-purple-750', iconBg: 'bg-purple-200/50' },
  99: { label: 'Heavy Thunderstorm', icon: CloudLightning, bg: 'bg-violet-100/80 border-violet-250', color: 'text-violet-800', iconBg: 'bg-violet-200/50' }
};

const getDefaultWeather = () => ({
  label: 'Unknown',
  icon: Cloud,
  bg: 'bg-slate-50 border-slate-105',
  color: 'text-slate-500',
  iconBg: 'bg-slate-100'
});

export default function WeatherPage() {
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">

      <Navbar activeTab="weather" />

      {/* Main Layout container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-start space-y-10">
        
        {/* Page Title & Search bar */}
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center space-x-2.5">
              <Compass className="h-8 w-8 text-rose-500" />
              <span>Global Weather Forecast</span>
            </h1>
            <p className="text-slate-500 text-sm font-semibold">Check real-time climates before booking your next journey.</p>
          </div>

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
                placeholder="Search city, e.g. New York, London, Tokyo..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 focus:border-rose-400 rounded-full outline-none text-slate-800 transition text-sm shadow-sm"
              />
            </div>

            {/* Auto-suggest dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 z-40 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100">
                {suggestions.map((item) => (
                  <button
                    key={item.place_id}
                    onClick={() => {
                      fetchWeatherForCity(item.display_name, item.lat, item.lon);
                    }}
                    className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition text-slate-650 text-xs flex items-center space-x-2"
                  >
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="w-full max-w-lg p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
            <span>{error}</span>
          </div>
        )}

        {/* Forecast contents */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-slate-550 text-sm animate-pulse font-semibold">Gathering local atmospheric forecasts...</p>
          </div>
        ) : weatherData ? (
          <div className="w-full space-y-8">
            
            {/* White Weather Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center md:justify-between gap-8 relative overflow-hidden">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2 text-rose-500">
                  <MapPin className="h-5 w-5" />
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">{selectedCity}</h2>
                </div>
                <div className="space-y-1">
                  <div className="text-6xl md:text-7xl font-extrabold tracking-tighter text-slate-900">
                    {Math.round(weatherData.current.temperature_2m)}°C
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentCondition.bg} ${currentCondition.color} border`}>
                      {currentCondition.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Climate stats list */}
              <div className="grid grid-cols-3 gap-6 md:gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 shrink-0 w-full md:w-auto">
                <div className="flex flex-col items-center space-y-2">
                  <Thermometer className="h-5 w-5 text-rose-450" />
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Feels Like</div>
                  <div className="font-extrabold text-slate-800 text-sm">{Math.round(weatherData.current.apparent_temperature)}°C</div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Humidity</div>
                  <div className="font-extrabold text-slate-800 text-sm">{weatherData.current.relative_humidity_2m}%</div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Wind className="h-5 w-5 text-teal-500" />
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Wind Speed</div>
                  <div className="font-extrabold text-slate-800 text-sm">{weatherData.current.wind_speed_10m} km/h</div>
                </div>
              </div>

              {/* Decorative weather icon in background */}
              <CurrentIcon className={`absolute right-[-4%] bottom-[-8%] h-44 w-44 ${currentCondition.color} opacity-5 pointer-events-none`} />
            </div>

            {/* 7-Day Forecast Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 pl-1">
                <Calendar className="h-4.5 w-4.5 text-rose-500" />
                <span>Extended 7-Day Outlook</span>
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
                    <div 
                      key={dayTime}
                      className="bg-white hover:bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all duration-200 shadow-sm group cursor-pointer"
                    >
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        {isToday ? 'Today' : dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      
                      <div className={`my-3 p-2.5 rounded-full ${itemConfig.iconBg} ${itemConfig.color}`}>
                        <DayIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-650 truncate w-24">
                          {itemConfig.label}
                        </div>
                        <div className="flex justify-center space-x-1.5 text-xs font-extrabold pt-0.5">
                          <span className="text-slate-800">{maxTemp}°</span>
                          <span className="text-slate-400">{minTemp}°</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-100 p-12 rounded-3xl text-center w-full max-w-lg shadow-sm flex flex-col items-center">
            <Compass className="h-10 w-10 text-slate-350 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No Forecast Loaded</h3>
            <p className="text-slate-500 text-xs mt-2">Enter a destination above to display its global weather stats.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-slate-100 text-slate-400 text-xs bg-white font-medium">
        <span>© {new Date().getFullYear()} Xplorism. Climate data powered by Open-Meteo.</span>
      </footer>
    </div>
  );
}
