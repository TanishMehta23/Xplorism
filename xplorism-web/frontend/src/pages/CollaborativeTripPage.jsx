import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Calendar, Compass as TripIcon, DollarSign, Users, Sparkles, Clock, 
  MapPin, ArrowLeft, Send, UserPlus, X, Trash2, Shield, LogOut, Pencil,
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
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null
  });
  const [editActivityModal, setEditActivityModal] = useState({
    show: false,
    actId: null,
    time: '',
    location: '',
    activity: '',
    saving: false
  });
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Tab State
  const [activeMainTab, setActiveMainTab] = useState('itinerary');

  // Packing List state
  const [packingList, setPackingList] = useState([]);
  const [packingLoading, setPackingLoading] = useState(false);

  // Expenses / Bill Splitter state
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'Food & Dining',
    itemName: '',
    actualAmount: '',
    paidBy: user?.name || 'Me',
    notes: ''
  });

  // Shared Documents state
  const [tripDocuments, setTripDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    type: 'ticket',
    fileContent: '',
    fileName: ''
  });

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

      // Fetch packing list
      try {
        const packingData = await api.get(`/trips/${id}/packing`);
        setPackingList(packingData || []);
      } catch (err) {
        console.warn('Failed to load packing list', err);
      }

      // Fetch expenses
      try {
        const budgetData = await api.get(`/trips/${id}/budget`);
        setExpenses(budgetData.expenses || []);
      } catch (err) {
        console.warn('Failed to load expenses', err);
      }

      // Fetch documents
      try {
        const docsData = await api.get(`/documents/trip/${id}`);
        setTripDocuments(docsData || []);
      } catch (err) {
        console.warn('Failed to load documents', err);
      }

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

    socket.on('itinerary-updated', ({ action, data }) => {
      if (action === 'update' && data) {
        setTrip(data);
        showToast('Workspace itinerary updated by co-traveler.', 'info');
      }
    });

    socket.on('packing-updated', ({ action, data }) => {
      if (data) {
        setPackingList(data);
        showToast('Packing checklist updated by co-traveler.', 'info');
      }
    });

    socket.on('budget-updated', ({ action, data }) => {
      if (data) {
        setExpenses(data);
        showToast('Expenses updated by co-traveler.', 'info');
      }
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

  const handleRemoveCollaborator = (collabUserId) => {
    setConfirmModal({
      show: true,
      title: 'Remove Collaborator',
      message: 'Are you sure you want to remove this collaborator from the trip?',
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          await api.delete(`/trips/${id}/collaborators/${collabUserId}`);
          showToast('Collaborator removed successfully.', 'success');
          const collabData = await api.get(`/trips/${id}/collaborators`);
          setCollaborators(collabData);
        } catch (err) {
          console.error('Failed to remove collaborator:', err);
          showToast('Failed to remove collaborator.', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleLeaveTrip = () => {
    setConfirmModal({
      show: true,
      title: 'Leave Trip Workspace',
      message: 'Are you sure you want to leave this trip? You will lose access to this collaborative workspace.',
      confirmText: 'Leave Trip',
      onConfirm: async () => {
        try {
          await api.delete(`/trips/${id}/collaborators/${user.id}`);
          showToast('You have successfully left the trip.', 'success');
          setConfirmModal(prev => ({ ...prev, show: false }));
          setTimeout(() => {
            navigate('/shared-trips');
          }, 1500);
        } catch (err) {
          console.error('Failed to leave trip:', err);
          showToast('Failed to leave trip workspace.', 'error');
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleEditActivityClick = async (act) => {
    setEditActivityModal({
      show: true,
      actId: act.id,
      time: act.time || '',
      location: act.location || '',
      activity: act.activity || '',
      saving: false
    });

    // Fetch suggestions dynamically for this destination
    try {
      setSuggestionsLoading(true);
      const data = await api.get(`/nearby?destination=${encodeURIComponent(trip.destination)}`);
      setSuggestions(data || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSaveActivityEdit = async (e) => {
    e.preventDefault();

    try {
      setEditActivityModal(prev => ({ ...prev, saving: true }));

      let updatedItineraries = [];

      if (editActivityModal.actId) {
        // Edit existing item
        updatedItineraries = trip.itineraries.map((act) => {
          if (act.id === editActivityModal.actId) {
            return {
              ...act,
              time: editActivityModal.time,
              location: editActivityModal.location,
              activity: editActivityModal.activity
            };
          }
          return act;
        });
      } else {
        // Add new item
        const newAct = {
          day: activeDayTab,
          time: editActivityModal.time || 'All Day',
          location: editActivityModal.location,
          activity: editActivityModal.activity,
          estimatedCost: 0
        };
        updatedItineraries = [...(trip.itineraries || []), newAct];
      }

      // 2. Call backend update trip
      const backendItinerary = updatedItineraries.map((act) => ({
        day: act.day,
        activity: act.activity,
        time: act.time,
        location: act.location,
        estimatedCost: act.estimatedCost || 0
      }));

      // Send update
      const updatedTripData = await api.put(`/trips/${id}`, {
        itinerary: backendItinerary
      });

      // Update local state
      setTrip(updatedTripData);
      showToast(editActivityModal.actId ? 'Itinerary updated successfully!' : 'Activity added successfully!', 'success');

      // Emit socket event to notify other room members
      if (socketRef.current) {
        socketRef.current.emit('itinerary-changed', {
          tripId: id,
          action: 'update',
          data: updatedTripData
        });
      }

      setEditActivityModal({
        show: false,
        actId: null,
        time: '',
        location: '',
        activity: '',
        saving: false
      });
    } catch (err) {
      console.error('Failed to update itinerary:', err);
      showToast('Failed to update itinerary.', 'error');
    } finally {
      setEditActivityModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleAddActivityClick = async () => {
    setEditActivityModal({
      show: true,
      actId: null,
      time: 'Morning',
      location: '',
      activity: '',
      saving: false
    });

    // Fetch suggestions dynamically for this destination
    try {
      setSuggestionsLoading(true);
      const data = await api.get(`/nearby?destination=${encodeURIComponent(trip.destination)}`);
      setSuggestions(data || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleTogglePackingItem = async (categoryIndex, itemIndex) => {
    try {
      const updatedList = [...packingList];
      updatedList[categoryIndex].items[itemIndex].checked = !updatedList[categoryIndex].items[itemIndex].checked;
      
      setPackingList(updatedList);
      
      // Update backend
      await api.put(`/trips/${id}/packing`, { packingList: updatedList });

      // Emit socket update
      if (socketRef.current) {
        socketRef.current.emit('packing-changed', { tripId: id, action: 'update', data: updatedList });
      }
    } catch (err) {
      console.error('Failed to toggle packing item:', err);
      showToast('Failed to update packing list.', 'error');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.itemName || !newExpense.actualAmount) return;

    try {
      setExpensesLoading(true);
      const exp = await api.post(`/trips/${id}/expenses`, {
        category: newExpense.category,
        itemName: newExpense.itemName,
        actualAmount: parseFloat(newExpense.actualAmount),
        plannedAmount: 0,
        paidBy: newExpense.paidBy,
        notes: newExpense.notes
      });

      const updatedExpenses = [...expenses, exp];
      setExpenses(updatedExpenses);

      // Emit socket event to notify other room members
      if (socketRef.current) {
        socketRef.current.emit('budget-changed', {
          tripId: id,
          action: 'update',
          data: updatedExpenses
        });
      }

      setShowAddExpenseModal(false);
      setNewExpense({
        category: 'Food & Dining',
        itemName: '',
        actualAmount: '',
        paidBy: user?.name || 'Me',
        notes: ''
      });
      showToast('Expense logged successfully!', 'success');
    } catch (err) {
      console.error('Failed to log expense:', err);
      showToast('Failed to log expense.', 'error');
    } finally {
      setExpensesLoading(false);
    }
  };

  const handleDeleteExpense = async (expId) => {
    try {
      setExpensesLoading(true);
      await api.delete(`/trips/${id}/expenses/${expId}`);
      const updatedExpenses = expenses.filter(e => e.id !== expId);
      setExpenses(updatedExpenses);

      if (socketRef.current) {
        socketRef.current.emit('budget-changed', {
          tripId: id,
          action: 'update',
          data: updatedExpenses
        });
      }
      showToast('Expense deleted.', 'success');
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showToast('Failed to delete expense.', 'error');
    } finally {
      setExpensesLoading(false);
    }
  };

  const handleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewDoc(prev => ({
        ...prev,
        fileName: file.name,
        fileContent: reader.result // Base64 data URL
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.fileContent) {
      showToast('Please select a file and enter a title.', 'error');
      return;
    }

    try {
      setDocsLoading(true);
      const uploaded = await api.post('/documents', {
        title: newDoc.title,
        type: newDoc.type,
        file_name: newDoc.fileName,
        file_content: newDoc.fileContent,
        trip_id: id
      });

      setTripDocuments(prev => [uploaded, ...prev]);
      setShowUploadDocModal(false);
      setNewDoc({
        title: '',
        type: 'ticket',
        fileContent: '',
        fileName: ''
      });
      showToast('Document securely uploaded to vault!', 'success');
    } catch (err) {
      console.error('Failed to upload document:', err);
      showToast('Failed to upload document.', 'error');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDownloadDocument = async (docId, docTitle) => {
    try {
      showToast(`Decrypting ${docTitle}...`, 'info');
      const res = await api.get(`/documents/${docId}/download`);
      
      // Trigger direct browser download
      const link = document.createElement('a');
      link.href = res.file_content;
      link.download = res.file_name || docTitle;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Decryption complete! Downloading file.', 'success');
    } catch (err) {
      console.error('Failed to download document:', err);
      showToast('Failed to retrieve document.', 'error');
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

          {/* Tabbed Collaborative Workspace Panel */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex-1 flex flex-col h-[600px]">
            {/* Top Workspace Tab switcher */}
            <div className="flex border-b border-slate-100 mb-6 space-x-5 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setActiveMainTab('itinerary')}
                className={`pb-3 text-xs sm:text-sm font-black border-b-2 transition shrink-0 cursor-pointer ${
                  activeMainTab === 'itinerary' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-850'
                }`}
              >
                Itinerary
              </button>
              <button
                onClick={() => setActiveMainTab('packing')}
                className={`pb-3 text-xs sm:text-sm font-black border-b-2 transition shrink-0 cursor-pointer ${
                  activeMainTab === 'packing' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-850'
                }`}
              >
                Packing Checklist
              </button>
              <button
                onClick={() => setActiveMainTab('expenses')}
                className={`pb-3 text-xs sm:text-sm font-black border-b-2 transition shrink-0 cursor-pointer ${
                  activeMainTab === 'expenses' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-850'
                }`}
              >
                Bill Splitter
              </button>
              <button
                onClick={() => setActiveMainTab('docs')}
                className={`pb-3 text-xs sm:text-sm font-black border-b-2 transition shrink-0 cursor-pointer ${
                  activeMainTab === 'docs' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-850'
                }`}
              >
                Shared Documents
              </button>
            </div>

            {/* Dynamic Content Panel */}
            <div className="flex-1 flex flex-col">
              
              {/* ITINERARY TAB */}
              {activeMainTab === 'itinerary' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6 gap-3 shrink-0">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Workspace Itinerary</h2>
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

                  <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin relative">
                    {activeDayItineraries.length > 0 ? (
                      <div className="relative pl-6 border-l border-slate-200 space-y-5 ml-2">
                        {activeDayItineraries.map((act, index) => (
                          <div key={act.id || index} className="relative group">
                            <div className="absolute -left-[30px] top-1.5 h-3.5 w-3.5 rounded-full bg-slate-50 border-2 border-rose-500" />
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative group/card">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center space-x-2 text-rose-500 font-bold text-xs">
                                  <Clock className="h-3 w-3" />
                                  <span>{act.time || 'All Day'}</span>
                                </div>
                                
                                <button
                                  onClick={() => handleEditActivityClick(act)}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                  title="Edit Activity"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
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
                        <TripIcon className="h-10 w-10 mb-3 animate-pulse text-slate-350" />
                        <p className="text-sm font-semibold">No plans recorded for Day {activeDayTab}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end shrink-0">
                    <button
                      onClick={handleAddActivityClick}
                      className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-rose-500/10"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Add Activity</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PACKING LIST TAB */}
              {activeMainTab === 'packing' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Cooperative Packing List</h2>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full animate-pulse">Syncing Real-time</span>
                  </div>

                  {packingList.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin">
                      {packingList.map((cat, catIdx) => (
                        <div key={catIdx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">{cat.category}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cat.items.map((item, itemIdx) => (
                              <label
                                key={itemIdx}
                                className="flex items-center space-x-2.5 p-2 bg-white rounded-xl border border-slate-150 hover:border-rose-500/10 cursor-pointer select-none transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => handleTogglePackingItem(catIdx, itemIdx)}
                                  className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 accent-rose-500"
                                />
                                <span className={`text-xs font-medium text-slate-800 ${item.checked ? 'line-through text-slate-400' : ''}`}>
                                  {item.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                      <Sparkles className="h-10 w-10 text-rose-300 animate-pulse mb-2" />
                      <p className="text-xs font-bold text-slate-500">Generating collaborative checklists...</p>
                    </div>
                  )}
                </div>
              )}

              {/* BILL SPLITTER TAB */}
              {activeMainTab === 'expenses' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Shared Expenses Tracker</h2>
                    <button
                      onClick={() => setShowAddExpenseModal(true)}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-rose-500/10"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>Log Bill</span>
                    </button>
                  </div>

                  {/* Summary Card */}
                  <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
                    <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-850 rounded-2xl text-white shadow-xl relative overflow-hidden">
                      <div className="absolute right-2 bottom-2 opacity-5">
                        <DollarSign className="h-20 w-20" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Spent</span>
                      <span className="text-xl font-black">{tripCurrency.symbol}{expenses.reduce((sum, e) => sum + parseFloat(e.actualAmount || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-rose-50/50 border border-rose-500/10 rounded-2xl relative overflow-hidden">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Per Person Split</span>
                      <span className="text-xl font-black text-rose-500">
                        {tripCurrency.symbol}{((expenses.reduce((sum, e) => sum + parseFloat(e.actualAmount || 0), 0)) / (collaborators.length || 1)).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-semibold mt-1">Split among {collaborators.length} co-travelers</span>
                    </div>
                  </div>

                  {/* Expenses List */}
                  {expenses.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                      {expenses.map((e) => (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-black uppercase text-slate-600 shrink-0">
                              {e.category ? e.category.charAt(0) : '$'}
                            </div>
                            <div>
                              <span className="text-xs font-extrabold text-slate-800 block">{e.itemName}</span>
                              <span className="text-[9px] text-slate-500 font-semibold block">Paid by <strong className="text-rose-500">{e.paidBy || 'Me'}</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-black text-slate-850">{tripCurrency.symbol}{Number(e.actualAmount).toLocaleString()}</span>
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-450 border border-dashed border-slate-200 rounded-2xl">
                      <DollarSign className="h-8 w-8 text-slate-300 animate-pulse mb-1.5" />
                      <p className="text-xs font-bold text-slate-500">No expenses logged. Add dinner bills or shared taxi costs!</p>
                    </div>
                  )}
                </div>
              )}

              {/* SHARED DOCUMENTS VAULT */}
              {activeMainTab === 'docs' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Shared Documents Vault</h2>
                    <button
                      onClick={() => setShowUploadDocModal(true)}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-rose-500/10"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Upload Doc</span>
                    </button>
                  </div>

                  {tripDocuments.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                      {tripDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:shadow-md transition">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xs font-black uppercase shrink-0">
                              {doc.type ? doc.type.substring(0, 3) : 'DOC'}
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-xs font-extrabold text-slate-800 block truncate max-w-[200px]" title={doc.title}>{doc.title}</span>
                              <span className="text-[9px] text-slate-450 font-bold block truncate max-w-[180px]">{doc.file_name}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument(doc.id, doc.title)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-rose-500 text-slate-700 hover:text-white rounded-lg text-[10px] font-black transition cursor-pointer"
                          >
                            Retrieve Securely
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-450 border border-dashed border-slate-200 rounded-2xl">
                      <Shield className="h-9 w-9 text-slate-350 animate-pulse mb-2" />
                      <p className="text-xs font-bold text-slate-500">Shared document vault is empty.</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[250px] text-center leading-normal">Upload tickets, hotel vouchers, and flight passes encrypted in the database.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Column: Collaborators and Chat Sidebar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Members / Collaborators Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl h-[200px] flex flex-col">
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

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
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
                        {c.id === user.id ? (
                          <button
                            onClick={() => handleLeaveTrip()}
                            className="p-1 rounded text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer ml-1.5"
                            title="Leave Trip"
                          >
                            <LogOut className="h-3.5 w-3.5 text-rose-500" />
                          </button>
                        ) : isOwner && (
                          <button
                            onClick={() => handleRemoveCollaborator(c.id)}
                            className="p-1 rounded text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer ml-1.5"
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
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col h-[625px]">
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

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 font-sans">{confirmModal.title}</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed font-sans">{confirmModal.message}</p>

            <div className="flex items-center space-x-3 pt-2 font-sans">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {editActivityModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setEditActivityModal(prev => ({ ...prev, show: false }))}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500 shrink-0">
              <Pencil className="h-5 w-5" />
              <h3 className="text-lg font-black text-slate-900 font-sans">Edit Itinerary Activity</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin">
              {/* Form inputs */}
              <form onSubmit={handleSaveActivityEdit} id="edit-activity-form" className="space-y-4 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Time / Window</label>
                    <input
                      type="text"
                      value={editActivityModal.time}
                      onChange={(e) => setEditActivityModal(prev => ({ ...prev, time: e.target.value }))}
                      placeholder="e.g. 02:00 PM or Morning"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-rose-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Location</label>
                    <input
                      type="text"
                      value={editActivityModal.location}
                      onChange={(e) => setEditActivityModal(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Eiffel Tower"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-rose-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Activity Description</label>
                  <textarea
                    value={editActivityModal.activity}
                    onChange={(e) => setEditActivityModal(prev => ({ ...prev, activity: e.target.value }))}
                    placeholder="Describe what you will do during this window..."
                    required
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-rose-500/40 resize-none"
                  />
                </div>
              </form>

              {/* Suggestions Panel */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Suggested Nearby Places</span>
                  {suggestionsLoading && <span className="text-[10px] text-rose-500 font-bold animate-pulse">Consulting AI Guides...</span>}
                </div>

                {suggestionsLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="h-6 w-6 border-2 border-rose-500/10 border-t-rose-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-semibold text-slate-450">Scanning geographic database...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                    {suggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setEditActivityModal(prev => ({
                            ...prev,
                            location: sug.name,
                            activity: sug.description
                          }));
                          showToast(`Applied: ${sug.name}`, 'success');
                        }}
                        className="p-3 bg-slate-50 border border-slate-100 hover:border-rose-500/20 rounded-xl text-left transition cursor-pointer hover:shadow-md"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1">{sug.name}</span>
                          <span className="text-[8px] bg-slate-150 text-slate-500 px-1.5 py-0.5 rounded font-black shrink-0">{sug.distance || sug.type}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{sug.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[10px] text-slate-450 border border-dashed border-slate-200 rounded-2xl">
                    No suggestions loaded. Check internet connection.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-5 border-t border-slate-100 mt-5 shrink-0">
              <button
                type="button"
                onClick={() => setEditActivityModal(prev => ({ ...prev, show: false }))}
                className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-activity-form"
                disabled={editActivityModal.saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer font-sans"
              >
                {editActivityModal.saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Shared Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-8">
            <button
              onClick={() => setShowAddExpenseModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500">
              <DollarSign className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 font-sans">Log Shared Bill</h3>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                >
                  <option value="Accommodation">Accommodation</option>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Activities & Tours">Activities & Tours</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Item / Activity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Group Dinner"
                  value={newExpense.itemName}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Amount ({tripCurrency.code})</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={newExpense.actualAmount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, actualAmount: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Who Paid?</label>
                <select
                  value={newExpense.paidBy}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, paidBy: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                >
                  <option value={user?.name}>{user?.name} (Me)</option>
                  {collaborators
                    .filter(c => c.name !== user?.name && c.status !== 'pending')
                    .map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expensesLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  {expensesLoading ? 'Logging...' : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Shared Document Modal */}
      {showUploadDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-8">
            <button
              onClick={() => setShowUploadDocModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500">
              <Shield className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 font-sans">Upload Document</h3>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight Ticket"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Type</label>
                <select
                  value={newDoc.type}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                >
                  <option value="passport">Passport</option>
                  <option value="visa">Visa</option>
                  <option value="ticket">Ticket</option>
                  <option value="hotel">Hotel Voucher</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Select File (PDF, Image, Max 10MB)</label>
                <input
                  type="file"
                  required
                  onChange={handleDocFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                />
                {newDoc.fileName && (
                  <span className="text-[9px] text-slate-400 font-bold block mt-1 truncate">Selected: {newDoc.fileName}</span>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docsLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  {docsLoading ? 'Encrypting...' : 'Upload Doc'}
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
