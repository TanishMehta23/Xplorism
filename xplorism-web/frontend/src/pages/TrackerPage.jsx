import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Globe, Compass, ArrowLeft, Search, RefreshCw,
  ShieldAlert, Navigation, Cloud, Radio, Activity,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function TrackerPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(15); // refresh every 15s
  const [countdown, setCountdown] = useState(15);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'map', 'list'
  const [dataSource, setDataSource] = useState('mock');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const routeLayersRef = useRef([]);
  const airportMarkersRef = useRef({});

  // Dynamic Leaflet loader to ensure React 19 compatibility without peer-dep conflicts
  useEffect(() => {
    // 1. Append CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Append JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      // Check if L is available
      if (window.L) {
        setLeafletLoaded(true);
      } else {
        const interval = setInterval(() => {
          if (window.L) {
            setLeafletLoaded(true);
            clearInterval(interval);
          }
        }, 100);
      }
    }
  }, []);

  // Fetch flights
  const fetchFlights = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/flights?search=${encodeURIComponent(searchQuery)}`);
      if (data && data.states) {
        // Parse states array to friendly flight objects
        const parsedFlights = data.states.map(f => ({
          ...f,
          altitude: f.altitude !== null ? Math.round(f.altitude * 3.28084) : 0, // convert meters to feet
          velocity: f.velocity !== null ? Math.round(f.velocity * 1.94384) : 0, // convert m/s to knots
          verticalRate: f.verticalRate !== null ? Math.round(f.verticalRate * 196.85) : 0, // convert m/s to ft/min
        }));
        setFlights(parsedFlights);
        setDataSource(data.source || 'mock');
        setError('');
      } else {
        throw new Error("No flight data returned");
      }
    } catch (err) {
      console.error("Failed to fetch flight data:", err);
      setError("Unable to connect to flight server. Retrying...");
    } finally {
      setLoading(false);
      setCountdown(refreshInterval);
    }
  };

  // Fetch flights when searchQuery changes, with debouncing
  useEffect(() => {
    if (!searchQuery) {
      fetchFlights();
      return;
    }

    const timer = setTimeout(() => {
      fetchFlights();
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchFlights();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval, searchQuery]);

  // Leaflet map initialization
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const L = window.L;
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2.5,
        minZoom: 1.5,
        zoomControl: false,
        worldCopyJump: true
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Google Maps Tile Layer (forced English language)
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size after layout completes to ensure map is visible
      setTimeout(() => {
        map.invalidateSize();
      }, 300);

      // Also handle window resize
      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [leafletLoaded]);

  // Map markers update effect
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Filter flights based on search query
    const filtered = flights.filter(f =>
      f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.originCountry.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Keep track of current flight ICAOs to clean up old ones
    const currentIcaos = new Set(filtered.map(f => f.icao24));

    // Remove old markers
    Object.keys(markersRef.current).forEach(icao => {
      if (!currentIcaos.has(icao)) {
        markersRef.current[icao].remove();
        delete markersRef.current[icao];
      }
    });

    // Custom rotated SVG plane icon builder
    const createPlaneIcon = (heading, isSelected, color) => {
      const size = isSelected ? 34 : 26;
      return L.divIcon({
        html: `<div style="transform: rotate(${heading}deg); transition: transform 0.5s ease-out; display: flex; align-items: center; justify-content: center;">
                 <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.2" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
                   <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
                 </svg>
               </div>`,
        className: 'plane-marker-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
    };

    // Add or update markers
    filtered.forEach(f => {
      const isSelected = selectedFlight?.icao24 === f.icao24;
      const position = [f.latitude, f.longitude];

      // Determine flight color based on altitude
      let color = '#10b981'; // default emerald (10k-30k ft)
      if (isSelected) {
        color = '#f43f5e'; // Selected: rose
      } else if (f.altitude < 10000) {
        color = '#f59e0b'; // Under 10k ft: orange
      } else if (f.altitude >= 30000) {
        color = '#06b6d4'; // Above 30k ft: cyan
      }

      if (markersRef.current[f.icao24]) {
        // Update existing marker
        const marker = markersRef.current[f.icao24];
        marker.setLatLng(position);
        marker.setIcon(createPlaneIcon(f.heading, isSelected, color));
      } else {
        // Create new marker
        const marker = L.marker(position, {
          icon: createPlaneIcon(f.heading, isSelected, color)
        }).addTo(map);

        // Marker click handler
        marker.on('click', () => {
          setSelectedFlight(f);
          map.setView(position, Math.max(map.getZoom(), 5), { animate: true });
        });

        markersRef.current[f.icao24] = marker;
      }
    });

  }, [flights, selectedFlight, leafletLoaded, searchQuery]);

  // Selected flight path trail rendering effect
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // 1. Clear previous route layers
    routeLayersRef.current.forEach(layer => layer.remove());
    routeLayersRef.current = [];

    if (!selectedFlight) return;

    // Find the latest coordinates of the selected flight
    const latestFlight = flights.find(f => f.icao24 === selectedFlight.icao24) || selectedFlight;

    if (
      latestFlight.departure &&
      latestFlight.destination &&
      latestFlight.departure.lat !== undefined &&
      latestFlight.departure.lon !== undefined &&
      latestFlight.destination.lat !== undefined &&
      latestFlight.destination.lon !== undefined &&
      latestFlight.latitude !== undefined &&
      latestFlight.longitude !== undefined
    ) {
      const departurePos = [latestFlight.departure.lat, latestFlight.departure.lon];
      const destinationPos = [latestFlight.destination.lat, latestFlight.destination.lon];
      const currentPos = [latestFlight.latitude, latestFlight.longitude];

      // Helper to calculate quadratic Bezier points for curved trails
      const getBezierPoints = (start, end, numPoints = 50) => {
        const [lat1, lon1] = start;
        const [lat2, lon2] = end;
        const midLat = (lat1 + lat2) / 2;
        const midLon = (lon1 + lon2) / 2;
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        // Offset perpendicular to the line to create a curve
        const curvature = 0.15;
        const controlLat = midLat - dLon * curvature;
        const controlLon = midLon + dLat * curvature;

        const points = [];
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
          const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * controlLon + t * t * lon2;
          points.push([lat, lon]);
        }
        return points;
      };

      const historyPoints = getBezierPoints(departurePos, currentPos);
      const projectedPoints = getBezierPoints(currentPos, destinationPos);

      // Draw historical path (solid line)
      const historyPath = L.polyline(historyPoints, {
        color: '#f43f5e',
        weight: 3.5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      routeLayersRef.current.push(historyPath);

      // Draw projected path (dashed line)
      const projectedPath = L.polyline(projectedPoints, {
        color: '#94a3b8',
        weight: 2.5,
        opacity: 0.65,
        dashArray: '5, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      routeLayersRef.current.push(projectedPath);

      // Draw Airport Pins
      const createAirportIcon = (code) => L.divIcon({
        html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                 <div style="height: 18px; width: 18px; border-radius: 50%; background-color: #0f172a; border: 2px solid #f43f5e; display: flex; align-items: center; justify-content: center; box-shadow: 0px 2px 4px rgba(0,0,0,0.5);">
                   <div style="height: 6px; width: 6px; border-radius: 50%; background-color: #f43f5e;"></div>
                 </div>
                 <span style="font-size: 8px; font-weight: 900; color: #ffffff; background-color: rgba(15, 23, 42, 0.9); border: 1px solid #334155; border-radius: 3px; padding: 1px 3px; margin-top: 2px; box-shadow: 0px 1px 2px rgba(0,0,0,0.3); font-family: sans-serif;">${code}</span>
               </div>`,
        className: 'airport-marker-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 9]
      });

      const departureMarker = L.marker(departurePos, { icon: createAirportIcon(latestFlight.departure.code) }).addTo(map);
      const destinationMarker = L.marker(destinationPos, { icon: createAirportIcon(latestFlight.destination.code) }).addTo(map);
      routeLayersRef.current.push(departureMarker, destinationMarker);

      // Fit bounds to show the entire flight path
      const bounds = L.latLngBounds([departurePos, currentPos, destinationPos]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });
    }
  }, [selectedFlight, flights, leafletLoaded]);

  // Power-User Keyboard Shortcuts: Esc to clear selected flight
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedFlight) {
        setSelectedFlight(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFlight]);

  // Airport markers rendering effect
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Extract unique active airports
    const uniqueAirports = [];
    const seenCodes = new Set();
    flights.forEach(f => {
      if (f.departure && f.departure.lat !== undefined && f.departure.lon !== undefined && !seenCodes.has(f.departure.code)) {
        seenCodes.add(f.departure.code);
        uniqueAirports.push(f.departure);
      }
      if (f.destination && f.destination.lat !== undefined && f.destination.lon !== undefined && !seenCodes.has(f.destination.code)) {
        seenCodes.add(f.destination.code);
        uniqueAirports.push(f.destination);
      }
    });

    const activeCodes = new Set(uniqueAirports.map(a => a.code));

    // Remove old airport markers
    Object.keys(airportMarkersRef.current).forEach(code => {
      if (!activeCodes.has(code)) {
        airportMarkersRef.current[code].remove();
        delete airportMarkersRef.current[code];
      }
    });

    // Custom airport icon builder (smaller blue circles)
    const createAirportHubIcon = (code) => L.divIcon({
      html: `<div style="display: flex; align-items: center; justify-content: center;">
               <div style="height: 12px; width: 12px; border-radius: 50%; background-color: #3b82f6; border: 2.5px solid #ffffff; box-shadow: 0 0 6px rgba(59, 130, 246, 0.8);"></div>
             </div>`,
      className: 'airport-hub-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    // Add or update airport markers
    uniqueAirports.forEach(a => {
      const position = [a.lat, a.lon];

      // Calculate departures/arrivals
      const departures = flights.filter(f => f.departure?.code === a.code).length;
      const arrivals = flights.filter(f => f.destination?.code === a.code).length;

      // Construct popup HTML
      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 140px;">
          <h4 style="margin: 0 0 2px; font-weight: 900; font-size: 13px; color: #f43f5e; display: flex; align-items: center; gap: 4px;">
            ${a.code}
          </h4>
          <p style="margin: 0 0 6px; font-size: 10px; font-weight: 700; color: #475569;">${a.city}, ${a.country}</p>
          <div style="font-size: 10px; font-weight: 700; border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; flex-direction: column; gap: 2px;">
            <span style="color: #059669;">Departures: ${departures}</span>
            <span style="color: #2563eb;">Arrivals: ${arrivals}</span>
          </div>
        </div>
      `;

      if (airportMarkersRef.current[a.code]) {
        const marker = airportMarkersRef.current[a.code];
        marker.setLatLng(position);
        marker.getPopup().setContent(popupContent);
      } else {
        const marker = L.marker(position, { icon: createAirportHubIcon(a.code) })
          .addTo(map)
          .bindPopup(popupContent, { closeButton: false });

        airportMarkersRef.current[a.code] = marker;
      }
    });

  }, [flights, leafletLoaded]);

  // Center map on selected flight
  const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([flight.latitude, flight.longitude], 6, { animate: true });
    }
    if (viewMode === 'list') {
      setViewMode('split');
    }
    // On small mobile screens (<768px), collapse the sidebar list so the map and flight details bottom card are immediately visible
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const filteredFlights = flights.filter(f =>
    f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.originCountry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalFlights = flights.length;
  const avgSpeed = totalFlights > 0 ? Math.round(flights.reduce((acc, f) => acc + f.velocity, 0) / totalFlights) : 0;
  const avgAltitude = totalFlights > 0 ? Math.round(flights.reduce((acc, f) => acc + f.altitude, 0) / totalFlights) : 0;

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar activeTab="tracker" />

      {/* Main Container (Full screen below navbar) */}
      <div className="flex-1 relative overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>

        {/* Map canvas container (Full screen background) */}
        <div ref={mapRef} className="w-full h-full z-0" style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }} />

        {!leafletLoaded && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 space-y-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <Activity className="h-10 w-10 text-rose-500 animate-pulse" />
            <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading Radar Maps...</p>
          </div>
        )}
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => {
            const nextState = !sidebarOpen;
            setSidebarOpen(nextState);
            setTimeout(() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
              }
            }, 300);
          }}
          className={`absolute top-4 z-20 p-2.5 rounded-xl shadow-xl border backdrop-blur-md transition active:scale-95 flex items-center justify-center cursor-pointer ${sidebarOpen ? 'hidden md:flex' : 'flex'
            } ${isDark ? 'bg-slate-900/95 text-white border-slate-700 hover:bg-slate-800' : 'bg-white/95 text-slate-800 border-slate-200 hover:bg-slate-50'}`}
          style={{ left: sidebarOpen ? (window.innerWidth < 768 ? '16px' : '396px') : '16px', transition: 'left 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}
          title={sidebarOpen ? "Hide Radar List" : "Show Radar List"}
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {/* Floating Sidebar Panel (Overlay) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -380, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`absolute top-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-[330px] md:top-4 md:bottom-4 md:left-4 md:w-[350px] max-h-[35vh] sm:max-h-[40vh] md:max-h-none z-10 flex flex-col rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-md ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}
              style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)', color: isDark ? '#ffffff' : '#0f172a' }}
            >
              {/* Header & Search */}
              <div className={`p-2.5 sm:p-4 border-b shrink-0 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-1 mb-0.5">
                      <div className="p-1 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
                        <Radio className="h-3 w-3 animate-pulse" />
                      </div>
                      <span className="text-[8.5px] sm:text-[9.5px] font-black text-rose-500 uppercase tracking-widest">{t('live_tracker') || 'Live Aviation Radar'}</span>
                    </div>
                    <h1 className="text-base sm:text-xl font-black tracking-tight">{t('sky_radar')}</h1>
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-bold text-slate-400">
                    <button
                      onClick={fetchFlights}
                      disabled={loading}
                      className={`p-1.5 rounded-lg border transition active:scale-95 disabled:opacity-50 cursor-pointer ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-650'}`}
                      title="Refresh Radar"
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition active:scale-95 cursor-pointer md:hidden"
                      title="Hide Panel"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-1 mb-2">
                  <div className={`p-1.5 rounded-xl text-center shadow-sm ${isDark ? 'bg-slate-900/80 text-white' : 'bg-slate-50 text-slate-800'}`}>
                    <p className={`text-[7.5px] sm:text-[9px] uppercase font-extrabold tracking-wider mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('tracked')}</p>
                    <p className="text-xs sm:text-base font-black text-rose-500">{totalFlights}</p>
                  </div>
                  <div className={`p-1.5 rounded-xl text-center shadow-sm ${isDark ? 'bg-slate-900/80 text-white' : 'bg-slate-50 text-slate-800'}`}>
                    <p className={`text-[7.5px] sm:text-[9px] uppercase font-extrabold tracking-wider mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('avg_speed')}</p>
                    <p className="text-[11px] sm:text-xs font-black">{avgSpeed} <span className="text-[7.5px] font-normal">kts</span></p>
                  </div>
                  <div className={`p-1.5 rounded-xl text-center shadow-sm ${isDark ? 'bg-slate-900/80 text-white' : 'bg-slate-50 text-slate-800'}`}>
                    <p className={`text-[7.5px] sm:text-[9px] uppercase font-extrabold tracking-wider mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('avg_altitude')}</p>
                    <p className="text-[11px] sm:text-xs font-black">{Math.round(avgAltitude / 1000)}k <span className="text-[7.5px] font-normal">ft</span></p>
                  </div>
                </div>

                <div className="relative">
                  <Search className={`absolute left-2.5 top-2 h-3 w-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-rose-500/50 ${isDark ? 'border-slate-800 bg-slate-900/60 text-white' : 'border-slate-200 bg-white text-slate-800'}`}
                  />
                </div>
              </div>

              {/* Flights list */}
              <div className="flex-1 overflow-y-auto p-1.5 sm:p-2.5 space-y-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2">
                    <div className="h-5 w-5 border-2 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
                    <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Scanning skies for aircraft...</p>
                  </div>
                ) : error && flights.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-slate-450 space-y-1.5">
                    <ShieldAlert className="h-6 w-6 text-rose-500" />
                    <p className="text-xs font-bold">{error}</p>
                    <button onClick={fetchFlights} className="text-xs font-bold text-rose-500 underline cursor-pointer">Try again</button>
                  </div>
                ) : filteredFlights.length === 0 ? (
                  <div className={`text-center py-6 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No active flights matching search criteria.
                  </div>
                ) : (
                  filteredFlights.map(f => {
                    const isSelected = selectedFlight?.icao24 === f.icao24;
                    return (
                      <div
                        key={f.icao24}
                        onClick={() => handleSelectFlight(f)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between group 
                          ${isSelected ? 'border-rose-500/50 shadow-sm scale-[1.01]' : (isDark ? 'border-slate-800/80 hover:border-slate-700' : 'border-slate-150 hover:border-slate-300')}
                        `}
                        style={{
                          backgroundColor: isSelected ? (isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.08)') : (isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.6)')
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg transition-colors duration-200 
                            ${isSelected ? 'bg-rose-500 text-white' : (isDark ? 'bg-slate-850 text-slate-400 group-hover:text-white' : 'bg-slate-200 text-slate-500 group-hover:text-slate-800')}
                          `}>
                            <Plane className="h-3 w-3" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <p className={`text-xs font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-850'}`}>{f.callsign || 'N/A'}</p>
                              {f.departure && f.destination && (
                                <span className="text-[8px] font-black text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">
                                  {f.departure.code} ➔ {f.destination.code}
                                </span>
                              )}
                            </div>
                            <p className={`text-[8.5px] font-semibold flex items-center space-x-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <Globe className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate max-w-[110px]">{f.airlineName || f.originCountry}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`text-[10px] font-extrabold ${isDark ? 'text-white' : 'text-slate-850'}`}>{f.altitude.toLocaleString()} <span className={`text-[7px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>FT</span></p>
                          <p className={`text-[8.5px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{f.velocity} <span className="text-[7px] font-normal">KTS</span></p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Countdown Refresh Footer */}
              <div className={`p-2 border-t text-center text-[8.5px] font-semibold shrink-0 ${isDark ? 'border-slate-800/80 text-slate-400 bg-slate-900/50' : 'border-slate-200 text-slate-550 bg-slate-50'}`}>
                <span className="flex items-center justify-center space-x-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Next update in <strong className="text-rose-500 font-black">{countdown}s</strong></span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details Modal Floating Card */}
        <AnimatePresence>
          {selectedFlight && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className={`absolute bottom-20 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-24 max-w-sm sm:w-[350px] mx-auto sm:mx-0 z-30 rounded-2xl border p-3 sm:p-4 shadow-2xl backdrop-blur-lg max-h-[46vh] sm:max-h-[85vh] overflow-y-auto ${isDark ? 'bg-slate-950/92 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-800'}`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                <div className="flex items-center space-x-2 sm:space-x-2.5">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/35">
                    <Plane className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight leading-none mb-0.5">{selectedFlight.callsign}</h2>
                    <p className={`text-[10px] sm:text-xs font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                      {selectedFlight.airlineName || 'International Air'} • {selectedFlight.aircraftType || 'Commercial Jet'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFlight(null)}
                  className={`p-1 rounded-lg transition cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Route Visualizer Card */}
              {selectedFlight.departure && selectedFlight.destination && (
                <div className={`mb-2 p-2.5 sm:p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-lg sm:text-xl font-black tracking-tight text-rose-500 leading-none mb-0.5">{selectedFlight.departure.code}</p>
                      <p className={`text-[9px] font-bold truncate max-w-[85px] ${isDark ? 'text-slate-300' : 'text-slate-605'}`} title={selectedFlight.departure.city}>
                        {selectedFlight.departure.city}
                      </p>
                    </div>
                    <div className="flex-1 px-3 flex flex-col items-center relative">
                      <div className={`w-full border-t border-dashed relative top-1 flex items-center justify-center ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                        <Plane className="h-3 w-3 text-rose-500 absolute -top-1.5 rotate-90" />
                      </div>
                      <span className="text-[7.5px] text-rose-400 font-black mt-2 tracking-wider">{t('en_route')}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-xl font-black tracking-tight text-rose-500 leading-none mb-0.5">{selectedFlight.destination.code}</p>
                      <p className={`text-[9px] font-bold truncate max-w-[85px] ${isDark ? 'text-slate-300' : 'text-slate-605'}`} title={selectedFlight.destination.city}>
                        {selectedFlight.destination.city}
                      </p>
                    </div>
                  </div>
                  <div className={`mt-2 text-[8px] font-semibold border-t pt-1.5 flex justify-between ${isDark ? 'text-slate-400 border-slate-800/80' : 'text-slate-550 border-slate-200'}`}>
                    <span className="truncate max-w-[120px]"><span className="text-slate-500">{t('origin')}:</span> {selectedFlight.departure.name}</span>
                    <span className="truncate max-w-[120px]"><span className="text-slate-500">{t('dest')}:</span> {selectedFlight.destination.name}</span>
                  </div>
                </div>
              )}

              {/* Details Grid: 4 compact columns */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                <div className={`p-1.5 rounded-lg border text-center ${isDark ? 'bg-slate-900/80 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[7.5px] font-bold uppercase tracking-tight flex items-center justify-center space-x-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Compass className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                    <span>{t('altitude')}</span>
                  </p>
                  <p className="text-[11px] sm:text-xs font-black mt-0.5 leading-tight">{selectedFlight.altitude.toLocaleString()} <span className={`text-[7px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>FT</span></p>
                </div>
                <div className={`p-1.5 rounded-lg border text-center ${isDark ? 'bg-slate-900/80 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[7.5px] font-bold uppercase tracking-tight flex items-center justify-center space-x-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Navigation className="h-2.5 w-2.5 text-sky-400 shrink-0" />
                    <span>{t('speed')}</span>
                  </p>
                  <p className="text-[11px] sm:text-xs font-black mt-0.5 leading-tight">{selectedFlight.velocity} <span className={`text-[7px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>KTS</span></p>
                </div>
                <div className={`p-1.5 rounded-lg border text-center ${isDark ? 'bg-slate-900/80 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[7.5px] font-bold uppercase tracking-tight flex items-center justify-center space-x-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Compass className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                    <span>{t('heading')}</span>
                  </p>
                  <p className="text-[11px] sm:text-xs font-black mt-0.5 leading-tight">{Math.round(selectedFlight.heading)}° <span className={`text-[7px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TRUE</span></p>
                </div>
                <div className={`p-1.5 rounded-lg border text-center ${isDark ? 'bg-slate-900/80 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[7.5px] font-bold uppercase tracking-tight flex items-center justify-center space-x-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Cloud className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                    <span>{t('vrate')}</span>
                  </p>
                  <p className="text-[11px] sm:text-xs font-black mt-0.5 leading-tight">
                    {selectedFlight.verticalRate > 0 ? `+${selectedFlight.verticalRate}` : selectedFlight.verticalRate} <span className={`text-[7px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>FPM</span>
                  </p>
                </div>
              </div>

              {/* Additional Technical Meta */}
              <div className={`flex items-center justify-between text-[8.5px] border-t pt-1.5 ${isDark ? 'text-slate-400 border-slate-800/60' : 'text-slate-500 border-slate-150'}`}>
                <span>ICAO24: <strong>{selectedFlight.icao24}</strong></span>
                <span>Coords: <strong>{selectedFlight.latitude.toFixed(3)}, {selectedFlight.longitude.toFixed(3)}</strong></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Legend Overlay */}
        <div
          className={`absolute bottom-6 z-10 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-[10px] font-bold space-y-1.5 pointer-events-none hidden md:block border ${isDark ? 'bg-slate-900/90 text-white border-slate-800' : 'bg-white/95 text-slate-800 border-slate-200'}`}
          style={{
            left: sidebarOpen ? '398px' : '24px',
            transition: 'left 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          <p className={`text-[9px] uppercase tracking-wider mb-1 border-b pb-1 ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-150'}`}>{t('legend_title')}</p>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></div>
            <span>{t('legend_cruising')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
            <span>{t('legend_transition')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
            <span>{t('legend_approach')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div>
            <span>{t('legend_selected')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
