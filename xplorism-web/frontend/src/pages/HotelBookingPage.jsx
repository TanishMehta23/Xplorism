import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel, Search, Calendar, Users, Star, MapPin,
  Wifi, SlidersHorizontal, Check, ShieldAlert,
  ArrowLeft, CheckCircle2, ChevronRight, Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
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

  // Search States
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currency, setCurrency] = useState({ symbol: '$', rate: 1, code: 'USD' });

  // Fetch autocomplete suggestions for destination
  useEffect(() => {
    if (destination.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await api.get(`/geocode?q=${encodeURIComponent(destination)}`);
        if (data && data.length > 0) {
          setSuggestions(data.slice(0, 6));
        }
      } catch (err) {
        console.error('Hotel autocomplete error:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [destination]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter States
  const [minStars, setMinStars] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
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

  // Booking Flow States
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingTripId, setBookingTripId] = useState('');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [roomType, setRoomType] = useState('deluxe');
  const [bookingConfirm, setBookingConfirm] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

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

    if (!document.getElementById('razorpay-checkout-script')) {
      const rpScript = document.createElement('script');
      rpScript.id = 'razorpay-checkout-script';
      rpScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.head.appendChild(rpScript);
    }

    // Fetch user's trips for booking integration
    api.get('/trips')
      .then(data => {
        setUserTrips(data || []);
        if (data && data.length > 0) {
          setBookingTripId(data[0].id);
        }
      })
      .catch(err => console.error('Failed to load trips:', err));
  }, []);

  useEffect(() => {
    if (mobileTab === 'map' && mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 150);
    }
  }, [mobileTab, mapInstance]);

  // Handle Search Submission
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!destination.trim()) return;

    setSearchLoading(true);
    setHasSearched(true);
    setSelectedHotel(null);

    try {
      // 1. Geocode location via proxy
      const data = await api.get(`/geocode?q=${encodeURIComponent(destination)}`);
      let centerCoords = [20.5937, 78.9629]; // India default
      let resolvedAddress = destination;

      if (data && data.length > 0) {
        centerCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        resolvedAddress = data[0].display_name || destination;
      }

      setMapCoords(centerCoords);

      // Resolve and apply local currency based on destination country
      const cur = getCurrencyDetails(resolvedAddress);
      setCurrency(cur);

      // 2. Fetch real hotel locations from Gemini AI proxy
      let finalHotels = [];
      try {
        const geminiData = await api.get(`/hotels/search?destination=${encodeURIComponent(destination)}&lat=${centerCoords[0]}&lon=${centerCoords[1]}`);

        if (geminiData && geminiData.length > 0) {
          finalHotels = geminiData.map((el, idx) => {
            const tpl = HOTEL_TEMPLATES[idx % HOTEL_TEMPLATES.length];
            return {
              id: el.hotelId || `hotel-gemini-${idx}-${Date.now()}`,
              name: el.name,
              stars: el.stars,
              rating: el.rating,
              reviewsCount: el.reviewsCount,
              price: el.price,
              amenities: el.amenities,
              image: tpl.image, // Use premium templates for beautiful photos
              description: el.description,
              lat: el.geoCode ? el.geoCode.latitude : centerCoords[0],
              lon: el.geoCode ? el.geoCode.longitude : centerCoords[1],
              distance: (Math.random() * 2 + 0.3).toFixed(1)
            };
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini hotels fetch failed, falling back to localized programmatically generated hotels:', geminiErr);
      }

      // If Gemini returned no hotels, use localized programmatically generated fallback hotels
      if (finalHotels.length === 0) {
        const baseCity = destination.split(',')[0].trim();
        finalHotels = HOTEL_TEMPLATES.map((tpl, idx) => {
          const latOffset = (Math.random() - 0.5) * 0.015;
          const lonOffset = (Math.random() - 0.5) * 0.015;

          // Generate localized names
          let name = tpl.name;
          if (idx === 0) name = `The Ritz-Carlton ${baseCity}`;
          else if (idx === 1) name = `${baseCity} Grand Plaza & Suites`;
          else if (idx === 2) name = `${baseCity} Oasis Boutique Retreat`;
          else if (idx === 3) name = `Urban Style Inn - ${baseCity}`;
          else if (idx === 4) name = `Aura Premium ${baseCity} Lodge`;
          else if (idx === 5) name = `${baseCity} Parkview Executive Hotel`;

          return {
            id: `hotel-${idx}-${Date.now()}`,
            ...tpl,
            name,
            lat: centerCoords[0] + latOffset,
            lon: centerCoords[1] + lonOffset,
            distance: (Math.random() * 2 + 0.3).toFixed(1)
          };
        });
      }

      setHotels(finalHotels);
    } catch (err) {
      console.error('Search failed:', err);
      // Fail-safe default coordinates
      setMapCoords([48.8566, 2.3522]); // Paris
    } finally {
      setSearchLoading(false);
    }
  };

  // Filter Hotels when filters change
  useEffect(() => {
    if (hotels.length === 0) return;

    const filtered = hotels.filter(hotel => {
      const matchStars = hotel.stars >= minStars;
      const matchPrice = hotel.price <= maxPrice;
      const matchAmenities = selectedAmenities.every(amenity =>
        hotel.amenities.includes(amenity)
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
          <p style="margin: 0 0 6px 0; color: #64748b;">${hotel.stars}★ Hotel • ${hotel.rating} Rating</p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700;">
            <span style="color: #e11d48;">${currency.symbol}${Math.round(hotel.price * currency.rate)}/night</span>
          </div>
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

    setBookingLoading(true);

    const rawUSDPrice = bookingHotel.price * (roomType === 'deluxe' ? 1.2 : roomType === 'suite' ? 1.6 : 1);
    const finalLocalPrice = Math.round(rawUSDPrice * currency.rate);

    // If Razorpay SDK is not loaded, fallback to normal booking confirmation
    if (!window.Razorpay) {
      console.warn('Razorpay SDK not loaded. Simulating booking directly.');
      setTimeout(() => {
        const confNum = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
        setBookingConfirm({
          confirmationNumber: confNum,
          hotelName: bookingHotel.name,
          roomType: roomType === 'deluxe' ? 'Deluxe King Room' : roomType === 'suite' ? 'Executive Suite' : 'Standard Room',
          guests: guests,
          checkIn: checkIn || new Date().toISOString().split('T')[0],
          checkOut: checkOut || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          price: rawUSDPrice,
          associatedTrip: userTrips.find(t => t.id === bookingTripId)?.destination || 'General Dashboard'
        });
        setBookingLoading(false);
        setBookingHotel(null);
      }, 1000);
      return;
    }

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
          checkIn: checkIn || new Date().toISOString().split('T')[0],
          checkOut: checkOut || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
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
              Hotel Search & Booking
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              Find and reserve premium stays for your itineraries.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl border hover:bg-[var(--bg-tertiary)] active:scale-95 transition-all select-none self-start md:self-auto cursor-pointer"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Search Bar Panel */}
        <div className="rounded-3xl border p-6 mb-8 shadow-md" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 relative search-container">
              <label className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                <Search className="h-3.5 w-3.5 text-rose-500" />
                <span>Destination</span>
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
                  placeholder="Where are you going?"
                  className="w-full bg-[var(--bg-primary)] border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
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
                    className="absolute left-0 right-0 mt-2 z-40 max-h-52 overflow-y-auto border rounded-2xl shadow-xl divide-y backdrop-blur-md"
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
                          setDestination(item.display_name);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-[var(--bg-tertiary)] transition text-xs flex items-center space-x-2 font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{item.display_name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                <span>Check-In</span>
              </label>
              <div className="relative">
                {/* Visual backdrop card */}
                <div className="w-full bg-[var(--bg-primary)] border rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-between transition-all select-none cursor-pointer hover:border-rose-300"
                     style={{ borderColor: 'var(--border-primary)', color: checkIn ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  <span>{checkIn ? new Date(checkIn).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select check-in date'}</span>
                  <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
                </div>
                {/* Real input layered on top */}
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                <span>Check-Out</span>
              </label>
              <div className="relative">
                {/* Visual backdrop card */}
                <div className="w-full bg-[var(--bg-primary)] border rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-between transition-all select-none cursor-pointer hover:border-rose-300"
                     style={{ borderColor: 'var(--border-primary)', color: checkOut ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  <span>{checkOut ? new Date(checkOut).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select check-out date'}</span>
                  <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
                </div>
                {/* Real input layered on top */}
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <label className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  <Users className="h-3.5 w-3.5 text-rose-500" />
                  <span>Guests</span>
                </label>
                <div className="relative">
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all cursor-pointer"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                    <option value="5+">5+ Guests</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={searchLoading}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition shadow-md flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer h-[42px] self-end"
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
            </div>
          </form>
        </div>

        {/* Main Dashboard Layout */}
        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-4 rounded-full bg-rose-500/10 text-rose-500">
              <Hotel className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold">Find Your Next Premium Stay</h2>
            <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Type in a destination above to see available hotels, interactive maps, and book a room.
            </p>
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
            <div className={`lg:col-span-5 space-y-4 md:sticky md:top-24 self-start ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>

              {/* Filter Card (Compact & Clean) */}
              <div className={`rounded-3xl border p-4 shadow-md space-y-4 ${mobileTab === 'filters' ? 'block' : 'hidden lg:block'}`} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center space-x-2 pb-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  <SlidersHorizontal className="h-4 w-4 text-rose-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">Filter Stays</h3>
                </div>

                {/* Stars Filter */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Star Rating</span>
                  <div className="flex items-center space-x-1.5">
                    {[0, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        onClick={() => setMinStars(stars)}
                        className={`flex-1 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${minStars === stars
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'hover:bg-[var(--bg-tertiary)]'
                          }`}
                        style={{ borderColor: minStars === stars ? '#e11d48' : 'var(--border-primary)' }}
                      >
                        {stars === 0 ? 'Any' : `${stars}★+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span style={{ color: 'var(--text-tertiary)' }}>Max Price</span>
                    <span className="text-rose-500 font-extrabold">{currency.symbol}{Math.round(maxPrice * currency.rate)}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
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
                      className={`rounded-3xl border overflow-hidden shadow-md hover:shadow-xl grid grid-cols-1 md:grid-cols-3 gap-5 p-4 transition-all duration-300 cursor-pointer ${selectedHotel?.id === hotel.id
                          ? 'ring-2 ring-rose-500 border-transparent scale-[1.01]'
                          : 'hover:border-rose-300'
                        }`}
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                    >
                      {/* Hotel Thumbnail */}
                      <div className="col-span-1 h-36 rounded-2xl overflow-hidden relative shrink-0 bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="w-full h-full object-cover hover:scale-105 transition-all duration-500 text-transparent"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-md border border-white/10 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          {hotel.distance} km from center
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="col-span-1 md:col-span-2 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>{hotel.name}</h3>
                            <div className="flex items-center space-x-1 bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 border border-rose-500/10">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{hotel.stars}</span>
                            </div>
                          </div>
                          <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {hotel.description}
                          </p>
                        </div>

                        {/* Amenities Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {hotel.amenities.slice(0, 4).map((a, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-[var(--bg-primary)] border font-semibold flex items-center space-x-1"
                              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                            >
                              {a === 'WiFi' && <Wifi className="h-2.5 w-2.5" />}
                              <span>{a}</span>
                            </span>
                          ))}
                          {hotel.amenities.length > 4 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[var(--bg-primary)] border font-semibold" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}>
                              +{hotel.amenities.length - 4} more
                            </span>
                          )}
                        </div>

                        {/* Price & Booking trigger */}
                        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-lg font-black text-rose-500">{currency.symbol}{Math.round(hotel.price * currency.rate)}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>/ night</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingHotel(hotel);
                            }}
                            className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-md active:scale-95 flex items-center space-x-1.5 cursor-pointer border-0"
                          >
                            <span>Book Now</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
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
                  <select
                    value={bookingTripId}
                    onChange={(e) => setBookingTripId(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    {userTrips.length === 0 ? (
                      <option value="">No Active Trips (Book General)</option>
                    ) : (
                      userTrips.map(t => (
                        <option key={t.id} value={t.id}>{t.destination} ({t.start_date.split('T')[0]})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="standard">Standard Queen Room - {currency.symbol}{Math.round(bookingHotel.price * currency.rate)}/night</option>
                    <option value="deluxe">Deluxe King Room - {currency.symbol}{Math.round(bookingHotel.price * 1.2 * currency.rate)}/night</option>
                    <option value="suite">Executive Suite (Park View) - {currency.symbol}{Math.round(bookingHotel.price * 1.6 * currency.rate)}/night</option>
                  </select>
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

                {/* Price Summary Breakdown */}
                <div className="rounded-2xl p-4 bg-[var(--bg-primary)] border space-y-2 mt-2" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span>Room Rate</span>
                    <span>{currency.symbol}{Math.round((roomType === 'deluxe' ? bookingHotel.price * 1.2 : roomType === 'suite' ? bookingHotel.price * 1.6 : bookingHotel.price) * currency.rate)} / night</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span>Azure Service Fee</span>
                    <span className="text-emerald-500">FREE</span>
                  </div>
                  <hr style={{ borderColor: 'var(--border-primary)' }} />
                  <div className="flex items-center justify-between text-sm font-extrabold">
                    <span>Est. Nightly Total</span>
                    <span className="text-rose-500">{currency.symbol}{Math.round((roomType === 'deluxe' ? bookingHotel.price * 1.2 : roomType === 'suite' ? bookingHotel.price * 1.6 : bookingHotel.price) * currency.rate)}</span>
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

      {/* Animated Success Confirmation Modal */}
      <AnimatePresence>
        {bookingConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl border p-6 max-w-md w-full shadow-2xl relative text-center space-y-5"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto animate-pulse">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Booking Confirmed!</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Your reservation reference is <span className="font-extrabold text-rose-500">{bookingConfirm.confirmationNumber}</span>
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="rounded-2xl p-4 bg-[var(--bg-primary)] border text-left space-y-3 text-xs" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Hotel</span>
                  <span className="font-extrabold" style={{ color: 'var(--text-primary)' }}>{bookingConfirm.hotelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Room</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bookingConfirm.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Linked Itinerary</span>
                  <span className="font-bold text-emerald-500">{bookingConfirm.associatedTrip}</span>
                </div>
                {bookingConfirm.paymentId && (
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Payment ID</span>
                    <span className="font-semibold text-rose-500 font-mono text-[10px]">{bookingConfirm.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Check-In</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bookingConfirm.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Check-Out</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bookingConfirm.checkOut}</span>
                </div>
                <hr style={{ borderColor: 'var(--border-primary)' }} />
                <div className="flex justify-between text-sm font-extrabold">
                  <span>Price Per Night</span>
                  <span className="text-rose-500">{currency.symbol}{Math.round(bookingConfirm.price * currency.rate)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 justify-center bg-sky-500/5 text-sky-500 p-3 rounded-2xl border" style={{ borderColor: 'rgba(14,165,233,0.15)' }}>
                <Info className="h-4 w-4 shrink-0" />
                <span className="text-[10px] font-semibold text-left leading-normal">
                  A verification and itinerary update email has been scheduled for delivery to your guest inbox.
                </span>
              </div>

              <button
                onClick={() => setBookingConfirm(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-xs transition shadow active:scale-95 cursor-pointer"
              >
                Close & Return
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
