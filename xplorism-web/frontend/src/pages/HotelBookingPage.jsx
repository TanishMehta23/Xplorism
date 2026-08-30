import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel, Search, Calendar, Users, Star, MapPin,
  Wifi, SlidersHorizontal, Check, ShieldAlert,
  ArrowLeft, CheckCircle2, ChevronRight, Info,
  Plane, Train, Bus, ExternalLink, Ticket
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Pre-defined high-quality hotel templates to generate mock hotels dynamically
const HOTEL_TEMPLATES = [
  {
    name: "The Ritz-Carlton Majestic",
    stars: 5,
    rating: 9.6,
    reviewsCount: 1420,
    price: 450,
    amenities: ["WiFi", "Pool", "Gym", "Spa", "Breakfast", "AC"],
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
    description: "Experience world-class service, high-end fine dining, and breathtaking views of the city skyline."
  },
  {
    name: "Grand Plaza & Suites",
    stars: 4,
    rating: 8.9,
    reviewsCount: 980,
    price: 220,
    amenities: ["WiFi", "Gym", "Breakfast", "AC"],
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
    description: "Modern elegance in the heart of downtown. Perfect for business travelers and vacationing families alike."
  },
  {
    name: "Boutique Oasis Retreat",
    stars: 4,
    rating: 9.2,
    reviewsCount: 450,
    price: 180,
    amenities: ["WiFi", "Pool", "Spa", "AC"],
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
    description: "A tranquil sanctuary featuring local artisan decor, tropical gardens, and an organic wellness spa."
  },
  {
    name: "Urban Style Inn",
    stars: 3,
    rating: 8.3,
    reviewsCount: 720,
    price: 110,
    amenities: ["WiFi", "Breakfast", "AC"],
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80",
    description: "Sleek, minimalist rooms offering everything you need for an affordable and connected city escape."
  },
  {
    name: "Aura Premium Wellness Lodge",
    stars: 5,
    rating: 9.5,
    reviewsCount: 310,
    price: 380,
    amenities: ["WiFi", "Pool", "Gym", "Spa", "Breakfast", "AC"],
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    description: "Indulge in holistic therapies, infinity pools, and organic farm-to-table cuisine surrounded by nature."
  },
  {
    name: "Parkview Executive Hotel",
    stars: 4,
    rating: 8.7,
    reviewsCount: 640,
    price: 160,
    amenities: ["WiFi", "Gym", "AC"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&w=600&q=80",
    description: "Spacious suites adjacent to central parks, providing a peaceful environment with prime access."
  },
  {
    name: "Backpackers Central Lodge",
    stars: 2,
    rating: 7.9,
    reviewsCount: 380,
    price: 45,
    amenities: ["WiFi", "AC"],
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
    description: "Cozy budget stay close to main transport hubs. Clean rooms with vibrant common spaces for travelers."
  },
  {
    name: "City Express Stay & Hostel",
    stars: 1,
    rating: 7.4,
    reviewsCount: 210,
    price: 25,
    amenities: ["WiFi"],
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    description: "Budget-friendly single & dorm accommodations equipped with high-speed Internet for solo wanderers."
  }
];

// Helper to resolve local currency details based on geocoded location string
const getCurrencyDetails = (destString) => {
  const ds = (destString || '').toLowerCase();
  if (ds.includes('india') || ds.includes('haridwar') || ds.includes('delhi') || ds.includes('mumbai') || ds.includes('goa') || ds.includes('bangalore')) {
    return { symbol: '₹', rate: 83, code: 'INR' };
  }
  if (ds.includes('united kingdom') || ds.includes('uk') || ds.includes('london') || ds.includes('scotland')) {
    return { symbol: '£', rate: 0.78, code: 'GBP' };
  }
  if (ds.includes('france') || ds.includes('paris') || ds.includes('germany') || ds.includes('italy') || ds.includes('spain') || ds.includes('europe')) {
    return { symbol: '€', rate: 0.92, code: 'EUR' };
  }
  if (ds.includes('japan') || ds.includes('tokyo') || ds.includes('kyoto') || ds.includes('osaka')) {
    return { symbol: '¥', rate: 150, code: 'JPY' };
  }
  if (ds.includes('australia') || ds.includes('sydney') || ds.includes('melbourne') || ds.includes('brisbane')) {
    return { symbol: 'A$', rate: 1.5, code: 'AUD' };
  }
  return { symbol: '$', rate: 1, code: 'USD' };
};

export default function HotelBookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Search & Travel Mode States
  const [activeSearchTab, setActiveSearchTab] = useState('hotels'); // 'hotels', 'flights', 'trains', 'buses'
  const [origin, setOrigin] = useState('');
  const [flightsData, setFlightsData] = useState([]);
  const [transitData, setTransitData] = useState([]);
  const [destination, setDestination] = useState('');
  const [tripType, setTripType] = useState('oneway'); // 'oneway' or 'roundtrip'
  const [flightDepartureDate, setFlightDepartureDate] = useState('');
  const [flightReturnDate, setFlightReturnDate] = useState('');
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [currency, setCurrency] = useState({ symbol: '$', rate: 1, code: 'USD' });

  // Fetch autocomplete suggestions for destination (Airports for flights, Geocode for hotels/trains/buses)
  useEffect(() => {
    if (destination.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        if (activeSearchTab === 'flights') {
          const data = await api.get(`/travel/airports?q=${encodeURIComponent(destination)}`);
          if (data && data.length > 0) {
            setSuggestions(data.slice(0, 8));
          } else {
            setSuggestions([]);
          }
        } else {
          const data = await api.get(`/geocode?q=${encodeURIComponent(destination)}`);
          if (data && data.length > 0) {
            setSuggestions(data.slice(0, 6));
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        console.error('Destination autocomplete error:', err);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [destination, activeSearchTab]);

  // Fetch autocomplete suggestions for origin (Airports for flights, Geocode for trains/buses)
  useEffect(() => {
    if (origin.trim().length < 1) {
      setOriginSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        if (activeSearchTab === 'flights') {
          const data = await api.get(`/travel/airports?q=${encodeURIComponent(origin)}`);
          if (data && data.length > 0) {
            setOriginSuggestions(data.slice(0, 8));
          } else {
            setOriginSuggestions([]);
          }
        } else {
          const data = await api.get(`/geocode?q=${encodeURIComponent(origin)}`);
          if (data && data.length > 0) {
            setOriginSuggestions(data.slice(0, 6));
          } else {
            setOriginSuggestions([]);
          }
        }
      } catch (err) {
        console.error('Origin autocomplete error:', err);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [origin, activeSearchTab]);


  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
      if (!e.target.closest('.search-origin-container')) {
        setShowOriginSuggestions(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter States
  const [minStars, setMinStars] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Data States
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [mobileTab, setMobileTab] = useState('list');
  const [userTrips, setUserTrips] = useState([]);

  // Geocoding & Map States
  const [mapCoords, setMapCoords] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [markersList, setMarkersList] = useState([]);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [transitOriginCoords, setTransitOriginCoords] = useState(null);
  const [transitDestCoords, setTransitDestCoords] = useState(null);
  const [transitMapInstance, setTransitMapInstance] = useState(null);
  const [transitMarkersList, setTransitMarkersList] = useState([]);

  // Booking Flow States
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingTripId, setBookingTripId] = useState('');
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);
  const tripDropdownRef = React.useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (tripDropdownRef.current && !tripDropdownRef.current.contains(e.target)) {
        setTripDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [roomType, setRoomType] = useState('standard');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingConfirm, setBookingConfirm] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  // Load Leaflet and Razorpay dynamically on mount
  useEffect(() => {
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setIsLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLeafletLoaded(true);
    }

    // Payment integration disabled for now — do not inject Razorpay script.

    // Fetch user's trips for booking integration
    api.get('/trips')
      .then(data => {
        setUserTrips(data || []);
        if (data && data.length > 0) {
          setBookingTripId(data[0].id);
        }
      })
      .catch(err => {
        console.error('Failed to load trips:', err);
      });
  }, []);

  // Auto-search travel options when active search tab changes, but only if user has already executed a search
  useEffect(() => {
    if (hasSearched && destination) {
      handleSearch();
    }
  }, [activeSearchTab]);

  useEffect(() => {
    if (mobileTab === 'map' && mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 150);
    }
  }, [mobileTab, mapInstance]);

  // If navigated back from mock payment with bookingConfirm, show it
  useEffect(() => {
    if (location.state && location.state.bookingConfirm) {
      setBookingConfirm(location.state.bookingConfirm);
      // clear history state to avoid showing repeatedly
      setBookingLoading(false);
      navigate('/hotels', { replace: true, state: {} });
    }
  }, [location]);

  // Bookings persistence: load saved bookings and persist new confirmations
  useEffect(() => {
    const loadLocal = () => {
      try {
        const raw = localStorage.getItem('xplorism_bookings');
        if (raw) {
          const parsed = JSON.parse(raw);
          setBookings(parsed || []);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.warn('Failed to load saved bookings:', err.message);
      }
    };

    // Try to fetch from API if authenticated
    api.get('/bookings')
      .then(data => {
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          loadLocal();
        }
      })
      .catch(() => loadLocal());
  }, []);

  useEffect(() => {
    if (!bookingConfirm) return;
    setBookings(prev => {
      if (prev.some(b => b.confirmationNumber === bookingConfirm.confirmationNumber)) return prev;
      const next = [bookingConfirm, ...prev];
      try { localStorage.setItem('xplorism_bookings', JSON.stringify(next)); } catch (err) { console.warn('Failed to save booking:', err.message); }
      return next;
    });
  }, [bookingConfirm]);

  // Handle Search Submission
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!destination.trim()) {
      alert('Please enter a destination.');
      return;
    }

    setSearchLoading(true);
    setHasSearched(true);
    setSelectedHotel(null);

    try {
      // 1. Geocode location via proxy / airports
      let centerCoords = [28.5562, 77.1000]; // Delhi default
      let resolvedAddress = destination;

      if (activeSearchTab === 'flights') {
        try {
          const airportData = await api.get(`/travel/airports?q=${encodeURIComponent(destination)}`);
          if (Array.isArray(airportData) && airportData.length > 0) {
            centerCoords = [parseFloat(airportData[0].lat), parseFloat(airportData[0].lon)];
            resolvedAddress = airportData[0].display_name || destination;
          }
        } catch (e) {
          console.warn('Flight airport destination geocode fallback:', e.message);
        }
      } else {
        const data = await api.get(`/geocode?q=${encodeURIComponent(destination)}`);
        if (data && data.length > 0) {
          centerCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          resolvedAddress = data[0].display_name || destination;
        }
      }

      setMapCoords(centerCoords);
      setTransitDestCoords(centerCoords);

      // Geocode origin for transit if it's not hotels
      if (activeSearchTab !== 'hotels') {
        const queryOrigin = origin.trim();
        if (queryOrigin) {
          try {
            if (activeSearchTab === 'flights') {
              const origAirport = await api.get(`/travel/airports?q=${encodeURIComponent(queryOrigin)}`);
              if (Array.isArray(origAirport) && origAirport.length > 0) {
                setTransitOriginCoords([parseFloat(origAirport[0].lat), parseFloat(origAirport[0].lon)]);
              } else {
                setTransitOriginCoords([28.5562, 77.1000]); // Delhi
              }
            } else {
              const origData = await api.get(`/geocode?q=${encodeURIComponent(queryOrigin)}`);
              if (origData && origData.length > 0) {
                setTransitOriginCoords([parseFloat(origData[0].lat), parseFloat(origData[0].lon)]);
              } else {
                setTransitOriginCoords([centerCoords[0] + 0.1, centerCoords[1] - 0.1]);
              }
            }
          } catch (origErr) {
            console.warn('Origin geocoding error, using fallback offset:', origErr);
            setTransitOriginCoords([28.5562, 77.1000]);
          }
        }
      }



      const cur = getCurrencyDetails(resolvedAddress);
      setCurrency(cur);
      if (cur.code === 'INR') {
        setMaxPrice(50000);
      } else {
        setMaxPrice(2000);
      }

      if (activeSearchTab === 'flights') {
        const queryOrigin = origin.trim() || 'New Delhi';
        const flightsRes = await api.get(`/travel/flights?origin=${encodeURIComponent(queryOrigin)}&destination=${encodeURIComponent(destination)}&departureDate=${encodeURIComponent(flightDepartureDate)}&returnDate=${encodeURIComponent(flightReturnDate)}&tripType=${encodeURIComponent(tripType)}&currency=${cur.code}`);
        setFlightsData(Array.isArray(flightsRes) ? flightsRes : []);
      } else if (activeSearchTab === 'trains' || activeSearchTab === 'buses') {
        const mode = activeSearchTab === 'trains' ? 'train' : 'bus';
        const queryOrigin = origin.trim() || 'Delhi';
        const transitRes = await api.get(`/travel/transit?origin=${encodeURIComponent(queryOrigin)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(flightDepartureDate)}&mode=${mode}&currency=${cur.code}`);
        setTransitData(Array.isArray(transitRes) ? transitRes : []);
      } else {
        // Hotels Search
        let finalHotels = [];
        try {
          const serpData = await api.get(`/travel/hotels?location=${encodeURIComponent(destination)}&currency=${cur.code}`);

          if (Array.isArray(serpData) && serpData.length > 0) {
            finalHotels = serpData.map((el, idx) => {
              const tpl = HOTEL_TEMPLATES[idx % HOTEL_TEMPLATES.length];
              return {
                id: el.id || `hotel-serp-${idx}-${Date.now()}`,
                name: el.name,
                stars: Number(el.stars) || tpl.stars,
                rating: el.rating ? (el.rating > 5 ? (el.rating / 2).toFixed(1) : el.rating) : 4.4,
                reviewsCount: el.reviewsCount || 420,
                price: el.price || tpl.price,
                amenities: el.amenities || tpl.amenities,
                image: tpl.image,
                description: el.description || tpl.description,
                bookingUrl: `https://www.google.com/travel/search?q=${encodeURIComponent(el.name + ' ' + destination)}`,
                provider: el.provider || 'Google Hotels',
                lat: centerCoords[0] + (Math.random() - 0.5) * 0.015,
                lon: centerCoords[1] + (Math.random() - 0.5) * 0.015,
                distance: (Math.random() * 2 + 0.3).toFixed(1)
              };
            });
          }
        } catch (serpErr) {
          console.warn('Google Travel Hotels fetch error:', serpErr);
        }

        setHotels(finalHotels);
        setFilteredHotels(finalHotels);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setMapCoords([48.8566, 2.3522]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Filter Hotels when filters change
  useEffect(() => {
    if (hotels.length === 0) {
      setFilteredHotels([]);
      return;
    }

    const filtered = hotels.filter(hotel => {
      const matchStars = minStars === 0 ? true : hotel.stars === minStars;
      const matchPrice = hotel.price <= maxPrice;
      const matchAmenities = selectedAmenities.every(amenity =>
        (hotel.amenities || []).includes(amenity)
      );
      return matchStars && matchPrice && matchAmenities;
    });

    setFilteredHotels(filtered);
  }, [hotels, minStars, maxPrice, selectedAmenities]);

  // Load/Update Map Leaflet instance (runs only when coordinates/search query change)
  useEffect(() => {
    if (!isLeafletLoaded || !mapCoords || !hasSearched) return;

    const container = document.getElementById('hotels-map-container');
    if (!container) return;

    // Only rebuild map instance if it doesn't exist
    if (container._leaflet_id && !mapInstance) {
      container.innerHTML = '';
      container._leaflet_id = null;
    }

    let map = mapInstance;
    if (!map) {
      map = window.L.map('hotels-map-container', {
        zoomControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true
      }).setView(mapCoords, 14);

      window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '© Google Maps'
      }).addTo(map);

      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
      setMapInstance(map);

      // Force recalculate dimensions on next render tick
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } else {
      map.setView(mapCoords, 14);
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [isLeafletLoaded, mapCoords, hasSearched]);

  // Synchronize Markers (runs when filteredHotels or currency change, without reloading map tiles)
  useEffect(() => {
    if (!mapInstance) return;

    // Clear previous markers
    markersList.forEach(m => m.marker.remove());

    const hotelPinIcon = window.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const newMarkers = [];
    filteredHotels.forEach(hotel => {
      const popupContent = `
        <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
          <h4 style="margin: 0 0 4px 0; font-weight: 700; color: #1e293b;">${hotel.name}</h4>
          <p style="margin: 0; color: #64748b; font-weight: 600;">${hotel.stars}★ Hotel • ${hotel.rating} Rating</p>
        </div>
      `;

      const marker = window.L.marker([hotel.lat, hotel.lon], { icon: hotelPinIcon })
        .addTo(mapInstance)
        .bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedHotel(hotel);
        const cardElement = document.getElementById(`hotel-card-${hotel.id}`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      newMarkers.push({ hotelId: hotel.id, marker });
    });

    setMarkersList(newMarkers);
  }, [mapInstance, filteredHotels, currency]);

  // Sync selected hotel marker highlight
  useEffect(() => {
    if (!mapInstance || !selectedHotel) return;
    const match = markersList.find(m => m.hotelId === selectedHotel.id);
    if (match) {
      match.marker.openPopup();
      mapInstance.panTo([selectedHotel.lat, selectedHotel.lon]);
    }
  }, [selectedHotel]);

  // Load/Update Transit Map Leaflet instance for Flights/Trains/Buses
  useEffect(() => {
    if (!isLeafletLoaded || !hasSearched || activeSearchTab === 'hotels') return;
    
    // Default coordinates fallback if not resolved yet
    const origCoords = transitOriginCoords || [28.5562, 77.1000]; // DEL default
    const dstCoords = transitDestCoords || [50.0379, 8.5622]; // FRA default

    const container = document.getElementById('transit-map-container');
    if (!container) return;

    // Reset container if previous instance died or got out of sync
    if (container._leaflet_id && !transitMapInstance) {
      container.innerHTML = '';
      container._leaflet_id = null;
    }

    let map = transitMapInstance;
    if (!map) {
      map = window.L.map('transit-map-container', {
        zoomControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true
      }).setView(dstCoords, 3);

      // Google Maps Standard Terrain / Street Layer
      window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20
      }).addTo(map);

      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
      setTransitMapInstance(map);
    }

    // Clear previous markers
    transitMarkersList.forEach(item => {
      try { item.remove(); } catch (e) {}
    });
    const newMarkers = [];

    // Custom modern auto-sized Pin Icons without overflow
    const createCustomIcon = (label, color, isPlane = false) => {
      return window.L.divIcon({
        className: 'custom-transit-pin',
        html: `
          <div style="
            background: ${color};
            color: #ffffff;
            padding: 5px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            display: inline-flex;
            align-items: center;
            gap: 5px;
            white-space: nowrap;
            border: 2px solid #ffffff;
            transform: translate(-50%, -50%);
            width: max-content;
          ">
            <span style="font-size: 12px; line-height: 1;">${isPlane ? '✈️' : '📍'}</span>
            <span style="letter-spacing: 0.2px;">${label}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
    };

    const originName = origin ? origin.split(/[(,]/)[0].trim() : 'Origin';
    const destName = destination ? destination.split(/[(,]/)[0].trim() : 'Destination';

    const originPin = window.L.marker(origCoords, {
      icon: createCustomIcon(originName, '#4f46e5', false)
    }).addTo(map).bindPopup(`<b>Origin:</b> ${origin || originName}`);

    const destPin = window.L.marker(dstCoords, {
      icon: createCustomIcon(destName, '#e11d48', true)
    }).addTo(map).bindPopup(`<b>Destination:</b> ${destination || destName}`);

    // Generate smooth curved flight path (Great-circle / Bezier flight arc)
    const generateCurvedPath = (start, end, numPoints = 60) => {
      const [lat1, lon1] = start;
      const [lat2, lon2] = end;

      // Midpoint
      const midLat = (lat1 + lat2) / 2;
      const midLon = (lon1 + lon2) / 2;

      // Distance and elevation offset for realistic aviation arc
      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);

      // Arc offset perpendicular to flight direction (northward curve)
      const arcHeight = Math.min(Math.max(dist * 0.22, 3), 18);
      const controlLat = midLat + arcHeight;
      const controlLon = midLon;

      const points = [];
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        // Quadratic Bezier interpolation: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
        const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
        const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * controlLon + t * t * lon2;
        points.push([lat, lon]);
      }
      return points;
    };

    const pathCoordinates = activeSearchTab === 'flights' 
      ? generateCurvedPath(origCoords, dstCoords) 
      : [origCoords, dstCoords];

    // Create flight route curved path
    const flightPath = window.L.polyline(pathCoordinates, {
      color: '#e11d48',
      weight: 3.5,
      opacity: 0.85,
      dashArray: activeSearchTab === 'flights' ? '8, 8' : '0',
      smoothFactor: 1
    }).addTo(map);

    newMarkers.push(originPin, destPin, flightPath);
    setTransitMarkersList(newMarkers);

    // Zoom map to fit curved path bounds
    try {
      const bounds = window.L.latLngBounds(pathCoordinates);
      map.fitBounds(bounds.pad(0.35));
    } catch (err) {
      console.warn('fitBounds error:', err);
    }


    // Force map tile recalculation
    const t1 = setTimeout(() => { if (map) map.invalidateSize(); }, 100);
    const t2 = setTimeout(() => { if (map) map.invalidateSize(); }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLeafletLoaded, transitOriginCoords, transitDestCoords, hasSearched, activeSearchTab, flightsData]);



  // Toggle Amenity Filter Selection
  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  // Trigger Booking Confirmation Simulation with Razorpay Payment Modal
  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!guestName || !guestEmail) return;

    // Dates are mandatory for booking
    if (!checkIn || !checkOut) {
      alert('Please select both check-in and check-out dates before confirming.');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      alert('Check-out date must be after check-in date.');
      return;
    }

    const numRooms = parseInt(rooms) || 1;
    const nights = Math.max(1, Math.ceil(Math.abs(new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const rawUSDPrice = bookingHotel.price * numRooms;
    const finalLocalPrice = Math.round(rawUSDPrice * nights);

    // If Razorpay SDK is not loaded, fallback to normal booking confirmation
    // Navigate to mock payment page to simulate Razorpay-like checkout
    const bookingData = {
      bookingHotel,
      rawUSDPrice,
      finalLocalPrice,
      nights,
      rooms: numRooms,
      currency,
      roomType: 'Standard Room',
      guests,
      checkIn,
      checkOut,
      bookingTripId,
      guestName,
      guestEmail,
      associatedTrip: userTrips.find(t => t.id === bookingTripId)?.destination || 'General Dashboard'
    };

    setBookingLoading(true);
    navigate('/mock-payment', { state: { bookingData } });
    return;

    const options = {
      key: "rzp_test_demoKey123456", // Test key for simulation
      amount: finalLocalPrice * 100, // Razorpay takes amounts in lowest unit (e.g. Paisa or Cents)
      currency: currency.code === 'A$' ? 'AUD' : currency.code,
      name: "Xplorism Hotels Ltd",
      description: `Stay Reservation at ${bookingHotel.name}`,
      image: "/logo.png",
      handler: function (response) {
        // Payment successful simulation handler!
        const confNum = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
        setBookingConfirm({
          confirmationNumber: confNum,
          paymentId: response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 11)}`,
          hotelName: bookingHotel.name,
          roomType: roomType === 'deluxe' ? 'Deluxe King Room' : roomType === 'suite' ? 'Executive Suite' : 'Standard Room',
          guests: guests,
          checkIn: checkIn,
          checkOut: checkOut,
          price: rawUSDPrice,
          associatedTrip: userTrips.find(t => t.id === bookingTripId)?.destination || 'General Dashboard'
        });
        setBookingLoading(false);
        setBookingHotel(null);
      },
      prefill: {
        name: guestName,
        email: guestEmail,
        contact: "9999999999"
      },
      notes: {
        address: "Xplorism Corporate Stays"
      },
      theme: {
        color: "#f43f5e" // rose-500
      },
      modal: {
        ondismiss: function () {
          setBookingLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
      <Navbar activeTab="hotels" />

      {/* Main Dashboard Hero */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Travel & Booking Portal
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              Powered by Google Travel — search hotels, flights, trains, and buses with real pricing.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowBookingsModal(true)}
              className="flex items-center space-x-2.5 text-sm font-extrabold px-5 py-3 rounded-2xl border bg-white border-rose-200 hover:border-rose-300 text-rose-500 hover:bg-rose-50/50 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 select-none cursor-pointer dark:bg-slate-900/60 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-rose-400"
            >
              <Ticket className="h-4.5 w-4.5 text-rose-500 dark:text-rose-400" />
              <span>My Bookings</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-4 p-1.5 rounded-2xl border bg-[var(--bg-secondary)] shadow-sm w-full relative z-20" style={{ borderColor: 'var(--border-primary)' }}>
          {[
            { id: 'hotels', label: 'Hotels & Stays', icon: Hotel },
            { id: 'flights', label: 'Flights', icon: Plane },
            { id: 'trains', label: 'Trains', icon: Train },
            { id: 'buses', label: 'Buses', icon: Bus }
          ].map(tab => {
            const IconComp = tab.icon;
            const active = activeSearchTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSearchTab(tab.id);
                }}
                className={`relative flex items-center justify-center space-x-2 h-11 rounded-xl text-xs font-black transition-colors duration-200 cursor-pointer select-none leading-none ${active ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {active && (
                  <motion.div
                    layoutId="activeSearchTabIndicator"
                    className="absolute inset-0 bg-rose-600 rounded-xl shadow-lg shadow-rose-500/15"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                <IconComp className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar Panel */}
        <div className="relative z-30 rounded-3xl border p-6 mb-8 shadow-xl bg-[var(--bg-secondary)] backdrop-blur-xl transition-all" style={{ borderColor: 'var(--border-primary)' }}>
          <form onSubmit={handleSearch} className="space-y-4">
            {activeSearchTab === 'flights' && (
              <div className="flex items-center space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => setTripType('oneway')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${tripType === 'oneway' ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
                  style={{ borderColor: tripType === 'oneway' ? '#e11d48' : 'var(--border-primary)' }}
                >
                  One-Way
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('roundtrip')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${tripType === 'roundtrip' ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
                  style={{ borderColor: tripType === 'roundtrip' ? '#e11d48' : 'var(--border-primary)' }}
                >
                  Round-Trip
                </button>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSearchTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col md:flex-row items-stretch md:items-end gap-4"
              >
                {activeSearchTab !== 'hotels' && (
                  <div className="space-y-2 relative search-origin-container flex-1">
                    <label className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      <span>From (Origin)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => {
                          setOrigin(e.target.value);
                          setShowOriginSuggestions(true);
                        }}
                        onFocus={() => setShowOriginSuggestions(true)}
                        placeholder={activeSearchTab === 'flights' ? 'Airport or City (e.g. DEL or Delhi)' : 'Origin City (e.g. Delhi)'}
                        className="w-full bg-[var(--bg-primary)] border rounded-2xl px-5 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-inner"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                        autoComplete="off"
                        required
                      />
                    </div>

                    {/* Origin Autocomplete Suggestions */}
                    <AnimatePresence>
                      {showOriginSuggestions && originSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto border rounded-2xl shadow-2xl divide-y backdrop-blur-md"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {originSuggestions.map((item) => (
                            <button
                              key={item.place_id}
                              type="button"
                              onClick={() => {
                                setOrigin(item.code ? `${item.city} (${item.code})` : item.display_name);
                                setShowOriginSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] transition flex items-center justify-between gap-2"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <div className="flex items-center space-x-2.5 truncate">
                                {item.type === 'airport' || item.code ? (
                                  <Plane className="h-4 w-4 text-rose-500 shrink-0" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                                )}
                                <div className="truncate">
                                  <div className="text-xs font-bold truncate">
                                    {item.name || item.display_name}
                                  </div>
                                  {item.city && (
                                    <div className="text-[10px] text-[var(--text-secondary)] font-medium">
                                      {item.city}, {item.country}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {item.code && (
                                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                                  {item.code}
                                </span>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="space-y-2 relative search-container flex-1">
                  <label className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    <Search className="h-3.5 w-3.5 text-rose-500" />
                    <span>{activeSearchTab === 'hotels' ? 'Search Destination' : 'To (Destination)'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder={activeSearchTab === 'flights' ? 'Airport or Destination City (e.g. BOM, DXB, London)' : 'Where are you going? (e.g. Goa, Tokyo, Paris)'}
                      className="w-full bg-[var(--bg-primary)] border rounded-2xl px-5 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-inner"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      autoComplete="off"
                      required
                    />
                  </div>

                  {/* Autocomplete Suggestions */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto border rounded-2xl shadow-2xl divide-y backdrop-blur-md"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {suggestions.map((item) => (
                          <button
                            key={item.place_id}
                            type="button"
                            onClick={() => {
                              setDestination(item.code ? `${item.city} (${item.code})` : item.display_name);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] transition flex items-center justify-between gap-2"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              {item.type === 'airport' || item.code ? (
                                <Plane className="h-4 w-4 text-rose-500 shrink-0" />
                              ) : (
                                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                              )}
                              <div className="truncate">
                                <div className="text-xs font-bold truncate">
                                  {item.name || item.display_name}
                                </div>
                                {item.city && (
                                  <div className="text-[10px] text-[var(--text-secondary)] font-medium">
                                    {item.city}, {item.country}
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.code && (
                              <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                                {item.code}
                              </span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {activeSearchTab !== 'hotels' && (
                  <>
                    <div className="space-y-2 flex-1">
                      <label className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        <Calendar className="h-3.5 w-3.5 text-rose-500" />
                        <span>Departure Date</span>
                      </label>
                      <input
                        type="date"
                        value={flightDepartureDate}
                        onChange={(e) => setFlightDepartureDate(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-inner cursor-pointer"
                        style={{ borderColor: 'var(--border-primary)', color: flightDepartureDate ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                        required
                      />
                    </div>

                    {activeSearchTab === 'flights' && tripType === 'roundtrip' && (
                      <div className="space-y-2 flex-1">
                        <label className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                          <Calendar className="h-3.5 w-3.5 text-rose-500" />
                          <span>Return Date</span>
                        </label>
                        <input
                          type="date"
                          value={flightReturnDate}
                          onChange={(e) => setFlightReturnDate(e.target.value)}
                          className="w-full bg-[var(--bg-primary)] border rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-inner cursor-pointer"
                          style={{ borderColor: 'var(--border-primary)', color: flightReturnDate ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={searchLoading}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm px-8 py-3 rounded-2xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer h-[46px] self-end border-0 shrink-0"
                >
                  {searchLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </motion.div>
            </AnimatePresence>
          </form>
        </div>

        {/* Main Dashboard Layout */}
        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-4 rounded-full bg-rose-500/10 text-rose-500">
              {activeSearchTab === 'flights' ? <Plane className="h-12 w-12" /> :
               activeSearchTab === 'trains' ? <Train className="h-12 w-12" /> :
               activeSearchTab === 'buses' ? <Bus className="h-12 w-12" /> :
               <Hotel className="h-12 w-12" />}
            </div>
            <h2 className="text-xl font-bold">
              {activeSearchTab === 'flights' ? 'Search Flights with Live Providers' :
               activeSearchTab === 'trains' ? 'Find Rail Schedules' :
               activeSearchTab === 'buses' ? 'Find Intercity Buses' :
               'Find Your Next Premium Stay'}
            </h2>
            <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
              Compare real-time schedules and prices across Google Flights, Skyscanner, and Booking.com.
            </p>
          </div>
         ) : searchLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-[var(--bg-secondary)] border rounded-3xl p-8 shadow-sm max-w-4xl mx-auto" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="h-10 w-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-base font-extrabold mt-2" style={{ color: 'var(--text-primary)' }}>Searching for real-time travel options...</h3>
            <p className="text-xs text-[var(--text-secondary)]">Please wait while we query travel aggregates and schedules.</p>
          </div>
        ) : (activeSearchTab === 'flights' || activeSearchTab === 'trains' || activeSearchTab === 'buses') ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Transit Map Panel */}
            <div className="lg:col-span-5 space-y-4 md:sticky md:top-24 self-start z-10">
              <div className="rounded-3xl border overflow-hidden shadow-sm relative h-80 lg:h-[450px] bg-slate-100 dark:bg-slate-800" style={{ borderColor: 'var(--border-primary)' }}>
                {activeSearchTab === 'flights' && (!transitOriginCoords && !transitDestCoords) ? (
                  <iframe
                    title="Flight Route Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(origin + ' to ' + destination)}&t=&z=4&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <div id="transit-map-container" className="w-full h-full min-h-[320px] lg:min-h-[450px] z-10" />
                )}
                {!isLeafletLoaded && (
                  <div className="absolute inset-0 bg-slate-50/80 z-20 flex items-center justify-center flex-col space-y-2">
                    <div className="h-6 w-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Loading Map Assets...</span>
                  </div>
                )}
              </div>
            </div>


            {/* Right Pane */}
            <div className="lg:col-span-7 space-y-4">
              {activeSearchTab === 'flights' ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      Available Flights from {origin} to {destination} ({flightsData.length} found)
                    </span>
                  </div>
                  {flightsData.length === 0 ? (
                    <p className="text-center py-10 text-sm text-[var(--text-secondary)]">No flight routes found. Try another search.</p>
                  ) : (
                    flightsData.map((f, i) => (
                      <div key={f.id ? `flight-${f.id}-${i}` : `flight-fallback-${i}`} className="p-5 rounded-3xl border bg-[var(--bg-secondary)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up" style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 text-xl font-bold shrink-0">
                            {f.logo || '✈️'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <h4 className="text-base font-extrabold text-[var(--text-primary)] whitespace-nowrap">
                                {f.airline}{' '}
                                <span className="text-xs font-semibold opacity-70 whitespace-nowrap">
                                  ({f.flightNumber})
                                </span>
                              </h4>
                              {f.originCode && f.destinationCode && (
                                <span className="inline-flex items-center text-[11px] font-mono font-extrabold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20 whitespace-nowrap shrink-0">
                                  {f.originCode} ➔ {f.destinationCode}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Outbound: {f.departureTime} ➔ {f.arrivalTime} • {f.duration} • {f.stops || 'Non-stop'}</p>
                            {f.returnDepartureTime && (
                              <p className="text-xs text-rose-500 font-semibold mt-0.5">Return ({f.returnFlightNumber || 'Return'}): {f.returnDepartureTime} ➔ {f.returnArrivalTime} • {f.returnDuration || f.duration}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                                {f.cabinClass || 'Economy'}
                              </span>
                              {tripType === 'roundtrip' && (
                                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                                  Round-Trip
                                </span>
                              )}
                            </div>
                          </div>
                        </div>


                        {/* Booking & Price Buttons */}
                        <div className="flex flex-col items-end gap-2.5 self-end md:self-auto shrink-0">
                          <div className="text-right">
                            <span className="text-xs text-[var(--text-tertiary)] block">Fare Starts From</span>
                            <span className="text-xl font-black text-rose-500">{f.currencySymbol || '$'}{f.price}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 justify-end">
                            {f.skyscannerUrl && (
                              <a
                                href={f.skyscannerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Search & Compare on Skyscanner"
                                className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] px-3 py-2 rounded-xl transition shadow-sm border-0"
                              >
                                <span>Skyscanner</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {f.kayakUrl && (
                              <a
                                href={f.kayakUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Search & Compare on Kayak"
                                className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] px-3 py-2 rounded-xl transition shadow-sm border-0"
                              >
                                <span>Kayak</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <a
                              href={f.googleFlightsUrl || f.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Search & Compare on Google Flights"
                              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3 py-2 rounded-xl transition shadow-sm border-0"
                            >
                              <span>Google Flights</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (

                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      {activeSearchTab === 'trains' ? 'Train Schedules' : 'Intercity Bus Routes'} from {origin} to {destination} ({transitData.length} found)
                    </span>
                  </div>
                  {transitData.length === 0 ? (
                    <div className="rounded-3xl border border-dashed p-12 text-center space-y-3 bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border-primary)' }}>
                      <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto" />
                      <h4 className="text-base font-extrabold">No Direct Routes Available</h4>
                      <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {activeSearchTab === 'trains' 
                          ? `No direct railway stations or train tracks connect ${origin || 'Origin'} and ${destination}. Try searching for nearby major junction stations or switch to Buses/Flights.`
                          : `No direct bus service operates on this route. Try adjusting your origin or destination.`}
                      </p>
                    </div>
                  ) : (
                    transitData.map((t, i) => (
                      <div key={t.id ? `transit-${t.id}-${i}` : `transit-fallback-${i}`} className="p-5 rounded-3xl border bg-[var(--bg-secondary)] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5" style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-start space-x-4">
                          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 text-2xl font-black shrink-0 border border-indigo-500/20">
                            {activeSearchTab === 'trains' ? '🚆' : '🚌'}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-base font-black text-[var(--text-primary)]">{t.operator}</h4>
                              <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                                {t.serviceNumber}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-[var(--text-secondary)] flex items-center space-x-2">
                              <span>{t.departureTime} ({t.origin || origin})</span>
                              <span className="text-rose-500 font-bold">➔</span>
                              <span>{t.arrivalTime} ({t.destination || destination})</span>
                              <span className="text-[11px] opacity-60">({t.duration})</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {(t.classOptions || []).map((c, idx) => (
                                <span key={idx} className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-[var(--bg-primary)] border text-[var(--text-secondary)]" style={{ borderColor: 'var(--border-primary)' }}>
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 self-end md:self-auto shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Fare Starts From</span>
                            <span className="text-2xl font-black text-rose-500">{t.currencySymbol || currency.symbol}{Math.round(t.price)}</span>
                          </div>
                          <a
                            href={t.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition shadow-lg shadow-indigo-600/20 active:scale-95 border-0"
                          >
                            <span>{activeSearchTab === 'trains' ? 'IRCTC / Direct' : 'RedBus / Direct'}</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View Toggle */}
            <div className="lg:hidden flex border border-slate-200 dark:border-slate-800 mb-6 bg-[var(--bg-secondary)] rounded-2xl p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setMobileTab('list')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${mobileTab === 'list' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              Stays ({filteredHotels.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('map')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${mobileTab === 'map' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('filters')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${mobileTab === 'filters' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              Filters {selectedAmenities.length > 0 ? `(${selectedAmenities.length})` : ''}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Filter & Map Pane (Sticky on desktop) */}
            <div className={`lg:col-span-5 space-y-4 md:sticky md:top-24 self-start z-10 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>

              {/* Filter Card (Compact & Clean) */}
              <div className={`rounded-3xl border p-4 shadow-md space-y-4 ${mobileTab === 'filters' ? 'block' : 'hidden lg:block'}`} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center space-x-2 pb-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  <SlidersHorizontal className="h-4 w-4 text-rose-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">Filter Stays</h3>
                </div>

                {/* Stars Filter */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Star Rating</span>
                  <div className="flex items-center space-x-1 overflow-x-auto pb-0.5">
                    {[0, 1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        onClick={() => setMinStars(stars)}
                        className={`flex-1 min-w-[32px] py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer text-center ${minStars === stars
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'hover:bg-[var(--bg-tertiary)]'
                          }`}
                        style={{ borderColor: minStars === stars ? '#e11d48' : 'var(--border-primary)' }}
                      >
                        {stars === 0 ? 'Any' : `${stars}★`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span style={{ color: 'var(--text-tertiary)' }}>Max Price</span>
                    <span className="text-rose-500 font-extrabold">{currency.symbol}{Math.round(maxPrice)}</span>
                  </div>
                  <input
                    type="range"
                    min={currency.code === 'INR' ? 500 : 20}
                    max={currency.code === 'INR' ? 100000 : 3000}
                    step={currency.code === 'INR' ? 500 : 25}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-1 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>

                {/* Amenities Selection */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Amenities</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "WiFi", label: "Free Wi-Fi" },
                      { id: "Pool", label: "Pool" },
                      { id: "Gym", label: "Gym" },
                      { id: "Spa", label: "Spa" },
                      { id: "Breakfast", label: "Breakfast" },
                      { id: "AC", label: "AC" }
                    ].map((amenity) => (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className="flex items-center space-x-1.5 text-left p-1.5 rounded-lg border hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer text-[10px] font-semibold"
                        style={{
                          borderColor: selectedAmenities.includes(amenity.id) ? 'var(--color-success-border, #10b981)' : 'var(--border-primary)',
                          backgroundColor: selectedAmenities.includes(amenity.id) ? 'var(--color-success-bg, rgba(16,185,129,0.05))' : 'transparent'
                        }}
                      >
                        <div className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${selectedAmenities.includes(amenity.id)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-400'
                          }`}>
                          {selectedAmenities.includes(amenity.id) && <Check className="h-2 w-2 stroke-[4px]" />}
                        </div>
                        <span style={{ color: selectedAmenities.includes(amenity.id) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{amenity.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Map Panel */}
              <div
                className={`rounded-3xl border overflow-hidden shadow-sm relative h-80 lg:h-56 ${mobileTab === 'map' ? 'block' : 'hidden lg:block'}`}
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <div id="hotels-map-container" className="w-full h-full z-10" />
                {!isLeafletLoaded && (
                  <div className="absolute inset-0 bg-slate-50/80 z-20 flex items-center justify-center flex-col space-y-2">
                    <div className="h-6 w-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Loading Map Assets...</span>
                  </div>
                )}
              </div>

            </div>

            {/* Right Hotels List Pane */}
            <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'list' ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Stays in {destination} ({filteredHotels.length} found)
                </span>
              </div>

              {searchLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="h-8 w-8 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
                  <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-secondary)' }}>Finding available hotels...</p>
                </div>
              ) : filteredHotels.length === 0 ? (
                <div className="rounded-3xl border border-dashed p-10 text-center space-y-3" style={{ borderColor: 'var(--border-primary)' }}>
                  <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold">No Matching Stays</h4>
                  <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                    Try raising your maximum budget or clearing some amenity filters to see more results.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pr-2">
                  {filteredHotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      id={`hotel-card-${hotel.id}`}
                      onClick={() => setSelectedHotel(hotel)}
                      className={`rounded-3xl border overflow-hidden shadow-lg hover:shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-5 p-4.5 transition-all duration-300 cursor-pointer ${selectedHotel?.id === hotel.id
                          ? 'ring-2 ring-rose-500 border-transparent bg-[var(--bg-secondary)] shadow-rose-500/10'
                          : 'hover:border-rose-400/50 bg-[var(--bg-secondary)]'
                        }`}
                      style={{ borderColor: 'var(--border-primary)' }}
                    >
                      {/* Hotel Thumbnail */}
                      <div className="md:col-span-4 h-40 rounded-2xl overflow-hidden relative shrink-0 bg-[var(--bg-tertiary)] group">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 text-transparent"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wide">
                          📍 {hotel.distance} km from center
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-black leading-snug tracking-tight" style={{ color: 'var(--text-primary)' }}>{hotel.name}</h3>
                            <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-xl text-xs font-black shrink-0 border border-amber-500/20">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>{hotel.stars}★</span>
                            </div>
                          </div>
                          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {hotel.description}
                          </p>
                        </div>

                        {/* Amenities Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {hotel.amenities.slice(0, 4).map((a, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2.5 py-1 rounded-xl bg-[var(--bg-primary)] border font-bold flex items-center space-x-1"
                              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                            >
                              {a === 'WiFi' && <Wifi className="h-3 w-3 text-rose-500" />}
                              <span>{a}</span>
                            </span>
                          ))}
                          {hotel.amenities.length > 4 && (
                            <span className="text-[10px] px-2.5 py-1 rounded-xl bg-[var(--bg-primary)] border font-bold" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}>
                              +{hotel.amenities.length - 4} more
                            </span>
                          )}
                        </div>

                        {/* Price & Booking trigger */}
                        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-xl font-black text-rose-500">{hotel.currencySymbol || currency.symbol}{Math.round(hotel.price)}</span>
                            <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">/ night</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {hotel.bookingUrl && (
                              <a
                                href={hotel.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border text-[var(--text-primary)] font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-sm"
                                style={{ borderColor: 'var(--border-primary)' }}
                              >
                                <span>Google Hotels</span>
                                <ExternalLink className="h-3.5 w-3.5 text-rose-500" />
                              </a>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoomType('standard');
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                const nextWeek = new Date();
                                nextWeek.setDate(nextWeek.getDate() + 4);
                                if (!checkIn) setCheckIn(tomorrow.toISOString().split('T')[0]);
                                if (!checkOut) setCheckOut(nextWeek.toISOString().split('T')[0]);
                                setBookingHotel(hotel);
                              }}
                              className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-black text-xs px-4.5 py-2.5 rounded-xl transition shadow-lg shadow-rose-500/20 active:scale-95 flex items-center space-x-1.5 cursor-pointer border-0"
                            >
                               <span>Book Here</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
          </>
        )}
      </div>

      {/* Booking Form Dialog Modal */}
      <AnimatePresence>
        {bookingHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl border p-6 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Book Your Room</h3>
              <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
                Reserve your stay at <span className="font-bold text-rose-500">{bookingHotel.name}</span>.
              </p>

              <form onSubmit={handleConfirmBooking} className="space-y-4">

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Link to Active Trip</label>
                  <div className="relative" ref={tripDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setTripDropdownOpen(!tripDropdownOpen)}
                      className="w-full text-left bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 flex items-center justify-between"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                      <span>
                        {(() => {
                          if (!bookingTripId) return 'No Active Trips (Book General)';
                          const t = userTrips.find(x => x.id === bookingTripId);
                          if (!t) return 'No Active Trips (Book General)';
                          const fmt = (d) => d ? new Date(d).toISOString().split('T')[0] : 'Unknown Date';
                          return `${t.destination} (${fmt(t.startDate)} → ${fmt(t.endDate)})`;
                        })()}
                      </span>
                      <svg className="h-3 w-3 text-slate-400" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>

                    {tripDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl shadow-xl overflow-hidden bg-[var(--bg-primary)] border" style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="max-h-48 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => { setBookingTripId(''); setTripDropdownOpen(false); }}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[var(--bg-tertiary)] text-xs font-semibold`}
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <span>No Active Trips (Book General)</span>
                            {bookingTripId === '' && (<span className="h-2 w-2 rounded-full bg-rose-500" />)}
                          </button>
                          {userTrips.map(t => {
                            const fmt = (d) => d ? new Date(d).toISOString().split('T')[0] : 'Unknown Date';
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => { setBookingTripId(t.id); setTripDropdownOpen(false); }}
                                className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[var(--bg-tertiary)] text-xs font-semibold`}
                                style={{ color: 'var(--text-primary)' }}
                              >
                                <div className="flex flex-col text-left">
                                  <span className="font-bold text-sm">{t.destination}</span>
                                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{fmt(t.startDate)} → {fmt(t.endDate)}</span>
                                </div>
                                {bookingTripId === t.id && (<span className="h-2 w-2 rounded-full bg-rose-500" />)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Guest Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Guest Email</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                      <option value="5+">5+ Guests</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Number of Rooms</label>
                    <select
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="1">1 Room</option>
                      <option value="2">2 Rooms</option>
                      <option value="3">3 Rooms</option>
                      <option value="4+">4+ Rooms</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Check-In Date</label>
                    <div className="relative">
                      <div className="w-full bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-between" style={{ borderColor: 'var(--border-primary)', color: checkIn ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                        <span>{checkIn ? new Date(checkIn).toLocaleDateString('en-GB') : 'Select check-in date'}</span>
                        <svg className="h-4 w-4 text-rose-500" viewBox="0 0 24 24" fill="none"><path d="M7 10h10M7 6h10M7 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Check-Out Date</label>
                    <div className="relative">
                      <div className="w-full bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-between" style={{ borderColor: 'var(--border-primary)', color: checkOut ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                        <span>{checkOut ? new Date(checkOut).toLocaleDateString('en-GB') : 'Select check-out date'}</span>
                        <svg className="h-4 w-4 text-rose-500" viewBox="0 0 24 24" fill="none"><path d="M7 10h10M7 6h10M7 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Price Summary Breakdown */}
                <div className="rounded-2xl p-4 bg-[var(--bg-primary)] border space-y-2 mt-2" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span>Room Rate ({rooms} Room{parseInt(rooms) > 1 ? 's' : ''})</span>
                    <span>{bookingHotel.currencySymbol || currency.symbol}{Math.round(bookingHotel.price * (parseInt(rooms) || 1))} / night</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span>Azure Service Fee</span>
                    <span className="text-emerald-500">FREE</span>
                  </div>
                  <hr style={{ borderColor: 'var(--border-primary)' }} />
                  <div className="flex items-center justify-between text-sm font-extrabold">
                    <span>Est. Nightly Total</span>
                    <span className="text-rose-500">{bookingHotel.currencySymbol || currency.symbol}{Math.round(bookingHotel.price * (parseInt(rooms) || 1))}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setBookingHotel(null)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirm Reservation</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* My Bookings Modal */}
      <AnimatePresence>
        {showBookingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl border p-6 max-w-lg w-full shadow-2xl relative max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>My Bookings</h3>
                <button onClick={() => setShowBookingsModal(false)} className="text-sm font-bold">Close</button>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center text-sm text-[var(--text-secondary)] py-10">You have no bookings yet.</div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div key={b.confirmationNumber} className="rounded-2xl p-3 bg-[var(--bg-primary)] border" style={{ borderColor: 'var(--border-primary)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{b.hotelName}</div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.roomType} • {b.guests} guest(s)</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-rose-500 text-base">{b.currencySymbol || currency.symbol}{Math.round(b.price || 0).toLocaleString()}</div>
                          <div className="text-[11px] text-[var(--text-tertiary)]">Ref: {b.confirmationNumber}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div>Check-in: {b.checkIn}</div>
                        <div>Check-out: {b.checkOut}</div>
                        {b.paymentId && <div>Payment ID: <span className="text-rose-500 font-mono">{b.paymentId}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Animated Success Confirmation Modal */}
      <AnimatePresence>
        {bookingConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="rounded-3xl border max-w-md w-full shadow-2xl relative overflow-hidden text-center"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              {/* Premium Gradient Header Banner */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-rose-600 p-6 text-white relative">
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
                <div className="relative z-10 space-y-2">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center mx-auto shadow-lg ring-4 ring-white/30">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Booking Confirmed!</h3>
                  <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">
                    Reservation Pass
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Ref Code Badge */}
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black tracking-wider uppercase">
                  <span>Ref:</span>
                  <span className="font-mono text-sm">{bookingConfirm.confirmationNumber}</span>
                </div>

                {/* Ticket Style Pass Box */}
                <div className="rounded-2xl p-4 bg-[var(--bg-primary)] border text-left space-y-3 text-xs relative overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[var(--text-tertiary)] block">Hotel Property</span>
                      <span className="font-extrabold text-sm text-[var(--text-primary)]">{bookingConfirm.hotelName}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">Confirmed</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Check-In</span>
                      <span className="font-extrabold text-xs text-[var(--text-primary)]">{bookingConfirm.checkIn || 'Confirmed'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Check-Out</span>
                      <span className="font-extrabold text-xs text-[var(--text-primary)]">{bookingConfirm.checkOut || 'Confirmed'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Room Category</span>
                      <span className="font-semibold text-xs text-[var(--text-primary)]">{bookingConfirm.roomType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Duration</span>
                      <span className="font-semibold text-xs text-[var(--text-primary)]">
                        {(() => {
                          if (!bookingConfirm.checkIn || !bookingConfirm.checkOut) return '1 Night';
                          const n = Math.max(1, Math.ceil(Math.abs(new Date(bookingConfirm.checkOut) - new Date(bookingConfirm.checkIn)) / (1000 * 60 * 60 * 24)));
                          return `${n} Night${n > 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {bookingConfirm.paymentId && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Payment ID</span>
                      <span className="font-mono text-xs text-rose-500 font-bold">{bookingConfirm.paymentId}</span>
                    </div>
                  )}

                  <hr style={{ borderColor: 'var(--border-primary)' }} />

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Total Paid</span>
                      <span className="text-xl font-black text-rose-500">
                        {(() => {
                          const n = (!bookingConfirm.checkIn || !bookingConfirm.checkOut) ? 1 : Math.max(1, Math.ceil(Math.abs(new Date(bookingConfirm.checkOut) - new Date(bookingConfirm.checkIn)) / (1000 * 60 * 60 * 24)));
                          return `${bookingConfirm.currencySymbol || currency.symbol}${Math.round((bookingConfirm.price || 0) * n)}`;
                        })()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Linked Itinerary</span>
                      <span className="font-bold text-xs text-emerald-500">{bookingConfirm.associatedTrip}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 justify-center bg-sky-500/10 text-sky-500 p-3.5 rounded-2xl border" style={{ borderColor: 'rgba(14,165,233,0.2)' }}>
                  <Info className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] font-semibold text-left leading-tight">
                    Reservation saved! Access & view anytime from <strong>My Bookings</strong> in top navbar.
                  </span>
                </div>

                <button
                  onClick={() => setBookingConfirm(null)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs transition shadow-lg shadow-rose-500/20 active:scale-95 cursor-pointer border-0"
                >
                  Done & View Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
