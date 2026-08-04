import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, MapPin, Search, Plus, Trash2, ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle, Globe
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function MapPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const globeElRef = useRef(null);
  const globeInstanceRef = useRef(null);
  
  // State
  const [trips, setTrips] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Projected popup state
  const [activePopup, setActivePopup] = useState(null);
  const [globeReady, setGlobeReady] = useState(false);

  // Poll for Globe.gl script load
  useEffect(() => {
    if (window.Globe) {
      setGlobeReady(true);
    } else {
      const interval = setInterval(() => {
        if (window.Globe) {
          setGlobeReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Fetch Trips & Load Wishlist
  useEffect(() => {
    const initData = async () => {
      try {
        const data = await api.get('/trips');
        setTrips(data || []);
      } catch (err) {
        console.error('Failed to load trips:', err);
      } finally {
        setLoading(false);
      }
    };

    const savedWishlist = localStorage.getItem('xplorism_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error(e);
      }
    }

    initData();
  }, []);

  // Fetch Autocomplete Suggestions from Nominatim
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await response.json();
        if (data) {
          const mapped = data.map(item => ({
            name: item.name || item.display_name.split(',')[0],
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          }));
          setSuggestions(mapped);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const clickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', clickOutside);
    return () => document.removeEventListener('click', clickOutside);
  }, []);

  // Geocode Planned Trips
  const [tripCoords, setTripCoords] = useState({});
  useEffect(() => {
    const geocodeAllTrips = async () => {
      const coordsMap = {};
      for (const trip of trips) {
        const cacheKey = `xplorism_geo_${trip.destination.toLowerCase()}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          coordsMap[trip.id] = JSON.parse(cached);
        } else {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trip.destination)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
              const coords = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
              };
              localStorage.setItem(cacheKey, JSON.stringify(coords));
              coordsMap[trip.id] = coords;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      setTripCoords(coordsMap);
    };

    if (trips.length > 0) {
      geocodeAllTrips();
    }
  }, [trips]);

  // Initialize Globe.gl
  useEffect(() => {
    if (!globeReady || !globeElRef.current) return;

    const width = globeElRef.current.clientWidth;
    const height = globeElRef.current.clientHeight;

    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';

    // Create Globe.gl instance
    const globe = window.Globe()(globeElRef.current)
      .width(width)
      .height(height)
      .globeImageUrl(isDark 
        ? 'https://unpkg.com/three-globe/example/img/earth-night.jpg' 
        : 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
      )
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor('rgba(0,0,0,0)') // Transparent background to allow our custom cosmic styling
      .showAtmosphere(true)
      .atmosphereColor(isDark ? '#3b82f6' : '#2563eb')
      .atmosphereAltitude(isDark ? 0.15 : 0.12);

    // Apply high realism material configurations (bump scale and specular maps for water reflections)
    const globeMaterial = globe.globeMaterial();
    globeMaterial.bumpScale = 10;
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.3;
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.05;

    if (window.THREE) {
      new window.THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-water.png', texture => {
        globeMaterial.specularMap = texture;
        globeMaterial.specular = new window.THREE.Color(isDark ? '#1e293b' : '#94a3b8');
        globeMaterial.shininess = 20;
      });
    }

    // Add floating, animated clouds layer
    let cloudsMesh;
    let animationFrameId;
    if (window.THREE) {
      const CLOUDS_ALT = 0.012; // Altitude above the globe surface
      const CLOUDS_ROTATION_SPEED = -0.004; // Rotating in opposite direction to the globe

      // Add floating, animated clouds layer
      new window.THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-clouds.png', cloudsTexture => {
        const cloudsGeom = new window.THREE.SphereGeometry(globe.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75);
        const cloudsMat = new window.THREE.MeshPhongMaterial({
          map: cloudsTexture,
          transparent: true,
          opacity: isDark ? 0.35 : 0.45
        });
        cloudsMesh = new window.THREE.Mesh(cloudsGeom, cloudsMat);
        globe.scene().add(cloudsMesh);

        const rotateClouds = () => {
          if (cloudsMesh) {
            cloudsMesh.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180;
          }
          animationFrameId = requestAnimationFrame(rotateClouds);
        };
        rotateClouds();
      });
    }

    // Adjust light sources to enhance specular reflections
    setTimeout(() => {
      if (globe && globe.scene) {
        globe.scene().traverse(obj => {
          if (obj.type === 'DirectionalLight') {
            obj.position.set(1.5, 1.5, 1.5);
            obj.intensity = isDark ? 2.0 : 1.6;
          }
        });
      }
    }, 500);

    globeInstanceRef.current = globe;

    const handleResize = () => {
      if (!globeElRef.current || !globeInstanceRef.current) return;
      const w = globeElRef.current.clientWidth;
      const h = globeElRef.current.clientHeight;
      globeInstanceRef.current.width(w).height(h);
    };
    window.addEventListener('resize', handleResize);

    // Call resize at multiple layout intervals to ensure perfect alignment & centering
    const delays = [100, 300, 800, 1500];
    delays.forEach(delay => {
      setTimeout(handleResize, delay);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (globeInstanceRef.current) {
        if (globeElRef.current) {
          globeElRef.current.innerHTML = '';
        }
        globeInstanceRef.current = null;
      }
    };
  }, [globeReady, loading]);

  // Update Points and Arcs on Globe when data updates
  useEffect(() => {
    if (!globeInstanceRef.current) return;

    const points = [];

    // Trips
    trips.forEach((trip) => {
      const coords = tripCoords[trip.id];
      if (!coords) return;
      points.push({
        id: trip.id,
        name: trip.destination.split(',')[0],
        displayName: trip.destination,
        lat: coords.lat,
        lon: coords.lon,
        color: '#2563eb', // blue
        size: 0.5, // larger dot size
        type: 'trip',
        details: `Starts: ${new Date(trip.startDate).toLocaleDateString()}`
      });
    });

    // Wishlist
    wishlist.forEach((pin) => {
      points.push({
        id: pin.id,
        name: pin.name.split(',')[0],
        displayName: pin.displayName,
        lat: pin.lat,
        lon: pin.lon,
        color: '#ef4444', // red
        size: 0.5, // larger dot size
        type: 'wishlist',
        details: 'Dream Destination'
      });
    });

    // Set HTML Elements as map pins on globe
    globeInstanceRef.current
      .htmlElementsData(points)
      .htmlLat('lat')
      .htmlLng('lon')
      .htmlAltitude(0.01)
      .htmlElement(d => {
        const el = document.createElement('div');
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.transform = 'translate(-50%, -100%)';
        
        el.innerHTML = `
          <div style="cursor: pointer; transition: transform 0.2s;" class="globe-pin-container">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${d.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="${d.color}22"/>
              <circle cx="12" cy="10" r="3" fill="${d.color}"/>
            </svg>
          </div>
          <div style="font-family: sans-serif; font-size: 11px; font-weight: 800; color: ${d.color}; text-shadow: 0 1.5px 3px rgba(0,0,0,0.85); white-space: nowrap; pointer-events: none; margin-top: -2px;">
            ${d.name}
          </div>
        `;

        const container = el.querySelector('.globe-pin-container');
        container.onclick = (event) => {
          event.stopPropagation();
          const rect = globeElRef.current.getBoundingClientRect();
          setActivePopup({
            ...d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
          focusOnCoordinates(d.lat, d.lon);
        };

        // Hover animation
        container.onmouseenter = () => {
          container.style.transform = 'scale(1.25)';
        };
        container.onmouseleave = () => {
          container.style.transform = 'scale(1)';
        };

        return el;
      });
      


  }, [trips, wishlist, tripCoords]);

  // Center & Rotate Globe towards coordinates
  const focusOnCoordinates = (lat, lon) => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.pointOfView({ lat, lng: lon, altitude: 1.5 }, 1200);
      
      // Briefly pause auto-rotation to let user look at destination
      globeInstanceRef.current.controls().autoRotate = false;
      setTimeout(() => {
        if (globeInstanceRef.current) {
          globeInstanceRef.current.controls().autoRotate = true;
        }
      }, 5000);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchError('');
    
    const alreadyExists = wishlist.some(
      item => Math.abs(item.lat - suggestion.lat) < 0.05 && Math.abs(item.lon - suggestion.lon) < 0.05
    );

    if (alreadyExists) {
      setSearchError('This location is already pinned!');
      setShowSuggestions(false);
      return;
    }

    const newPin = {
      id: Date.now().toString(),
      name: suggestion.name,
      displayName: suggestion.displayName,
      lat: suggestion.lat,
      lon: suggestion.lon,
      pinnedAt: new Date().toISOString()
    };

    const updatedWishlist = [newPin, ...wishlist];
    setWishlist(updatedWishlist);
    localStorage.setItem('xplorism_wishlist', JSON.stringify(updatedWishlist));
    
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Smooth rotate to destination
    setTimeout(() => {
      focusOnCoordinates(suggestion.lat, suggestion.lon);
    }, 100);
  };

  // Add Wishlist Pin Handler
  const handleAddWishlistPin = async (e) => {
    e.preventDefault();
    setSearchError('');
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        handleSelectSuggestion({
          name: searchQuery,
          displayName: data[0].display_name,
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        });
      } else {
        setSearchError(t('error_geocode_coordinates'));
      }
    } catch (err) {
      console.error(err);
      setSearchError(t('error_geocode_failed'));
    } finally {
      setSearching(false);
    }
  };

  // Delete Wishlist Pin
  const handleDeleteWishlistPin = (id) => {
    const updatedWishlist = wishlist.filter(pin => pin.id !== id);
    setWishlist(updatedWishlist);
    localStorage.setItem('xplorism_wishlist', JSON.stringify(updatedWishlist));
    if (activePopup && activePopup.id === id) {
      setActivePopup(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar activeTab="map" />

      {/* Main Viewport container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col py-6">
        
        {/* Header section above the card */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center space-x-2.5">
              <Compass className="h-7 w-7 text-blue-500" />
              <span>{t('globe_title')}</span>
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t('globe_desc')}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ 
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('back_to_dashboard')}</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row relative z-10 w-full overflow-hidden border rounded-3xl shadow-sm" 
             style={{ 
               height: 'calc(100vh - 220px)',
               backgroundColor: 'var(--bg-secondary)',
               borderColor: 'var(--border-primary)'
             }}>
          
          {/* Left Side Menu - Pinboard controls */}
          <div className="w-full lg:w-96 flex flex-col border-r shrink-0 overflow-y-auto"
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>

          {/* Add Pin Search Box */}
          <div className="p-6 border-b search-container relative" style={{ borderColor: 'var(--border-secondary)' }}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles className="h-3.5 w-3.5 text-rose-500" />
              <span>{t('add_wishlist_pins')}</span>
            </h3>
            
            <form onSubmit={handleAddWishlistPin} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('wishlist_placeholder')}
                className="w-full py-2.5 pl-10 pr-12 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-white transition active:scale-95 cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: '#f43f5e' }}
              >
                {searching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="absolute left-6 right-6 mt-1 rounded-2xl border shadow-xl z-50 overflow-hidden text-xs max-h-60 overflow-y-auto"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="px-4 py-3 cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5 border-b last:border-b-0 text-left"
                    style={{ borderColor: 'var(--border-secondary)' }}
                  >
                    <div className="font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                    <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.displayName}</div>
                  </div>
                ))}
              </div>
            )}

            {searchError && (
              <div className="flex items-center space-x-1.5 mt-3 text-[10px] font-bold text-rose-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Planned Trips List Section */}
          <div className="flex-1 p-6 space-y-6">
            
            {/* Planned Itineraries */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>{t('my_planned_trips')} ({trips.length})</span>
              </h3>

              {loading ? (
                <div className="flex items-center space-x-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{t('loading_destinations')}</span>
                </div>
              ) : trips.length === 0 ? (
                <p className="text-[11px] font-medium py-3 italic" style={{ color: 'var(--text-tertiary)' }}>
                  {t('no_planned_trips')}
                </p>
              ) : (
                <div className="space-y-2">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() => {
                        const coords = tripCoords[trip.id];
                        if (coords) focusOnCoordinates(coords.lat, coords.lon);
                      }}
                      className="p-3 rounded-2xl border transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left flex items-start justify-between"
                      style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold">{trip.destination}</h4>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {t('active_badge')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist Pins List */}
            <div className="space-y-3 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>{t('dream_destinations')} ({wishlist.length})</span>
              </h3>

              {wishlist.length === 0 ? (
                <p className="text-[11px] font-medium py-3 italic" style={{ color: 'var(--text-tertiary)' }}>
                  {t('no_dream_destinations')}
                </p>
              ) : (
                <div className="space-y-2">
                  {wishlist.map((pin) => (
                    <div
                      key={pin.id}
                      className="p-3 rounded-2xl border transition flex items-center justify-between"
                      style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <div 
                        onClick={() => focusOnCoordinates(pin.lat, pin.lon)}
                        className="flex-1 cursor-pointer text-left pr-2"
                      >
                        <h4 className="text-xs font-extrabold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{pin.name}</span>
                        </h4>
                        <p className="text-[9px] truncate" style={{ color: 'var(--text-tertiary)' }}>{pin.displayName}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteWishlistPin(pin.id)}
                        className="p-1.5 rounded-xl border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Globe.gl Container Viewport */}
        <div className="flex-1 h-full w-full relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
          
          {/* Legend Banner */}
          <div className="absolute top-6 right-6 flex items-center space-x-2 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm z-30 pointer-events-none">
            <Globe className="h-4 w-4 text-blue-500 animate-spin-slow" />
            <span>{t('interactive_3d_globe')}</span>
          </div>

          {/* Globe Target Div */}
          <div ref={globeElRef} className="w-full h-full relative z-20 cursor-grab active:cursor-grabbing" />

          {/* Floating Projected HTML Popup Overlay */}
          {activePopup && (
            <div 
              className="absolute z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl w-60 pointer-events-auto transform -translate-x-1/2 -translate-y-full mt-[-20px] animate-fade-in text-left"
              style={{ 
                left: activePopup.x, 
                top: activePopup.y
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span 
                  className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: activePopup.type === 'trip' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    color: activePopup.type === 'trip' ? '#2563eb' : '#f43f5e'
                  }}
                >
                  {activePopup.type === 'trip' ? t('itinerary_badge') : t('wishlist_spot_badge')}
                </span>
                <button 
                  onClick={() => setActivePopup(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{activePopup.name}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mb-2">{activePopup.displayName}</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">{activePopup.details}</p>

              {activePopup.type === 'trip' && (
                <a 
                  href={`/trips/${activePopup.id}/budget`}
                  className="mt-3 block text-center text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-xl transition"
                >
                  {t('view_budget_btn')}
                </a>
              )}
            </div>
          )}

        </div>

      </div>
     </div>
    </div>
  );
}
