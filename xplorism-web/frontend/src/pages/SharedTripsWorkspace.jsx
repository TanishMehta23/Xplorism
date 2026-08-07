import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MapPin, Calendar, Compass, ArrowRight, Sparkles, User, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SharedTripsWorkspace() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar activeTab="shared-trips" />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Collaborative Space</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Shared Trips Workspace</h1>
            <p className="text-slate-500 text-sm mt-1">
              Collaborate and chat in real-time with family, friends, or co-travelers on joint itineraries.
            </p>
          </div>
        </div>

        {/* Workspace Info Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex items-start space-x-4 max-w-2xl relative">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-rose-500 shrink-0 mt-1">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-md font-bold text-slate-800">How Shared Workspace Works</h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
                When someone adds you as a collaborator on their trip, it will appear here. Everyone in the workspace can view the plans, edit the itinerary steps, view budgets, and chat live in the built-in trip room powered by Apache Kafka.
              </p>
            </div>
          </div>
        </div>

        {/* Trips Display */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 border-4 border-rose-500/10 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-semibold animate-pulse">Scanning collaborative spaces...</p>
          </div>
        ) : error ? (
          <div className="py-12 bg-white border border-slate-100 rounded-3xl text-center p-8 max-w-md mx-auto">
            <p className="text-rose-500 text-sm font-bold mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Retry Connection
            </button>
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {trips.map((trip, idx) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  onClick={() => navigate(`/trips/${trip.id}/collaborate`)}
                  className="group bg-white border border-slate-100 hover:border-rose-500/30 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between h-64 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div>
                    {/* Owner Tag */}
                    <div className="flex items-center space-x-1.5 mb-4 text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border border-slate-100 py-1 px-2.5 rounded-full w-fit">
                      <User className="h-3 w-3 text-rose-500" />
                      <span>Host: {trip.ownerName}</span>
                    </div>

                    <h3 className="text-lg font-black text-slate-800 group-hover:text-rose-500 transition-colors line-clamp-1 mb-2">
                      {trip.destination}
                    </h3>

                    <div className="space-y-2 mt-3">
                      <div className="flex items-center text-xs text-slate-500 space-x-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                      </div>
                      <div className="flex items-center text-xs text-slate-500 space-x-2">
                        <Compass className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="capitalize">{trip.travelStyle.split('|')[0] || 'Balanced'} trip</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
                    <div className="flex items-center -space-x-1.5">
                      <div className="h-6 w-6 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center text-[9px] font-black uppercase">
                        {trip.ownerName.charAt(0)}
                      </div>
                      <div className="h-6 w-6 rounded-full bg-slate-105 border border-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-black uppercase">
                        +{trip.travelers - 1}
                      </div>
                    </div>

                    <span className="text-xs font-bold text-rose-500 group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                      <span>Enter Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xl">
            <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black mb-2">No Shared Trips Yet</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
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
