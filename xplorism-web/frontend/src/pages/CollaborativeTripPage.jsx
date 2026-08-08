import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Calendar, Compass as TripIcon, DollarSign, Users, Sparkles, Clock, 
  MapPin, ArrowLeft, Send, UserPlus, X, Trash2, Shield,
  MessageCircle, Info
} from 'lucide-react';
import { api, SOCKET_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CURRENCIES } from './DashboardStub';

export default function CollaborativeTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Collaboration / Member Management State
  const [collaborators, setCollaborators] = useState([]);
  const [onlineCollaborators, setOnlineCollaborators] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll window to top on page mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Fetch Trip Details, Invited Members, and Chat History
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch trip details (trips endpoint handles owned trips)
      let tripData;
      try {
        tripData = await api.get(`/trips`);
        tripData = tripData.find(t => t.id === id);
      } catch (err) {
        console.warn('Failed to load owned trips, trying shared workspace', err);
      }

      if (!tripData) {
        // Try shared workspace trips
        const sharedTrips = await api.get('/trips/shared-workspace');
        tripData = sharedTrips.find(t => t.id === id);
      }

      if (!tripData) {
        throw new Error('Trip not found or you are not authorized to view it.');
      }

      setTrip(tripData);

      // Fetch collaborators
      const collabData = await api.get(`/trips/${id}/collaborators`);
      setCollaborators(collabData);

      // Fetch messages
      const msgsData = await api.get(`/trips/${id}/messages`);
      setMessages(msgsData);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching collaborative data:', err);
      setError(err.message || 'Failed to load trip workspace.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // Socket.io Real-time connection for Kafka messages and active users presence
  useEffect(() => {
    if (!id || !user || !trip) return;

    // Connect to backend Socket.io
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Join room
    socket.emit('join-trip-room', { tripId: id, userName: user.name });

    // Listeners
    socket.on('collaborators-list', (list) => {
      setOnlineCollaborators(list.filter(name => name !== user.name));
    });

    socket.on('collaborator-joined', (name) => {
      showToast(`${name} joined workspace!`, 'info');
    });

    socket.on('collaborator-left', (name) => {
      showToast(`${name} left workspace.`, 'info');
    });

    socket.on('chat-message', (message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id, user, trip]);

  // Scroll to bottom of chat container only (prevents page body viewport scrolling)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setChatLoading(true);
      const msg = await api.post(`/trips/${id}/messages`, { message: newMessage });
      
      // Update local state (Socket listener might also trigger but state handler handles duplicates)
      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setNewMessage('');
      setChatLoading(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Failed to send message', 'error');
      setChatLoading(false);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviteLoading(true);
      await api.post(`/trips/${id}/collaborators`, { email: inviteEmail });
      showToast('Collaborator added successfully!', 'success');
      setInviteEmail('');
      setShowInviteModal(false);
      
      // Refresh collaborator list
      const collabData = await api.get(`/trips/${id}/collaborators`);
      setCollaborators(collabData);
      setInviteLoading(false);
    } catch (err) {
      console.error('Failed to add collaborator:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to add collaborator.', 'error');
      setInviteLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collabUserId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      await api.delete(`/trips/${id}/collaborators/${collabUserId}`);
      showToast('Collaborator removed successfully.', 'success');
      
      // Refresh collaborator list
      const collabData = await api.get(`/trips/${id}/collaborators`);
      setCollaborators(collabData);
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
      showToast('Failed to remove collaborator.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium animate-pulse">Loading collaboration workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-100 p-8 rounded-3xl shadow-xl">
          <TripIcon className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">Workspace Error</h2>
          <p className="text-slate-500 text-sm mb-6">{error || 'Unable to open trip workspace.'}</p>
          <button onClick={() => navigate('/shared-trips')} className="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-600 text-white font-bold transition">
            Go to Shared Workspace
          </button>
        </div>
      </div>
    );
  }

  const parts = (trip.travelStyle || '').split('|');
  const style = parts[0] || 'Adventure';
  const tripCurrencyCode = parts[1] || 'USD';
  const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;
  const daysCount = Math.max(1, Math.ceil(Math.abs(new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)) + 1);

  const getDayItineraries = () => {
    if (!trip.itineraries) return [];
    return trip.itineraries
      .filter((item) => item.day === activeDayTab)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const activeDayItineraries = getDayItineraries();

  const isOwner = trip.userId === user.id;

  return (
    <div className="min-h-screen bg-slate-550/10 text-slate-800 flex flex-col font-sans">
      <Navbar activeTab="shared-trips" />

      {/* Main Container */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        
        {/* Left Column: Itinerary and Collaborators (7 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Header Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <button onClick={() => navigate('/shared-trips')} className="mb-4 flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Workspace</span>
            </button>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{trip.destination}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-rose-500" />
              <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()} ({daysCount} days)</span>
            </p>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-450 font-bold uppercase block">Budget</span>
                <span className="text-sm font-extrabold text-slate-850">{tripCurrency.symbol}{Number(trip.budget).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-450 font-bold uppercase block">Travel Style</span>
                <span className="text-sm font-extrabold text-slate-850 capitalize">{style}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-450 font-bold uppercase block">Co-travelers</span>
                <span className="text-sm font-extrabold text-slate-850">{trip.travelers} Persons</span>
              </div>
            </div>
          </div>

          {/* Itinerary Section */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex-1 flex flex-col min-h-[450px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
              <h2 className="text-lg font-black text-slate-900">Workspace Itinerary</h2>
              <div className="flex space-x-1.5 overflow-x-auto max-w-full no-scrollbar pb-1">
                {Array.from({ length: daysCount }).map((_, i) => {
                  const dayNum = i + 1;
                  return (
                    <button
                      key={dayNum}
                      onClick={() => setActiveDayTab(dayNum)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                        activeDayTab === dayNum
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-slate-50 text-slate-500 border border-slate-150 hover:text-slate-800'
                      }`}
                    >
                      Day {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 relative">
              {activeDayItineraries.length > 0 ? (
                <div className="relative pl-6 border-l border-slate-200 space-y-5 ml-2">
                  {activeDayItineraries.map((act, index) => (
                    <div key={act.id || index} className="relative group">
                      <div className="absolute -left-[30px] top-1.5 h-3.5 w-3.5 rounded-full bg-slate-50 border-2 border-rose-500" />
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center space-x-2 text-rose-500 font-bold text-xs mb-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{act.time || 'All Day'}</span>
                        </div>
                        <p className="text-slate-700 text-xs sm:text-sm font-medium">{act.activity}</p>
                        {act.location && (
                          <div className="flex items-center space-x-1 mt-2 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 text-rose-500" />
                            <span>{act.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-slate-500">
                  <TripIcon className="h-10 w-10 mb-3 animate-pulse" />
                  <p className="text-sm font-semibold">No plans recorded for Day {activeDayTab}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Collaborators and Chat Sidebar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Members / Collaborators Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4.5 w-4.5 text-rose-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Group Members</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-455 transition flex items-center space-x-1 text-xs cursor-pointer font-bold border border-rose-500/10"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Member</span>
              </button>
            </div>

            {/* Online/Presence indicator */}
            {onlineCollaborators.length > 0 && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-[11px] font-bold text-emerald-500">
                  Active online: {onlineCollaborators.join(', ')}
                </span>
              </div>
            )}

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {collaborators.map((c) => {
                const isOnline = c.name === user.name || onlineCollaborators.includes(c.name);
                return (
                  <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center space-x-2.5">
                      <div className="relative">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black uppercase text-white shadow-sm ${
                          c.role === 'owner' ? 'bg-rose-600' : 'bg-slate-400'
                        }`}>
                          {c.name.charAt(0)}
                        </div>
                        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white ${
                          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'
                        }`} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{c.name}</span>
                        <span className="text-[10px] text-slate-550 block truncate max-w-[150px]">{c.email}</span>
                      </div>
                    </div>
                  <div className="flex items-center space-x-2">
                    {c.role === 'owner' ? (
                      <span className="text-[9px] uppercase font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">Host</span>
                    ) : (
                      <>
                        {c.status === 'pending' ? (
                          <span className="text-[9px] uppercase font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse">Pending</span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">Member</span>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => handleRemoveCollaborator(c.id)}
                            className="p-1 rounded text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Remove Collaborator"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Live Chat Panel (Kafka Powered) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col h-[400px] sm:h-[450px]">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3 shrink-0">
              <MessageCircle className="h-4.5 w-4.5 text-rose-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Kafka Chat Stream</h3>
            </div>

            {/* Chat Messages Log */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar">
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = msg.userId === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-550 mb-0.5 font-semibold px-1">{msg.senderName}</span>
                      <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        isMe
                          ? 'bg-rose-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-slate-50 text-slate-800 border border-slate-150 rounded-tl-none'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-slate-450 mt-0.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-450 py-10">
                  <MessageCircle className="h-8 w-8 mb-2 text-slate-300 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700">Workspace Chat Room</p>
                  <p className="text-[10px] max-w-[180px] mt-1 leading-normal text-slate-500">Send a message to update co-travelers in real-time.</p>
                </div>
              )}
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSendMessage} className="mt-3 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={chatLoading}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-850 placeholder-slate-450 focus:outline-none focus:border-rose-500/40"
              />
              <button
                type="submit"
                disabled={chatLoading || !newMessage.trim()}
                className="p-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

      </main>

      {/* Invite Collaborator Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4 text-rose-500">
              <UserPlus className="h-6 w-6" />
              <h3 className="text-lg font-black text-slate-900 font-sans">Invite Collaborator</h3>
            </div>

            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              Enter the registered email address of the person you want to invite. They will immediately gain workspace access and be listed in this shared trip.
            </p>

            <form onSubmit={handleAddCollaborator} className="space-y-4 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">User Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. companion@example.com"
                  required
                  disabled={inviteLoading}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-150 rounded-xl text-sm text-slate-900 placeholder-slate-450 focus:outline-none focus:border-rose-500/40"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  {inviteLoading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-2.5 border text-sm font-bold ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/20 text-emerald-400'
                : toast.type === 'error'
                ? 'bg-slate-900 border-rose-500/20 text-rose-455'
                : 'bg-slate-900 border-slate-800 text-slate-200'
            }`}
          >
            <Sparkles className="h-4.5 w-4.5 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
