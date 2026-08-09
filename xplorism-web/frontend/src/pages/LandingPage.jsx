import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Compass, Zap, MapPin, CloudRain, Star, Plus, Calendar, DollarSign, Users, Navigation, ArrowRight, Locate, Wallet, FolderLock, MessageSquare, Sun, Moon, Globe, Building, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const destinations = [
  {
    id: 'tokyo',
    name: 'Tokyo, Japan',
    x: '75%',
    y: '30%',
    budget: 'Moderate - High',
    style: 'Urban Adventure',
    activities: ['Shibuya Crossing Explorer', 'Senso-ji Ancient Temple', 'Tsukiji Sushi Tasting'],
    color: 'bg-rose-500 text-rose-500',
    borderColor: 'border-rose-500',
    description: 'Explore the neon-lit streets, historic shrines, and world-class culinary wonders of Japan\'s captivating capital.'
  },
  {
    id: 'paris',
    name: 'Paris, France',
    x: '46%',
    y: '22%',
    budget: 'Moderate',
    style: 'Romantic & Art Tour',
    activities: ['Eiffel Tower Summit access', 'Louvre Museum Masterpieces', 'Seine Cruise by Sunset'],
    color: 'bg-amber-500 text-amber-500',
    borderColor: 'border-amber-500',
    description: 'Stroll along historical boulevards, enjoy premium pastries, and soak in iconic architecture and world-class museums.'
  },
  {
    id: 'newyork',
    name: 'New York City, USA',
    x: '22%',
    y: '28%',
    budget: 'High',
    style: 'Fast-Paced Explorer',
    activities: ['Central Park Bike Ride', 'Broadway Show Experience', 'Summit One Vanderbilt View'],
    color: 'bg-emerald-500 text-emerald-500',
    borderColor: 'border-emerald-500',
    description: 'Experience the electric energy of Times Square, local Chelsea food hubs, and stunning observation decks.'
  },
  {
    id: 'sydney',
    name: 'Sydney, Australia',
    x: '82%',
    y: '75%',
    budget: 'Moderate',
    style: 'Coastal & Leisure',
    activities: ['Opera House Architectural Tour', 'Bondi Beach Surf Experience', 'BridgeClimb Harbour Adventure'],
    color: 'bg-blue-500 text-blue-500',
    borderColor: 'border-blue-500',
    description: 'Soak in the sun-drenched beaches, scenic harbourside walking paths, and thriving coastal culinary scenes.'
  },
  {
    id: 'cairo',
    name: 'Cairo, Egypt',
    x: '52%',
    y: '42%',
    budget: 'Budget-Friendly',
    style: 'Ancient Civilizations',
    activities: ['Great Pyramids of Giza', 'Grand Egyptian Museum', 'Khan el-Khalili Bazaar Tour'],
    color: 'bg-purple-500 text-purple-500',
    borderColor: 'border-purple-500',
    description: 'Dive deep into thousands of years of history with the Sphinx monument, ancient treasures, and bustling local markets.'
  }
];

// Helper to query Overpass API with sequential mirrors (proxied via backend to avoid CORS)
const fetchOverpassWithFallback = async (queryPart) => {
  try {
    const data = await api.get(`/overpass?data=${encodeURIComponent(queryPart)}`);
    return data;
  } catch (err) {
    console.warn('Backend Overpass proxy failed, trying client-side fallback...');
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.ru/cgi/interpreter'
    ];

    for (const endpoint of endpoints) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout

      try {
        const url = `${endpoint}?data=${encodeURIComponent(queryPart)}`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          return data;
        }
        console.warn(`Overpass endpoint ${endpoint} returned status ${res.status}`);
      } catch (e) {
        clearTimeout(timeoutId);
        console.warn(`Failed to fetch from Overpass endpoint ${endpoint}:`, e);
      }
    }
  }
  throw new Error('All Overpass API endpoints failed or timed out.');
};

// Fallback high-speed geosearch query using Wikipedia's ultra-reliable global API
const fetchWikipediaAttractions = async (lat, lon) => {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=5000&gscoord=${lat}|${lon}&gslimit=10&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.query && data.query.geosearch) {
      return data.query.geosearch.map(item => ({
        id: item.pageid.toString(),
        name: item.title,
        lat: item.lat,
        lon: item.lon,
        type: 'Historic Landmark',
        description: `A notable location cataloged on Wikipedia. Explore articles, history, and records associated with this local landmark.`
      }));
    }
    return [];
  } catch (err) {
    console.error('Wikipedia fallback failed:', err);
    return [];
  }
};

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isLangOpen, setIsLangOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.lang-selector-container')) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Leaflet Map States & Refs
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('Paris');
  const [mapLoading, setMapLoading] = useState(false);
  const [touristPlaces, setTouristPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Nearby amenities state
  const [nearbyAmenities, setNearbyAmenities] = useState([]);
  const [loadingAmenities, setLoadingAmenities] = useState(false);

  // Autocomplete search suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced effect for suggestions autocomplete
  useEffect(() => {
    if (mapSearchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=5`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await res.json();
        if (data) {
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [mapSearchQuery]);

  // Fetch nearby amenities (food, drinks, parks) in 1km radius of selected attraction
  const fetchNearbyAmenities = async (lat, lon) => {
    setLoadingAmenities(true);
    try {
      const query = `[out:json][timeout:15];(nwr["amenity"~"restaurant|cafe|fast_food|bar"](around:1000,${lat},${lon});nwr["leisure"="park"](around:1000,${lat},${lon}););out center;`;
      const data = await fetchOverpassWithFallback(query);

      if (data && data.elements) {
        const amenities = data.elements
          .filter(el => el.tags && el.tags.name)
          .map(el => ({
            id: el.id.toString(),
            name: el.tags.name,
            type: el.tags.amenity || el.tags.leisure || 'Place',
            lat: el.lat || (el.center && el.center.lat),
            lon: el.lon || (el.center && el.center.lon)
          }))
          .filter(amenity => amenity.lat && amenity.lon)
          .slice(0, 5); // Limit to top 5 amenities

        setNearbyAmenities(amenities);
      } else {
        setNearbyAmenities([]);
      }
    } catch (err) {
      console.error('Error fetching amenities:', err);
      setNearbyAmenities([]);
    } finally {
      setLoadingAmenities(false);
    }
  };

  // Trigger amenities fetch when selectedPlace changes
  useEffect(() => {
    if (selectedPlace) {
      fetchNearbyAmenities(selectedPlace.lat, selectedPlace.lon);
    } else {
      setNearbyAmenities([]);
    }
  }, [selectedPlace]);

  // Geolocation trigger
  const handleGeolocationSearch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setMapLoading(true);
    setTouristPlaces([]);
    setSelectedPlace(null);
    setNearbyAmenities([]);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        // Reverse geocode to find city/area name using free Nominatim API
        const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`;
        const res = await fetch(revUrl, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await res.json();

        // Extract city/town/village
        const locationName = data.address.city || data.address.town || data.address.village || data.address.suburb || 'My Location';
        setMapSearchQuery(locationName);

        // Initialize map at user coordinates
        initMap(latitude, longitude, 13);

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add user central marker
        if (mapRef.current) {
          const userMarker = window.L.marker([latitude, longitude])
            .addTo(mapRef.current)
            .bindPopup(`<b>Your Location:</b> ${locationName}`)
            .openPopup();

          markersRef.current.push(userMarker);
        }

        // Fetch nearby tourist sites
        let places = [];
        try {
          const query = `[out:json][timeout:25];(nwr["tourism"~"attraction|museum|gallery|theme_park|viewpoint|zoo|picnic_site|aquarium|artwork"](around:3000,${latitude},${longitude});nwr["historic"~"monument|castle|ruins|memorial|archaeological_site|tomb"](around:3000,${latitude},${longitude});nwr["amenity"="place_of_worship"](around:3000,${latitude},${longitude});nwr["natural"~"waterfall|beach|peak"](around:3000,${latitude},${longitude});nwr["leisure"~"park|garden"](around:3000,${latitude},${longitude}););out center;`;
          const overpassData = await fetchOverpassWithFallback(query);

          if (overpassData && overpassData.elements) {
            places = overpassData.elements
              .filter(el => el.tags && (el.tags.name || el.tags.tourism || el.tags.amenity || el.tags.historic || el.tags.natural || el.tags.leisure))
              .map(el => {
                let priority = 2;
                if (el.tags.tourism || el.tags.historic || el.tags.natural || el.tags.leisure) {
                  priority = 1; // Prioritize actual attractions/parks over local worship centers
                }
                return {
                  id: el.id.toString(),
                  name: el.tags.name || el.tags.tourism || el.tags.amenity || el.tags.historic || el.tags.natural || el.tags.leisure || 'Tourist Place',
                  lat: el.lat || (el.center && el.center.lat),
                  lon: el.lon || (el.center && el.center.lon),
                  type: el.tags.tourism || el.tags.historic || el.tags.amenity || el.tags.natural || el.tags.leisure || 'Attraction',
                  description: el.tags.description || el.tags.wikipedia || `A local ${el.tags.tourism || el.tags.amenity || el.tags.natural || el.tags.leisure || 'attraction'} to visit.`,
                  priority
                };
              })
              .filter(place => place.lat && place.lon) // Filter out items with missing coordinates
              .sort((a, b) => a.priority - b.priority)
              .slice(0, 10);
          }
        } catch (err) {
          console.warn('Overpass failed, falling back to Wikipedia Geosearch:', err);
          places = await fetchWikipediaAttractions(latitude, longitude);
        }

        setTouristPlaces(places);

        places.forEach(place => {
          if (mapRef.current) {
            const marker = window.L.marker([place.lat, place.lon])
              .addTo(mapRef.current)
              .bindPopup(`<b>${place.name}</b><br/>Type: ${place.type.replace('_', ' ')}`);

            marker.on('click', () => {
              setSelectedPlace(place);
            });

            markersRef.current.push(marker);
          }
        });

        if (places.length > 0) {
          setSelectedPlace(places[0]);
        } else {
          setSelectedPlace(null);
        }
      } catch (err) {
        console.error('Error reverse geocoding coordinates:', err);
      } finally {
        setMapLoading(false);
      }
    }, (err) => {
      console.error('Geolocation error:', err);
      alert('Unable to retrieve your location. Make sure GPS permission is granted.');
      setMapLoading(false);
    });
  };

  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const initMap = (lat, lon, zoom = 13) => {
    if (!window.L) return;

    if (mapRef.current) {
      mapRef.current.setView([lat, lon], zoom);
      return;
    }

    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement) return;

    mapRef.current = window.L.map('leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([lat, lon], zoom);

    window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps'
    }).addTo(mapRef.current);
  };

  const handleMapSearch = async (e) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim() || !window.L) return;

    setMapLoading(true);
    setTouristPlaces([]);
    setSelectedPlace(null);
    setNearbyAmenities([]);
    try {
      // 1. Geocode search query using free Nominatim API
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=1`;
      const geoRes = await fetch(geoUrl, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        alert('Location not found. Please try another query.');
        setMapLoading(false);
        return;
      }

      const { lat, lon } = geoData[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      // Initialize map at coordinates
      initMap(latitude, longitude, 13);

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add central marker for the searched location
      if (mapRef.current) {
        const centerMarker = window.L.marker([latitude, longitude])
          .addTo(mapRef.current)
          .bindPopup(`<b>Center:</b> ${mapSearchQuery}`)
          .openPopup();

        markersRef.current.push(centerMarker);
      }

      // 2. Fetch tourist places in 3000m radius using Overpass API
      let places = [];
      try {
        const query = `[out:json][timeout:25];(nwr["tourism"~"attraction|museum|gallery|theme_park|viewpoint|zoo|picnic_site|aquarium|artwork"](around:3000,${latitude},${longitude});nwr["historic"~"monument|castle|ruins|memorial|archaeological_site|tomb"](around:3000,${latitude},${longitude});nwr["amenity"="place_of_worship"](around:3000,${latitude},${longitude});nwr["natural"~"waterfall|beach|peak"](around:3000,${latitude},${longitude});nwr["leisure"~"park|garden"](around:3000,${latitude},${longitude}););out center;`;
        const overpassData = await fetchOverpassWithFallback(query);

        if (overpassData && overpassData.elements) {
          places = overpassData.elements
            .filter(el => el.tags && (el.tags.name || el.tags.tourism || el.tags.amenity || el.tags.historic || el.tags.natural || el.tags.leisure))
            .map(el => {
              let priority = 2;
              if (el.tags.tourism || el.tags.historic || el.tags.natural || el.tags.leisure) {
                priority = 1;
              }
              return {
                id: el.id.toString(),
                name: el.tags.name || el.tags.tourism || el.tags.amenity || el.tags.historic || el.tags.natural || el.tags.leisure || 'Tourist Place',
                lat: el.lat || (el.center && el.center.lat),
                lon: el.lon || (el.center && el.center.lon),
                type: el.tags.tourism || el.tags.historic || el.tags.amenity || el.tags.natural || el.tags.leisure || 'Attraction',
                description: el.tags.description || el.tags.wikipedia || `A local ${el.tags.tourism || el.tags.amenity || el.tags.natural || el.tags.leisure || 'attraction'} to visit.`,
                priority
              };
            })
            .filter(place => place.lat && place.lon) // Filter out items with missing coordinates
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 10); // Top 10 attractions
        }
      } catch (err) {
        console.warn('Overpass failed, falling back to Wikipedia Geosearch:', err);
        places = await fetchWikipediaAttractions(latitude, longitude);
      }

      setTouristPlaces(places);

      // Add markers for tourist places
      places.forEach(place => {
        if (mapRef.current) {
          const marker = window.L.marker([place.lat, place.lon])
            .addTo(mapRef.current)
            .bindPopup(`<b>${place.name}</b><br/>Type: ${place.type.replace('_', ' ')}`);

          marker.on('click', () => {
            setSelectedPlace(place);
          });

          markersRef.current.push(marker);
        }
      });
      if (places.length > 0) {
        setSelectedPlace(places[0]);
      } else {
        setSelectedPlace(null);
      }
    } catch (err) {
      console.error('Error fetching map details:', err);
    } finally {
      setMapLoading(false);
    }
  };

  useEffect(() => {
    if (leafletLoaded) {
      // Trigger default search on mount
      handleMapSearch();
    }
  }, [leafletLoaded]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [touristPlaces]);

  const { scrollY } = useScroll();

  // Maps scroll positions from 0px (top of page) to 400px down.
  // Closed lid is flat (-90deg), fully open lid is perfectly upright (0deg) to eliminate trapezoidal skew.
  const rotateX = useTransform(scrollY, [0, 400], [-90, 0], { clamp: true });
  const scale = useTransform(scrollY, [0, 400], [0.8, 1.0], { clamp: true });

  // Open modal if redirected with state
  useEffect(() => {
    if (location.state?.openAuth) {
      setAuthModalMode(location.state.mode || 'login');
      setIsAuthModalOpen(true);
      // Clear the history state so it does not trigger again on manual page reloads
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120 },
    },
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-rose-100 selection:text-rose-600 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-800'}`}>

      {/* Navigation */}
      <nav className={`max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b flex-nowrap ${isDark ? 'border-slate-900' : 'border-slate-100'}`}>
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <img
            src="/logo.png"
            alt="Xplorism Logo"
            className="h-10 sm:h-14 w-10 sm:w-14 object-contain rounded-full shadow-sm"
          />
          <span className={`font-extrabold tracking-tight text-lg sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Xplorism
          </span>
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          {/* Language Selector */}
          <div className="relative lang-selector-container">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className={`p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-semibold cursor-pointer transition ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-950'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{language}</span>
            </button>
            <div className={`absolute right-0 mt-2 w-32 rounded-2xl shadow-xl border p-1.5 z-50 transition-all ${
              isLangOpen ? 'block' : 'hidden'
            } ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-700'
            }`}>
              {[
                { code: 'en', label: 'English' },
                { code: 'es', label: 'Español' },
                { code: 'fr', label: 'Français' },
                { code: 'de', label: 'Deutsch' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'ar', label: 'العربية' },
                { code: 'pt', label: 'Português' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    language === lang.code
                      ? 'bg-rose-500 text-white'
                      : isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border cursor-pointer transition ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-950'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                isDark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {t('go_to_dashboard')}
            </Link>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-3">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className={`px-2 sm:px-4 py-2 font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isDark ? 'text-slate-450 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('sign_in')}
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('register');
                  setIsAuthModalOpen(true);
                }}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isDark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {t('sign_up')}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight"
        >
          <span className="text-[#f87171]">
            {language === 'es' ? 'Descubre tu próxima aventura:' : language === 'fr' ? 'Découvrez votre prochaine aventure :' : language === 'de' ? 'Entdecke dein nächstes Abenteuer:' : language === 'hi' ? 'अपने अगले साहसिक कार्य की खोज करें:' : language === 'ar' ? 'اكتشف مغامرتك القادمة:' : language === 'pt' ? 'Descubra sua próxima aventura:' : 'Discover Your Next Adventure:'}
          </span>
          <br />
          <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {language === 'es' ? ' Itinerarios personalizados al alcance de tu mano' : language === 'fr' ? ' Des itinéraires personnalisés à portée de main' : language === 'de' ? ' Personalisierte Reiserouten auf Knopfdruck' : language === 'hi' ? ' अपनी उंगलियों पर व्यक्तिगत यात्रा कार्यक्रम' : language === 'ar' ? ' مسارات رحلات مخصصة في متناول يدك' : language === 'pt' ? ' Roteiros personalizados ao seu alcance' : ' Personalized Itineraries at Your Fingertips'}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={`text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
        >
          {language === 'es' ? 'Tu planificador de viajes personal y curador de viajes, creando itinerarios personalizados adaptados a tus intereses y presupuesto.' : language === 'fr' ? 'Votre planificateur de voyage personnel et conservateur de voyage, créant des itinéraires personnalisés adaptés à vos intérêts et à votre budget.' : language === 'de' ? 'Ihr persönlicher Reiseplaner und Reisekurator, der personalisierte Reiserouten erstellt, die auf Ihre Interessen und Ihr Budget zugeschnitten sind.' : language === 'hi' ? 'आपका व्यक्तिगत यात्रा योजनाकार और यात्रा क्यूरेटर, आपकी रुचियों और बजट के अनुरूप कस्टम यात्रा कार्यक्रम तैयार करता है।' : language === 'ar' ? 'مخطط رحلتك الشخصي ومنسق السفر، لإنشاء مسارات مخصصة تتناسب مع اهتماماتك وميزانيتك.' : language === 'pt' ? 'Seu planejador de viagens pessoal e curador de viagens, criando roteiros personalizados sob medida para seus interesses e orçamento.' : 'Your personal trip planner and travel curator, creating custom itineraries tailored to your interests and budget.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex justify-center"
        >
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className={`px-7 py-3.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md ${
                isDark ? 'bg-white hover:bg-slate-100 text-slate-950' : 'bg-slate-950 hover:bg-slate-800 text-white shadow-slate-950/10'
              }`}
            >
              <span>{t('go_to_dashboard')}</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setAuthModalMode('register');
                setIsAuthModalOpen(true);
              }}
              className={`px-7 py-3.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md cursor-pointer ${
                isDark ? 'bg-white hover:bg-slate-100 text-slate-950' : 'bg-slate-950 hover:bg-slate-800 text-white shadow-slate-950/10'
              }`}
            >
              <span>{t('get_started_free')}</span>
            </button>
          )}
        </motion.div>
      </header>

      {/* Interactive 3D Laptop Showcase */}
      <section className="relative max-w-6xl mx-auto px-6 pt-10 pb-10 flex flex-col items-center overflow-hidden">
        <div className={`text-xs font-semibold uppercase tracking-widest mt-12 mb-14 animate-pulse ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {t('scroll_down_planner')}
        </div>

        {/* 3D Viewport container */}
        <div className="w-full flex flex-col items-center" style={{ perspective: '1500px' }}>

          {/* Laptop Screen (Lid) */}
          <motion.div
            style={{
              rotateX,
              scale,
              transformOrigin: 'bottom',
              transformStyle: 'preserve-3d',
            }}
            className="w-[90%] md:w-[85%] max-w-[800px] aspect-[16/10] bg-[#0c111d] border-[10px] md:border-[14px] border-slate-900 rounded-t-3xl relative shadow-[0_-20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            {/* Webcam / Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-b-md z-30 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-800 mr-2" />
              <div className="h-1 w-1 rounded-full bg-green-500/80 animate-pulse" />
            </div>

            {/* Inner Screen Mockup Content */}
            <div className="absolute inset-0 bg-white overflow-hidden text-slate-800 p-3 md:p-6 select-none font-sans text-[10px] md:text-xs">

              {/* Mock Screen Header (Matches our real website) */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-nowrap gap-1">
                <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                  <img
                    src="/logo.png"
                    alt="Xplorism Logo"
                    className="h-5 w-5 sm:h-7 sm:w-7 object-contain rounded-full"
                  />
                  <span className="font-extrabold text-slate-900 tracking-tight text-[8px] sm:text-xs">Xplorism</span>
                </div>
                
                {/* Real Website Nav Links Mimic */}
                <div className="hidden md:flex items-center space-x-2 text-[7px] font-bold text-slate-500">
                  <span className="flex items-center space-x-0.5 text-rose-500">
                    <Compass className="h-2 w-2 text-rose-500" />
                    <span>Trips</span>
                  </span>
                  <span className="flex items-center space-x-0.5">
                    <Users className="h-2 w-2 text-slate-400" />
                    <span>Shared Trips</span>
                  </span>
                  <span className="flex items-center space-x-0.5">
                    <Sun className="h-2 w-2 text-slate-400" />
                    <span>Weather</span>
                  </span>
                  <span className="flex items-center space-x-0.5">
                    <Navigation className="h-2 w-2 text-slate-400 rotate-45" />
                    <span>Tracker</span>
                  </span>
                  <span className="flex items-center space-x-0.5">
                    <Building className="h-2 w-2 text-slate-400" />
                    <span>Hotels</span>
                  </span>
                  <span className="flex items-center space-x-0.5">
                    <DollarSign className="h-2 w-2 text-slate-400" />
                    <span>Budgets</span>
                  </span>
                  <span className="flex items-center space-x-0.5">
                    <FolderLock className="h-2 w-2 text-slate-400" />
                    <span>Vault</span>
                  </span>
                  <span className="flex items-center space-x-0.5">
                    <MessageSquare className="h-2 w-2 text-slate-400" />
                    <span>Community</span>
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* Bell Icon Mock */}
                  <div className="h-4.5 w-4.5 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 cursor-pointer">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  {/* User Avatar Circle Mock (matches the "T" user profile avatar from screenshot) */}
                  <div className="h-4.5 w-4.5 sm:h-6 sm:w-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[7px] sm:text-[10px] shrink-0">
                    T
                  </div>
                </div>
              </div>

              {/* Mock Dashboard Body */}
              <div className="mt-4 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar max-h-[85%] pr-0.5">
                {/* Dashboard Title & Action Button */}
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">My Trips Dashboard</h2>
                    <p className="text-[6px] sm:text-[9px] text-slate-400 mt-0.5 font-semibold">Create and manage your customized itineraries.</p>
                  </div>
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[6px] sm:text-[9px] flex items-center space-x-1 cursor-pointer transition shadow-sm"
                  >
                    <Plus className="h-2 w-2" />
                    <span>Create New Trip</span>
                  </button>
                </div>

                {/* Recommended Pre-planned Trips Section */}
                <div className="mt-2">
                  <div className="flex items-center space-x-1 text-rose-500 mb-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                    <h3 className="text-[8px] sm:text-xs font-bold text-slate-900">Recommended Pre-planned Trips</h3>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    
                    {/* Card 1: Tokyo */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white p-1.5 flex flex-col justify-between shadow-sm">
                      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-50">
                        <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80" alt="Tokyo" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[5px] font-bold bg-white/95 text-rose-550 shadow-sm">Adventure</span>
                      </div>
                      <div className="mt-1.5">
                        <h4 className="font-extrabold text-[7px] sm:text-[9px] text-slate-900 leading-tight">Tokyo, Japan</h4>
                        <p className="text-[5px] sm:text-[7px] text-slate-400 font-semibold mt-0.5">3 Days Custom Schedule</p>
                        <div className="flex items-center justify-between mt-1 text-[5px] sm:text-[7px] text-slate-550 font-bold">
                          <span className="flex items-center space-x-0.5"><Users className="h-1.5 w-1.5 text-slate-400" /><span>2 Travelers</span></span>
                          <span className="text-slate-800">¥120,000</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Paris */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white p-1.5 flex flex-col justify-between shadow-sm">
                      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-50">
                        <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=300&q=80" alt="Paris" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[5px] font-bold bg-white/95 text-rose-550 shadow-sm">Romantic & Art</span>
                      </div>
                      <div className="mt-1.5">
                        <h4 className="font-extrabold text-[7px] sm:text-[9px] text-slate-900 leading-tight">Paris, France</h4>
                        <p className="text-[5px] sm:text-[7px] text-slate-400 font-semibold mt-0.5">4 Days Custom Schedule</p>
                        <div className="flex items-center justify-between mt-1 text-[5px] sm:text-[7px] text-slate-550 font-bold">
                          <span className="flex items-center space-x-0.5"><Users className="h-1.5 w-1.5 text-slate-400" /><span>2 Travelers</span></span>
                          <span className="text-slate-800">€1,800</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: New York */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white p-1.5 flex flex-col justify-between shadow-sm">
                      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-50">
                        <img src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=300&q=80" alt="New York" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[5px] font-bold bg-white/95 text-rose-550 shadow-sm">Urban Adventure</span>
                      </div>
                      <div className="mt-1.5">
                        <h4 className="font-extrabold text-[7px] sm:text-[9px] text-slate-900 leading-tight">New York, USA</h4>
                        <p className="text-[5px] sm:text-[7px] text-slate-400 font-semibold mt-0.5">5 Days Custom Schedule</p>
                        <div className="flex items-center justify-between mt-1 text-[5px] sm:text-[7px] text-slate-550 font-bold">
                          <span className="flex items-center space-x-0.5"><Users className="h-1.5 w-1.5 text-slate-400" /><span>1 Travelers</span></span>
                          <span className="text-slate-800">$2,500</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: London */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white p-1.5 flex flex-col justify-between shadow-sm">
                      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-50">
                        <img src="https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=600&q=80" alt="London" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[5px] font-bold bg-white/95 text-rose-550 shadow-sm">Cultural</span>
                      </div>
                      <div className="mt-1.5">
                        <h4 className="font-extrabold text-[7px] sm:text-[9px] text-slate-900 leading-tight">London, UK</h4>
                        <p className="text-[5px] sm:text-[7px] text-slate-400 font-semibold mt-0.5">3 Days Custom Schedule</p>
                        <div className="flex items-center justify-between mt-1 text-[5px] sm:text-[7px] text-slate-550 font-bold">
                          <span className="flex items-center space-x-0.5"><Users className="h-1.5 w-1.5 text-slate-400" /><span>2 Travelers</span></span>
                          <span className="text-slate-800">$1,800</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* My Saved Itineraries header */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <h3 className="text-[8px] sm:text-xs font-bold text-slate-900 mb-1">My Saved Itineraries</h3>
                  <div className="border border-dashed border-slate-200 rounded-xl py-3 text-center text-[7px] sm:text-[9px] text-slate-400 bg-slate-50/50">
                    No trips created yet. Click "Create New Trip" to get started.
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

          {/* Black Hinge Connection Bar */}
          <div className="w-[85%] max-w-[760px] h-[8px] bg-slate-955 z-10 border-b border-slate-800" />

          {/* Laptop Base (Keyboard Tray) */}
          <div
            className="w-[98%] md:w-[94%] max-w-[880px] h-[18px] md:h-[24px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 rounded-b-2xl relative shadow-[0_20px_40px_rgba(0,0,0,0.35)] border-t border-slate-500/20"
            style={{
              transform: 'rotateX(15deg)',
              transformOrigin: 'top',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Trackpad indentation */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-[8px] md:h-[12px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-b-lg border-x border-b border-slate-700/20" />

            {/* Front Lip shadow edge */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-950 rounded-b-2xl" />
          </div>

        </div>
      </section>

      {/* Interactive Attraction Finder Section */}
      <section className={`max-w-7xl mx-auto px-6 py-20 border-t transition-colors duration-300 ${isDark ? 'border-slate-900 bg-slate-950' : 'border-slate-100 bg-[#fafafa]'}`}>
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Explore Nearby Sights & Tourist Places
          </h2>
          <p className={`max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter a destination city below to dynamically query real-time OpenStreetMap points of interest. Select items to inspect details or zoom in on the map.
          </p>

          {/* Map Search Form */}
          <div className="max-w-md mx-auto relative z-30">
            <form onSubmit={handleMapSearch} className={`flex items-center p-1.5 rounded-2xl border shadow-sm gap-1 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={handleGeolocationSearch}
                title="Use My Current Location"
                disabled={mapLoading}
                className={`px-3 py-2 rounded-xl border transition duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-450 hover:bg-rose-950/20' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                <Locate className="h-4 w-4" />
                <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:inline">GPS</span>
              </button>
              <input
                type="text"
                value={mapSearchQuery}
                onChange={(e) => {
                  setMapSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search city (e.g. Honolulu, Paris, Tokyo...)"
                className={`flex-1 px-2 py-2.5 outline-none text-xs font-sans bg-transparent ${
                  isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'
                }`}
                required
              />
              <button
                type="submit"
                disabled={mapLoading || !leafletLoaded}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer disabled:opacity-50 ${
                  isDark ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {mapLoading ? 'Searching...' : 'Find Sights'}
              </button>
            </form>

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden font-sans max-h-[220px] overflow-y-auto">
                {suggestions.map((sug) => (
                  <button
                    key={sug.place_id}
                    type="button"
                    onClick={() => {
                      setMapSearchQuery(sug.display_name);
                      setSuggestions([]);
                      setShowSuggestions(false);

                      const latitude = parseFloat(sug.lat);
                      const longitude = parseFloat(sug.lon);

                      // Reset states
                      setTouristPlaces([]);
                      setSelectedPlace(null);
                      setNearbyAmenities([]);
                      setMapLoading(true);

                      // Pan map
                      initMap(latitude, longitude, 13);

                      // Clear markers
                      markersRef.current.forEach(marker => marker.remove());
                      markersRef.current = [];

                      // Add central marker
                      if (mapRef.current) {
                        const centerMarker = window.L.marker([latitude, longitude])
                          .addTo(mapRef.current)
                          .bindPopup(`<b>Center:</b> ${sug.display_name}`)
                          .openPopup();
                        markersRef.current.push(centerMarker);
                      }

                      // Query attractions
                      const query = `[out:json][timeout:25];(nwr["tourism"~"attraction|museum|gallery|theme_park|viewpoint|zoo|picnic_site|aquarium|artwork"](around:3000,${latitude},${longitude});nwr["historic"~"monument|castle|ruins|memorial|archaeological_site|tomb"](around:3000,${latitude},${longitude});nwr["amenity"="place_of_worship"](around:3000,${latitude},${longitude});nwr["natural"~"waterfall|beach|peak"](around:3000,${latitude},${longitude});nwr["leisure"~"park|garden"](around:3000,${latitude},${longitude}););out center;`;
                      fetchOverpassWithFallback(query)
                        .then(overpassData => {
                          if (overpassData && overpassData.elements) {
                            return overpassData.elements
                              .filter(el => el.tags && (el.tags.name || el.tags.tourism || el.tags.amenity || el.tags.historic || el.tags.natural || el.tags.leisure))
                              .map(el => {
                                let priority = 2;
                                if (el.tags.tourism || el.tags.historic || el.tags.natural || el.tags.leisure) {
                                  priority = 1;
                                }
                                return {
                                  id: el.id.toString(),
                                  name: el.tags.name || el.tags.tourism || el.tags.amenity || el.tags.historic || el.tags.natural || el.tags.leisure || 'Tourist Place',
                                  lat: el.lat || (el.center && el.center.lat),
                                  lon: el.lon || (el.center && el.center.lon),
                                  type: el.tags.tourism || el.tags.historic || el.tags.amenity || el.tags.natural || el.tags.leisure || 'Attraction',
                                  description: el.tags.description || el.tags.wikipedia || `A local ${el.tags.tourism || el.tags.amenity || el.tags.natural || el.tags.leisure || 'attraction'} to visit.`,
                                  priority
                                };
                              })
                              .filter(place => place.lat && place.lon)
                              .sort((a, b) => a.priority - b.priority)
                              .slice(0, 10);
                          }
                          return [];
                        })
                        .catch(err => {
                          console.warn('Overpass failed, falling back to Wikipedia Geosearch:', err);
                          return fetchWikipediaAttractions(latitude, longitude);
                        })
                        .then(places => {
                          setTouristPlaces(places);

                          places.forEach(place => {
                            if (mapRef.current) {
                              const marker = window.L.marker([place.lat, place.lon])
                                .addTo(mapRef.current)
                                .bindPopup(`<b>${place.name}</b><br/>Type: ${place.type.replace('_', ' ')}`);
                              marker.on('click', () => setSelectedPlace(place));
                              markersRef.current.push(marker);
                            }
                          });

                          if (places.length > 0) {
                            setSelectedPlace(places[0]);
                          } else {
                            setSelectedPlace(null);
                          }
                        })
                        .catch(err => console.error('Error fetching details:', err))
                        .finally(() => setMapLoading(false));
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs text-slate-700 font-semibold border-b border-slate-50 last:border-b-0 cursor-pointer transition flex items-center justify-between gap-3"
                  >
                    <span className="truncate flex-1">{sug.display_name}</span>
                    <span className="text-[9px] uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0 font-bold">
                      {sug.type === 'administrative' ? 'district' : sug.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Leaflet Map Container */}
          <div className={`lg:col-span-7 border rounded-3xl p-3 shadow-sm relative overflow-hidden flex items-center justify-center min-h-[300px] lg:min-h-[450px] transition-colors duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            {!leafletLoaded ? (
              <div className="flex flex-col items-center space-y-2">
                <div className={`h-6 w-6 border-2 rounded-full animate-spin ${
                  isDark ? 'border-slate-850 border-t-rose-500' : 'border-slate-300 border-t-slate-900'
                }`} />
                <p className="text-slate-400 text-xs font-medium">Loading Map interface...</p>
              </div>
            ) : (
              <div id="leaflet-map" className="w-full h-full rounded-2xl z-10 min-h-[300px] lg:min-h-[426px]" />
            )}
          </div>

          {/* Interactive Attraction Cards / Details Panel */}
          <div className={`lg:col-span-5 border rounded-3xl p-6 shadow-sm min-h-[420px] lg:min-h-[450px] flex flex-col justify-between transition-colors duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            {mapLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className={`h-8 w-8 border-4 rounded-full animate-spin ${
                  isDark ? 'border-slate-800/80 border-t-rose-500' : 'border-slate-100 border-t-rose-500'
                }`} />
                <h4 className={`text-sm font-bold ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>Searching Nearby Sights...</h4>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Querying real-time OpenStreetMap geographic data for {mapSearchQuery}...</p>
              </div>
            ) : selectedPlace ? (
              <div>
                {/* Header */}
                <div className={`flex items-center justify-between pb-4 border-b mb-5 ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <div className="flex-1 pr-2">
                    <h3 className={`text-lg md:text-xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedPlace.name}
                    </h3>
                    <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[9px] uppercase tracking-wider ${
                      isDark ? 'bg-rose-500/10 text-rose-455 border border-rose-500/20' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {selectedPlace.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm bg-rose-500 shrink-0">
                    <Compass className="h-5 w-5 animate-pulse" />
                  </div>
                </div>

                {/* Description */}
                <p className={`text-xs md:text-sm leading-relaxed mb-6 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {selectedPlace.description}
                </p>

                {/* Nearby Places Selector */}
                <div className="mb-5">
                  <h4 className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Tourist Sights in {mapSearchQuery}
                  </h4>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {touristPlaces.map((place) => {
                      const isSelected = selectedPlace.id === place.id;
                      return (
                        <button
                          key={place.id}
                          onClick={() => {
                            setSelectedPlace(place);
                            if (mapRef.current) {
                              mapRef.current.setView([place.lat, place.lon], 15);
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs font-semibold flex items-center justify-between cursor-pointer ${isSelected
                              ? isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-rose-50/50 border-rose-200 text-rose-600'
                              : isDark ? 'bg-slate-800/40 border-slate-800/85 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          <span className="truncate pr-2">{place.name}</span>
                          <span className="text-[9px] uppercase text-slate-400 font-bold shrink-0">
                            {place.type.replace('_', ' ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nearby Amenities (Restaurants/Cafes/Parks) */}
                <div className="mt-4">
                  <h4 className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Food, Drinks & Parks Nearby (1km)
                  </h4>
                  {loadingAmenities ? (
                    <div className="flex items-center space-x-2 py-2">
                      <div className="h-4 w-4 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin"></div>
                      <span className="text-[11px] text-slate-400">Finding nearby facilities...</span>
                    </div>
                  ) : nearbyAmenities.length > 0 ? (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {nearbyAmenities.map((amenity) => (
                        <div
                          key={amenity.id}
                          onClick={() => {
                            if (mapRef.current) {
                              mapRef.current.setView([amenity.lat, amenity.lon], 16);
                              window.L.popup()
                                .setLatLng([amenity.lat, amenity.lon])
                                .setContent(`<b>${amenity.name}</b><br/>Type: ${amenity.type}`)
                                .openOn(mapRef.current);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                            isDark ? 'bg-slate-800/20 border-slate-800/70 hover:bg-slate-800 text-slate-300' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className={`truncate pr-2 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{amenity.name}</span>
                          <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            isDark ? 'text-emerald-450 bg-emerald-500/10 border border-emerald-500/20' : 'text-emerald-600 bg-emerald-50'
                          }`}>
                            {amenity.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">No restaurants, cafes, or parks cataloged nearby.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <MapPin className="h-10 w-10 text-slate-350 mb-3" />
                <h4 className="text-sm font-bold text-slate-700 mb-1">No Attractions Found</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Type a city name in the search bar to discover local sights, museums, and historical landmarks.
                </p>
              </div>
            )}

            {/* Actions button */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/dashboard');
                  } else {
                    setAuthModalMode('register');
                    setIsAuthModalOpen(true);
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition duration-200 flex items-center justify-center space-x-2 cursor-pointer shadow-sm animate-none"
              >
                <span>Plan Trip to {mapSearchQuery}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={`max-w-7xl mx-auto px-6 py-10 sm:py-20 border-t transition-colors duration-300 ${
        isDark ? 'border-slate-900 bg-slate-950' : 'border-slate-100'
      }`}>
        <div className="text-center mb-8 sm:mb-16">
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 sm:mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Plan Simpler. Travel Better.</h2>
          <p className={`max-w-xl mx-auto text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Everything you need for an unforgettable journey, organized in a clean layout.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8"
        >
          {/* Card 1 */}
          <motion.div variants={itemVariants} className={`border p-3.5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl hover:shadow-md transition-all duration-200 ${
            isDark ? 'bg-slate-900/30 border-slate-900/80 text-white' : 'bg-slate-5/50 border-slate-100'
          }`}>
            <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 ${
              isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-500'
            }`}>
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <h3 className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Custom Itinerary Builder</h3>
            <p className={`text-[10px] sm:text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter your budget, dates, and styles. Get customized day-by-day plans, dining recommendations, and travel markers.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className={`border p-3.5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl hover:shadow-md transition-all duration-200 ${
            isDark ? 'bg-slate-900/30 border-slate-900/80 text-white' : 'bg-slate-5/50 border-slate-100'
          }`}>
            <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 ${
              isDark ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-600'
            }`}>
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <h3 className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Interactive Mapping</h3>
            <p className={`text-[10px] sm:text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Map out destinations on Leaflet OpenStreetMap. Keep coordinates of all sights, hotels, and restaurants in one place.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className={`border p-3.5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl hover:shadow-md transition-all duration-200 ${
            isDark ? 'bg-slate-900/30 border-slate-900/80 text-white' : 'bg-slate-5/50 border-slate-100'
          }`}>
            <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 ${
              isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600'
            }`}>
              <CloudRain className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <h3 className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Weather Forecasting</h3>
            <p className={`text-[10px] sm:text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Check real-time 5-day forecasts and suggestions on clothing to optimize your daily activity selection.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div variants={itemVariants} className={`border p-3.5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl hover:shadow-md transition-all duration-200 ${
            isDark ? 'bg-slate-900/30 border-slate-900/80 text-white' : 'bg-slate-5/50 border-slate-100'
          }`}>
            <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <h3 className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Expense & Budget Tracker</h3>
            <p className={`text-[10px] sm:text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Keep tabs on your travel expenses, set budget caps, and categorize your spending in real-time.
            </p>
          </motion.div>

          {/* Card 5 */}
          <motion.div variants={itemVariants} className={`border p-3.5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl hover:shadow-md transition-all duration-200 ${
            isDark ? 'bg-slate-900/30 border-slate-900/80 text-white' : 'bg-slate-5/50 border-slate-100'
          }`}>
            <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 ${
              isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600'
            }`}>
              <FolderLock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <h3 className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Secure Document Vault</h3>
            <p className={`text-[10px] sm:text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Store your passports, visas, boarding passes, and booking confirmations securely and access them anywhere.
            </p>
          </motion.div>

          {/* Card 6 */}
          <motion.div variants={itemVariants} className={`border p-3.5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl hover:shadow-md transition-all duration-200 ${
            isDark ? 'bg-slate-900/30 border-slate-900/80 text-white' : 'bg-slate-5/50 border-slate-100'
          }`}>
            <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 ${
              isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600'
            }`}>
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <h3 className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Community Feed & Sharing</h3>
            <p className={`text-[10px] sm:text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Share your travel diaries and itineraries with other travelers, or discover exciting recommendations.
            </p>
          </motion.div>
        </motion.div>
      </section>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
