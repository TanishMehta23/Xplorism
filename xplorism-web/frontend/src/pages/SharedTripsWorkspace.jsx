import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MapPin, Calendar, Compass, ArrowRight, Sparkles, User, HelpCircle, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Dynamic image fetch component identical to DashboardStub
const TripCoverImage = ({ destination, defaultImage, className }) => {
  const [imageSrc, setImageSrc] = useState(defaultImage || '');
  const [loading, setLoading] = useState(!defaultImage);

  useEffect(() => {
    let active = true;

    if (defaultImage && !defaultImage.includes('loremflickr.com') && !defaultImage.includes('akhilbharat.in')) {
      setImageSrc(defaultImage);
      setLoading(false);
      return;
    }

    const fetchRealImage = async () => {
      try {
        const cleanKeyword = (destination || '').split(',')[0].trim();
        const searchQuery = encodeURIComponent(cleanKeyword);
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
          const pageTitle = searchData.query.search[0].title;
          const imageQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
          const imageRes = await fetch(imageQueryUrl);
          const imageData = await imageRes.json();
          const pages = imageData.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
            if (active) {
              setImageSrc(pages[pageId].thumbnail.source);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch real image for destination:", destination, err);
      }

      if (active) {
        // Fallback travel scene
        setImageSrc('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80');
        setLoading(false);
      }
    };

    fetchRealImage();

    return () => {
      active = false;
    };
  }, [destination, defaultImage]);

  return (
    <div className={`relative w-full h-full bg-slate-100 dark:bg-slate-800 ${loading ? 'animate-pulse' : ''}`}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : null}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={destination}
          className={className}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
          }}
        />
      ) : null}
    </div>
  );
};

export default function SharedTripsWorkspace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this shared workspace? This action will permanently remove the trip and all co-traveler collaborations.')) return;
    try {
      await api.delete(`/trips/${tripId}`);
      setTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (err) {
      console.error('Failed to delete shared workspace:', err);
      alert(err.message || 'Failed to delete workspace.');
    }
  };

  useEffect(() => {
    const fetchSharedTrips = async () => {
      try {
        setLoading(true);
        const data = await api.get('/trips/shared-workspace');
        setTrips(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching shared workspace trips:', err);
        setError(err.message || 'Failed to load shared workspace.');
        setLoading(false);
      }
    };
    fetchSharedTrips();
  }, []);

  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative">
      {/* Decorative Blur Overlays */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar activeTab="shared-trips" />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Collaborative Space</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Shared Trips Workspace</h1>
            <p className="text-slate-555 dark:text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
              Co-plan schedules, split costs, upload tickets, and chat live in real-time with family, friends, or co-travelers on joint itineraries.
            </p>
          </div>
        </div>

        {/* Workspace Info Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl shadow-slate-100/50 dark:shadow-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-rose-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start space-x-4 w-full relative">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 text-rose-500 shrink-0 mt-1 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">How Shared Workspace Works</h3>
              <p className="text-slate-555 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed font-medium">
                When someone adds you as a collaborator on their trip, it will appear here. Everyone in the workspace can view the plans, edit the itinerary steps, view budgets, split trip expenses, upload travel documents, share scratchpad notes, and chat live in the built-in trip room.
              </p>
            </div>
          </div>
        </div>

        {/* Trips Display */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 border-4 border-rose-500/10 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">Scanning collaborative spaces...</p>
          </div>
        ) : error ? (
          <div className="py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl text-center p-8 max-w-md mx-auto shadow-2xl">
            <p className="text-rose-500 text-sm font-bold mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-rose-500/20"
            >
              Retry Connection
            </button>
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {trips.map((trip, idx) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  onClick={() => navigate(`/trips/${trip.id}/collaborate`)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-rose-400 dark:hover:border-rose-500 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-350 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Cover image header */}
                    <div className="relative h-44 w-full overflow-hidden">
                      <TripCoverImage
                        destination={trip.destination}
                        defaultImage={trip.image}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
                      
                      {/* Host Tag Overlay */}
                      <div className="absolute top-4 left-4 flex items-center space-x-1.5 z-10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-md border border-white/10 shadow-lg">
                        <User className="h-3 w-3 text-rose-505" />
                        <span>Host: {trip.ownerName}</span>
                      </div>

                      {/* Delete Workspace Button (only visible to Host) */}
                      {trip.userId === user?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrip(trip.id);
                          }}
                          className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-white/90 hover:bg-rose-600 text-slate-700 hover:text-white transition-all duration-200 shadow-md cursor-pointer border border-slate-200/50 flex items-center justify-center active:scale-90 z-20"
                          title="Delete Workspace"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Card Content body */}
                    <div className="p-6">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-rose-500 transition-colors line-clamp-1 mb-3">
                        {trip.destination}
                      </h3>

                      <div className="space-y-2.5">
                        <div className="flex items-center text-xs text-slate-550 dark:text-slate-400 space-x-2 font-semibold">
                          <Calendar className="h-4 w-4 text-rose-505 shrink-0" />
                          <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-550 dark:text-slate-400 space-x-2 font-semibold">
                          <Compass className="h-4 w-4 text-rose-505 shrink-0" />
                          <span className="capitalize">{(trip.travelStyle || '').split('|')[0] || 'Adventure'} trip</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center -space-x-2">
                      <div 
                        className="h-7 w-7 rounded-full bg-rose-500 text-white border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black uppercase shadow-sm select-none"
                        title={`Host: ${trip.ownerName}`}
                      >
                        {trip.ownerName.charAt(0)}
                      </div>
                      {trip.travelers > 1 && (
                        <div 
                          className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 text-slate-650 dark:text-slate-450 flex items-center justify-center text-[9px] font-black shadow-sm select-none"
                          title={`${trip.travelers - 1} co-travelers`}
                        >
                          +{trip.travelers - 1}
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-black text-rose-500 group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                      <span>Enter Workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xl">
            <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black mb-2 dark:text-white">No Shared Trips Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
              You haven't been added as a collaborator to any trips yet. Have the trip owner go to their trip details, copy your email address, and invite you to start planning together!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold transition text-xs shadow-lg shadow-rose-500/20 cursor-pointer"
            >
              Go to My Trips
            </button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
