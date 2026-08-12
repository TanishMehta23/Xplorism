import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Calendar, Compass as TripIcon, DollarSign, Users, Sparkles, Clock, 
  MapPin, ArrowLeft, Send, UserPlus, X, Trash2, Shield, LogOut, Pencil,
  MessageCircle, Info, MessageSquare
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
  const [showDetailedSplitModal, setShowDetailedSplitModal] = useState(false);
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
  const [activeViewerDoc, setActiveViewerDoc] = useState(null);
  const [editDocModal, setEditDocModal] = useState({ show: false, docId: null, title: '', type: 'ticket' });
  const [packingModal, setPackingModal] = useState({
    show: false,
    type: 'add-item',
    title: '',
    inputValue: '',
    categoryIndex: null,
    itemIndex: null
  });
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

  // Polls & Notes State
  const [polls, setPolls] = useState([]);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [deletingPollId, setDeletingPollId] = useState(null);
  const [showEditDatesModal, setShowEditDatesModal] = useState(false);
  const [editDates, setEditDates] = useState({ startDate: '', endDate: '' });
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [editBudget, setEditBudget] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll window to top on page mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch Live Weather for Destination
  useEffect(() => {
    if (!trip || !trip.destination) return;
    
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        // Step 1: Geocode the destination (Open-Meteo Keyless API)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trip.destination)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude } = geoData.results[0];
          // Step 2: Fetch current weather details
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const weatherJson = await weatherRes.json();
          if (weatherJson.current_weather) {
            const temp = Math.round(weatherJson.current_weather.temperature);
            const code = weatherJson.current_weather.weathercode;
            
            // Map WMO codes to pretty icons and conditions
            let icon = '☀️';
            let cond = 'Clear Sky';
            if (code === 0) { icon = '☀️'; cond = 'Clear Sky'; }
            else if ([1, 2, 3].includes(code)) { icon = '⛅'; cond = 'Partly Cloudy'; }
            else if ([45, 48].includes(code)) { icon = '🌫️'; cond = 'Foggy'; }
            else if ([51, 53, 55, 56, 57].includes(code)) { icon = '🌧️'; cond = 'Drizzle'; }
            else if ([61, 63, 65, 66, 67].includes(code)) { icon = '🌧️'; cond = 'Rainy'; }
            else if ([71, 73, 75, 77].includes(code)) { icon = '❄️'; cond = 'Snowy'; }
            else if ([80, 81, 82].includes(code)) { icon = '🌧️'; cond = 'Showers'; }
            else if ([95, 96, 99].includes(code)) { icon = '⛈️'; cond = 'Thunderstorm'; }
            
            setWeatherData({ temp: `${temp}°C`, icon, cond });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch real-time weather', err);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [trip?.destination]);

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

      setNotes(tripData.notes || '');

      // Fetch polls
      try {
        const pollsData = await api.get(`/trips/${id}/polls`);
        setPolls(pollsData || []);
      } catch (err) {
        console.warn('Failed to load polls', err);
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
    if (!id || !user) return;

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

    socket.on('poll-updated', ({ action, data }) => {
      if (action === 'vote') {
        setPolls(prev => prev.map(p => p.id === data.pollId ? { ...p, votes: data.votes } : p));
        showToast('New vote cast in a group poll!', 'info');
      } else if (action === 'create') {
        setPolls(prev => [data, ...prev]);
        showToast('New group poll created!', 'info');
      } else if (action === 'delete') {
        setPolls(prev => prev.filter(p => p.id !== data.pollId));
        showToast('A group poll was deleted.', 'info');
      }
    });

    socket.on('notes-updated', ({ data }) => {
      setNotes(data);
    });

    socket.on('documents-updated', ({ action, data }) => {
      if (action === 'upload') {
        setTripDocuments(prev => {
          if (prev.some(d => d.id === data.id)) return prev;
          return [data, ...prev];
        });
        showToast('New document uploaded by co-traveler.', 'info');
      } else if (action === 'delete') {
        setTripDocuments(prev => prev.filter(d => d.id !== data.id));
        showToast('A document was deleted by co-traveler.', 'info');
      } else if (action === 'update') {
        setTripDocuments(prev => prev.map(d => d.id === data.id ? { ...d, title: data.title, type: data.type } : d));
        showToast('Document details updated by co-traveler.', 'info');
      }
    });

    socket.on('collaborators-updated', async () => {
      try {
        const collabData = await api.get(`/trips/${id}/collaborators`);
        setCollaborators(collabData);
      } catch (err) {
        console.warn('Failed to refresh collaborators list:', err);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id, user]);

  // Scroll to bottom of chat container only (prevents page body viewport scrolling)
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    };
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, loading, activeMainTab]);

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
      showToast('Request sent', 'success');
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

  const handleAddDayClick = async () => {
    try {
      const currentEndDate = new Date(trip.endDate);
      const newEndDate = new Date(currentEndDate.getTime() + 24 * 60 * 60 * 1000);
      
      const updatedTrip = await api.put(`/trips/${id}`, {
        endDate: newEndDate.toISOString()
      });
      
      setTrip(prev => ({
        ...prev,
        endDate: updatedTrip.endDate
      }));

      if (socketRef.current) {
        socketRef.current.emit('itinerary-changed', {
          tripId: id,
          action: 'update',
          data: { ...trip, endDate: updatedTrip.endDate }
        });
      }
      
      showToast(`Added Day ${daysCount + 1} to your itinerary!`, 'success');
    } catch (err) {
      console.error('Failed to add day:', err);
      showToast('Failed to add day.', 'error');
    }
  };

  const handleDeleteActiveDay = async () => {
    if (daysCount <= 1) {
      showToast('Your trip must have at least 1 day.', 'error');
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Delete Day',
      message: `Are you sure you want to delete Day ${activeDayTab}? This will delete all activities on this day and shorten the trip.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const currentEndDate = new Date(trip.endDate);
          const newEndDate = new Date(currentEndDate.getTime() - 24 * 60 * 60 * 1000);

          const currentItineraries = trip.itineraries || [];
          const updatedItineraries = currentItineraries
            .filter(item => item.day !== activeDayTab)
            .map(item => {
              if (item.day > activeDayTab) {
                return { ...item, day: item.day - 1 };
              }
              return item;
            });

          const updatedTrip = await api.put(`/trips/${id}`, {
            endDate: newEndDate.toISOString(),
            itinerary: updatedItineraries
          });

          setTrip(updatedTrip);
          
          setActiveDayTab(prev => Math.max(1, prev - 1));
          setConfirmModal(prev => ({ ...prev, show: false }));
          showToast(`Day deleted successfully.`, 'success');

          if (socketRef.current) {
            socketRef.current.emit('itinerary-changed', {
              tripId: id,
              action: 'update',
              data: updatedTrip
            });
          }
        } catch (err) {
          console.error('Failed to delete day:', err);
          showToast('Failed to delete day.', 'error');
        }
      }
    });
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

  const handleAddItemToPacking = (categoryIndex) => {
    setPackingModal({
      show: true,
      type: 'add-item',
      title: `Add Item to ${packingList[categoryIndex].category}`,
      inputValue: '',
      categoryIndex,
      itemIndex: null
    });
  };

  const handleEditPackingItem = (categoryIndex, itemIndex) => {
    setPackingModal({
      show: true,
      type: 'edit-item',
      title: 'Rename Checklist Item',
      inputValue: packingList[categoryIndex].items[itemIndex].name,
      categoryIndex,
      itemIndex
    });
  };

  const handleDeletePackingItem = (categoryIndex, itemIndex) => {
    const itemName = packingList[categoryIndex].items[itemIndex].name;
    setConfirmModal({
      show: true,
      title: 'Delete Checklist Item',
      message: `Are you sure you want to delete "${itemName}"?`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const updated = [...packingList];
          updated[categoryIndex].items.splice(itemIndex, 1);
          setPackingList(updated);
          await api.put(`/trips/${id}/packing`, { packingList: updated });
          if (socketRef.current) {
            socketRef.current.emit('packing-changed', { tripId: id, action: 'update', data: updated });
          }
          showToast('Item removed from list.', 'success');
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) {
          console.error(err);
          showToast('Failed to delete item.', 'error');
        }
      }
    });
  };

  const handleAddPackingCategory = () => {
    setPackingModal({
      show: true,
      type: 'add-category',
      title: 'Create Packing Category',
      inputValue: '',
      categoryIndex: null,
      itemIndex: null
    });
  };

  const handleDeletePackingCategory = (categoryIndex) => {
    const catName = packingList[categoryIndex].category;
    setConfirmModal({
      show: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${catName}" and all its items?`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const updated = [...packingList];
          updated.splice(categoryIndex, 1);
          setPackingList(updated);
          await api.put(`/trips/${id}/packing`, { packingList: updated });
          if (socketRef.current) {
            socketRef.current.emit('packing-changed', { tripId: id, action: 'update', data: updated });
          }
          showToast('Category deleted.', 'success');
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) {
          console.error(err);
          showToast('Failed to delete category.', 'error');
        }
      }
    });
  };

  const handlePackingModalSubmit = async (e) => {
    e.preventDefault();
    const val = packingModal.inputValue.trim();
    if (!val) return;

    try {
      const updated = [...packingList];
      if (packingModal.type === 'add-item') {
        updated[packingModal.categoryIndex].items.push({ name: val, checked: false });
        showToast('Item added.', 'success');
      } else if (packingModal.type === 'edit-item') {
        updated[packingModal.categoryIndex].items[packingModal.itemIndex].name = val;
        showToast('Item updated.', 'success');
      } else if (packingModal.type === 'add-category') {
        if (updated.some(c => c.category.toLowerCase() === val.toLowerCase())) {
          showToast('Category already exists!', 'error');
          return;
        }
        updated.push({ category: val, items: [] });
        showToast('Category created.', 'success');
      }

      setPackingList(updated);
      await api.put(`/trips/${id}/packing`, { packingList: updated });
      if (socketRef.current) {
        socketRef.current.emit('packing-changed', { tripId: id, action: 'update', data: updated });
      }
      setPackingModal(prev => ({ ...prev, show: false, inputValue: '' }));
    } catch (err) {
      console.error(err);
      showToast('Action failed.', 'error');
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!newPoll.question.trim() || newPoll.options.filter(o => o.trim()).length < 2) {
      showToast('Please enter a question and at least 2 options.', 'error');
      return;
    }

    try {
      setIsCreatingPoll(true);
      const filteredOptions = newPoll.options.filter(o => o.trim());
      const poll = await api.post(`/trips/${id}/polls`, {
        question: newPoll.question.trim(),
        options: filteredOptions
      });

      setPolls(prev => [poll, ...prev]);
      setShowCreatePollModal(false);
      setNewPoll({ question: '', options: ['', ''] });
      showToast('Poll created successfully!', 'success');

      if (socketRef.current) {
        socketRef.current.emit('poll-changed', {
          tripId: id,
          action: 'create',
          data: poll
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to create poll.', 'error');
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const handleVotePoll = async (pollId, optionIndex) => {
    try {
      const res = await api.post(`/trips/${id}/polls/${pollId}/vote`, { optionIndex });
      setPolls(prev => prev.map(p => p.id === pollId ? { ...p, votes: res.votes } : p));
      showToast('Vote registered.', 'success');

      if (socketRef.current) {
        socketRef.current.emit('poll-changed', {
          tripId: id,
          action: 'vote',
          data: { pollId, votes: res.votes }
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to register vote.', 'error');
    }
  };

  const handleDeletePoll = async (pollId) => {
    setConfirmModal({
      show: true,
      title: 'Delete Poll',
      message: 'Are you sure you want to delete this poll? This action cannot be undone.',
      confirmText: 'Delete',
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, loading: true, confirmText: 'Deleting...' }));
          await api.delete(`/trips/${id}/polls/${pollId}`);
          setPolls(prev => prev.filter(p => p.id !== pollId));
          showToast('Poll deleted successfully.', 'success');

          if (socketRef.current) {
            socketRef.current.emit('poll-changed', {
              tripId: id,
              action: 'delete',
              data: { pollId }
            });
          }
          setConfirmModal(prev => ({ ...prev, show: false, loading: false }));
        } catch (err) {
          console.error(err);
          showToast('Failed to delete poll.', 'error');
          setConfirmModal(prev => ({ ...prev, loading: false, confirmText: 'Delete' }));
        }
      }
    });
  };

  const handleNotesChange = async (val) => {
    setNotes(val);
    if (socketRef.current) {
      socketRef.current.emit('notes-changed', { tripId: id, data: val });
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      await api.put(`/trips/${id}`, { notes });
      showToast('Notes saved successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save notes.', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleOpenEditDates = () => {
    setEditDates({
      startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
      endDate: trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : ''
    });
    setShowEditDatesModal(true);
  };

  const handleSaveDates = async (e) => {
    e.preventDefault();
    try {
      const updatedTrip = await api.put(`/trips/${id}`, {
        startDate: editDates.startDate,
        endDate: editDates.endDate
      });
      setTrip(updatedTrip);
      setShowEditDatesModal(false);
      showToast('Trip dates updated successfully!', 'success');
      if (socketRef.current) {
        socketRef.current.emit('itinerary-changed', {
          tripId: id,
          action: 'update',
          data: updatedTrip
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update trip dates.', 'error');
    }
  };

  const handleOpenEditBudget = () => {
    setEditBudget(trip.budget || '');
    setShowEditBudgetModal(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!editBudget || isNaN(Number(editBudget))) {
      showToast('Please enter a valid budget amount.', 'error');
      return;
    }
    try {
      const updatedTrip = await api.put(`/trips/${id}`, {
        budget: parseFloat(editBudget)
      });
      setTrip(updatedTrip);
      setShowEditBudgetModal(false);
      showToast('Trip budget updated successfully!', 'success');
      if (socketRef.current) {
        socketRef.current.emit('itinerary-changed', {
          tripId: id,
          action: 'update',
          data: updatedTrip
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update trip budget.', 'error');
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
    const expenseItem = expenses.find(e => e.id === expId);
    const itemName = expenseItem ? expenseItem.itemName : 'this expense';
    setConfirmModal({
      show: true,
      title: 'Delete Expense',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
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
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) {
          console.error('Failed to delete expense:', err);
          showToast('Failed to delete expense.', 'error');
        } finally {
          setExpensesLoading(false);
        }
      }
    });
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

      if (socketRef.current) {
        socketRef.current.emit('documents-changed', {
          tripId: id,
          action: 'upload',
          data: uploaded
        });
      }
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

  const handleViewDocument = async (docId, docTitle, fileName) => {
    try {
      showToast(`Decrypting ${docTitle} for viewing...`, 'info');
      const res = await api.get(`/documents/${docId}/download`);
      
      const content = res.file_content;
      const isImg = fileName.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
      const isPdf = fileName.match(/\.pdf$/i);
      
      setActiveViewerDoc({
        title: docTitle,
        content: content,
        fileName: fileName,
        isImage: !!isImg,
        isPdf: !!isPdf
      });
    } catch (err) {
      console.error('Failed to view document:', err);
      showToast('Failed to retrieve document.', 'error');
    }
  };

  const handleDeleteDocument = (doc) => {
    setConfirmModal({
      show: true,
      title: 'Delete Document',
      message: `Are you sure you want to delete "${doc.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setDocsLoading(true);
          await api.delete(`/documents/${doc.id}`);
          setTripDocuments(prev => prev.filter(d => d.id !== doc.id));
          showToast('Document deleted.', 'success');
          setConfirmModal(prev => ({ ...prev, show: false }));

          if (socketRef.current) {
            socketRef.current.emit('documents-changed', {
              tripId: id,
              action: 'delete',
              data: { id: doc.id }
            });
          }
        } catch (err) {
          console.error('Failed to delete document:', err);
          showToast('Failed to delete document.', 'error');
        } finally {
          setDocsLoading(false);
        }
      }
    });
  };

  const handleEditDocumentClick = (doc) => {
    setEditDocModal({
      show: true,
      docId: doc.id,
      title: doc.title,
      type: doc.type
    });
  };

  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    try {
      setDocsLoading(true);
      const updated = await api.put(`/documents/${editDocModal.docId}`, {
        title: editDocModal.title,
        type: editDocModal.type
      });
      setTripDocuments(prev => prev.map(d => d.id === editDocModal.docId ? { ...d, title: updated.title, type: updated.type } : d));
      setEditDocModal({ show: false, docId: null, title: '', type: 'ticket' });
      showToast('Document updated successfully!', 'success');

      if (socketRef.current) {
        socketRef.current.emit('documents-changed', {
          tripId: id,
          action: 'update',
          data: updated
        });
      }
    } catch (err) {
      console.error('Failed to update document:', err);
      showToast('Failed to update document.', 'error');
    } finally {
      setDocsLoading(false);
    }
  };

  const calculateDetailedSplits = () => {
    const activeCollabs = collaborators.filter(c => c.status !== 'pending');
    if (activeCollabs.length === 0) return { balances: [], transactions: [], share: 0 };
    
    const N = activeCollabs.length;
    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.actualAmount || 0), 0);
    const share = totalSpent / N;
    
    const paidMap = {};
    activeCollabs.forEach(c => {
      paidMap[c.name] = 0;
    });
    
    expenses.forEach(e => {
      const payer = e.paidBy;
      if (payer) {
        const matchedCollab = activeCollabs.find(c => c.name.toLowerCase() === payer.toLowerCase());
        if (matchedCollab) {
          paidMap[matchedCollab.name] = (paidMap[matchedCollab.name] || 0) + parseFloat(e.actualAmount || 0);
        } else {
          paidMap[payer] = (paidMap[payer] || 0) + parseFloat(e.actualAmount || 0);
        }
      }
    });

    const balances = [];
    activeCollabs.forEach(c => {
      const paid = paidMap[c.name] || 0;
      balances.push({
        name: c.name,
        paid: paid,
        balance: paid - share
      });
    });

    const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b })).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter(b => b.balance > 0.01).map(b => ({ ...b })).sort((a, b) => b.balance - a.balance);

    const transactions = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const oweAmount = Math.min(-debtor.balance, creditor.balance);
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: oweAmount
      });

      debtor.balance += oweAmount;
      creditor.balance -= oweAmount;

      if (Math.abs(debtor.balance) < 0.01) {
        i++;
      }
      if (Math.abs(creditor.balance) < 0.01) {
        j++;
      }
    }

    return {
      balances,
      transactions,
      share
    };
  };

  const getCategoryTotals = () => {
    const totals = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      const amt = Number(e.actualAmount || e.actual_amount || 0);
      totals[cat] = (totals[cat] || 0) + amt;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
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

  const getTripCountdown = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(trip.endDate);
    end.setHours(0, 0, 0, 0);

    if (today < start) {
      const diffTime = start - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Starts in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (today >= start && today <= end) {
      return 'Happening Now ✈️';
    } else {
      return 'Past Trip';
    }
  };

  const getWeatherMock = () => {
    const dest = (trip.destination || '').toLowerCase();
    if (dest.includes('london')) return { temp: '18°C', icon: '🌧️', cond: 'Light Rain' };
    if (dest.includes('paris')) return { temp: '22°C', icon: '⛅', cond: 'Partly Cloudy' };
    if (dest.includes('frankfurt')) return { temp: '21°C', icon: '⛅', cond: 'Mostly Cloudy' };
    if (dest.includes('tokyo')) return { temp: '26°C', icon: '☀️', cond: 'Sunny' };
    if (dest.includes('bali') || dest.includes('beach')) return { temp: '30°C', icon: '🏖️', cond: 'Tropical Sunny' };
    return { temp: '24°C', icon: '☀️', cond: 'Clear Sky' };
  };

  const weather = getWeatherMock();

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
        
        {/* Left Column: Itinerary and Collaborators (8 cols on desktop, display contents on mobile) */}
        <div className="contents lg:flex lg:flex-col lg:space-y-6 lg:col-span-8 lg:order-1">
          
          {/* Header Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden order-1">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <button onClick={() => navigate('/shared-trips')} className="mb-4 flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Workspace</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">{trip.destination}</h1>
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-500 px-2 py-0.5 sm:px-2.5 rounded-full tracking-wider shrink-0">
                    {getTripCountdown()}
                  </span>
                </div>
                <button
                  onClick={handleOpenEditDates}
                  className="text-[11px] sm:text-sm text-slate-555 hover:text-rose-500 mt-1 flex items-center space-x-1 cursor-pointer transition group"
                  title="Edit Trip Dates"
                >
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-500 group-hover:scale-110 transition" />
                  <span className="font-semibold underline decoration-dotted decoration-slate-300 group-hover:decoration-rose-500">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()} ({daysCount} days)
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 group-hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all ml-1 font-bold">
                    (Edit)
                  </span>
                </button>
              </div>

              {/* Weather Forecast Pill */}
              <div className="bg-slate-550/5 border border-slate-100 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl flex items-center space-x-2.5 shrink-0 self-start sm:self-auto shadow-sm min-w-[130px] sm:min-w-[150px]">
                {weatherLoading ? (
                  <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
                ) : weatherData ? (
                  <>
                    <span className="text-xl sm:text-2xl">{weatherData.icon}</span>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Live Weather</span>
                      <span className="text-[10px] sm:text-xs font-black text-slate-800">{weatherData.temp} · {weatherData.cond}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xl sm:text-2xl">{weather.icon}</span>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Forecast</span>
                      <span className="text-[10px] sm:text-xs font-black text-slate-800">{weather.temp} · {weather.cond}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5">
              <button
                onClick={handleOpenEditBudget}
                className="p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl text-left hover:border-rose-500/35 transition cursor-pointer group"
                title="Edit Budget"
              >
                <span className="text-[9px] sm:text-[10px] text-slate-450 font-bold uppercase block group-hover:text-rose-500 transition">Budget</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-850 block mt-0.5">{tripCurrency.symbol}{Number(trip.budget).toLocaleString()} <span className="text-[8px] text-slate-400 font-bold group-hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all ml-1 sm:inline hidden">(Edit)</span></span>
              </button>
              <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] sm:text-[10px] text-slate-450 font-bold uppercase block">Travel Style</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-850 capitalize block mt-0.5">{style}</span>
              </div>
              <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] sm:text-[10px] text-slate-450 font-bold uppercase block">Travelers</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-850 block mt-0.5">{collaborators.filter(c => c.status !== 'pending').length} Persons</span>
              </div>
            </div>
          </div>

          {/* Tabbed Collaborative Workspace Panel */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col h-[85vh] overflow-hidden order-3 lg:order-2">
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
              <button
                onClick={() => setActiveMainTab('notes')}
                className={`pb-3 text-xs sm:text-sm font-black border-b-2 transition shrink-0 cursor-pointer ${
                  activeMainTab === 'notes' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-850'
                }`}
              >
                Workspace Notes
              </button>
              <button
                onClick={() => setActiveMainTab('polls')}
                className={`pb-3 text-xs sm:text-sm font-black border-b-2 transition shrink-0 cursor-pointer ${
                  activeMainTab === 'polls' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-850'
                }`}
              >
                Polls & Voting
              </button>
            </div>

            {/* Dynamic Content Panel */}
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* ITINERARY TAB */}
              {activeMainTab === 'itinerary' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-2 shrink-0">
                    <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-500">Workspace Itinerary</h2>
                    <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full no-scrollbar pb-1">
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
                      <button
                        onClick={handleAddDayClick}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 border border-dashed border-slate-350 hover:text-slate-800 hover:border-slate-400 transition-all duration-200 shrink-0 cursor-pointer flex items-center space-x-1"
                        title="Add Day to Itinerary"
                      >
                        <span>➕</span>
                        <span>Add Day</span>
                      </button>
                      {daysCount > 1 && (
                        <button
                          onClick={handleDeleteActiveDay}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-500 border border-dashed border-rose-200 hover:text-rose-700 hover:border-rose-350 transition-all duration-200 shrink-0 cursor-pointer flex items-center space-x-1"
                          title={`Delete Day ${activeDayTab}`}
                        >
                          <span>🗑️</span>
                          <span>Delete Day {activeDayTab}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 pl-6 scrollbar-thin relative">
                    {activeDayItineraries.length > 0 ? (
                      <div className="relative pl-6 border-l border-slate-200 space-y-5 ml-1">
                        {activeDayItineraries.map((act, index) => (
                          <div key={act.id || index} className="relative group">
                            <div className="absolute -left-[36px] top-1.5 w-6 h-6 rounded-full bg-white border-[3px] border-rose-500 flex items-center justify-center z-10 shadow-sm transition-transform duration-300 group-hover:scale-110">
                              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            </div>
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
                <div className="flex-1 flex flex-col font-sans min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2 shrink-0">
                    <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-500">Cooperative Packing List</h2>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleAddPackingCategory}
                        className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-rose-500/10"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Category</span>
                      </button>
                    </div>
                  </div>

                  {packingList.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin">
                      {packingList.map((cat, catIdx) => (
                        <div key={catIdx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-1.5">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{cat.category}</h4>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleAddItemToPacking(catIdx)}
                                className="px-2 py-1 rounded hover:bg-rose-500/10 text-[10px] text-rose-500 font-extrabold transition cursor-pointer flex items-center space-x-0.5"
                                title="Add Item"
                              >
                                <span>➕</span>
                                <span>Add Item</span>
                              </button>
                              <button
                                onClick={() => handleDeletePackingCategory(catIdx)}
                                className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cat.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-150 hover:border-rose-500/10 transition group"
                              >
                                <label className="flex items-center space-x-2.5 cursor-pointer select-none flex-1 overflow-hidden">
                                  <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => handleTogglePackingItem(catIdx, itemIdx)}
                                    className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 accent-rose-500"
                                  />
                                  <span className={`text-xs font-medium text-slate-800 truncate ${item.checked ? 'line-through text-slate-400' : ''}`}>
                                    {item.name}
                                  </span>
                                </label>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition shrink-0 ml-2">
                                  <button
                                    onClick={() => handleEditPackingItem(catIdx, itemIdx)}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                    title="Edit Item"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePackingItem(catIdx, itemIdx)}
                                    className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-450 border border-dashed border-slate-200 rounded-2xl">
                      <Sparkles className="h-9 w-9 text-rose-300 animate-pulse mb-2" />
                      <p className="text-xs font-bold text-slate-500">Packing checklist is empty.</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[250px] text-center leading-normal">Add custom categories and items to coordinate packing collaboratively with your group.</p>
                    </div>
                  )}
                </div>
              )}

              {/* BILL SPLITTER TAB */}
              {activeMainTab === 'expenses' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2 shrink-0">
                    <h2 className="text-[9px] xs:text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Shared Expenses Tracker</h2>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => setShowDetailedSplitModal(true)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center space-x-1 cursor-pointer border border-slate-200"
                      >
                        <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-550" />
                        <span className="hidden sm:inline">View Detailed Split</span>
                        <span className="sm:hidden">Split</span>
                      </button>
                      <button
                        onClick={() => setShowAddExpenseModal(true)}
                        className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-md shadow-rose-500/10"
                      >
                        <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline">Log Bill</span>
                        <span className="sm:hidden">Log</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
                    <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-850 rounded-2xl text-white shadow-xl relative overflow-hidden">
                      <div className="absolute right-2 bottom-2 opacity-5">
                        <DollarSign className="h-20 w-20" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Spent</span>
                      <span className="text-xl font-black">{tripCurrency.symbol}{expenses.reduce((sum, e) => sum + parseFloat(e.actualAmount || e.actual_amount || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-rose-50/50 border border-rose-500/10 rounded-2xl relative overflow-hidden">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Per Person Split</span>
                      <span className="text-xl font-black text-rose-500">
                        {tripCurrency.symbol}{((expenses.reduce((sum, e) => sum + parseFloat(e.actualAmount || e.actual_amount || 0), 0)) / (collaborators.filter(c => c.status !== 'pending').length || 1)).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-semibold mt-1">Split among {collaborators.filter(c => c.status !== 'pending').length} travelers</span>
                    </div>
                  </div>

                   {/* Expenses List & Category Chart */}
                  {expenses.length > 0 ? (
                    <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
                      {/* Left: Expenses List */}
                      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                        {expenses.map((e) => (
                          <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-black uppercase text-slate-600 shrink-0">
                                {e.category ? e.category.charAt(0) : '$'}
                              </div>
                              <div>
                                <span className="text-xs font-extrabold text-slate-800 block">{e.itemName || e.item_name}</span>
                                <span className="text-[9px] text-slate-500 font-semibold block">Paid by <strong className="text-rose-500">{e.paidBy || e.paid_by || 'Me'}</strong></span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-black text-slate-850">{tripCurrency.symbol}{Number(e.actualAmount || e.actual_amount).toLocaleString()}</span>
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

                      {/* Right: Category Donut Chart Visualizer */}
                      <div className="w-full md:w-56 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-3 text-center self-stretch border-b border-slate-200 pb-1.5">Category Spend</span>
                        {(() => {
                          const catTotals = getCategoryTotals();
                          const grandTotal = catTotals.reduce((sum, c) => sum + c.value, 0) || 1;
                          
                          let accumulatedPercent = 0;
                          return (
                            <div className="flex flex-col items-center w-full">
                              <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                  {catTotals.map((cat, idx) => {
                                    const percent = (cat.value / grandTotal) * 100;
                                    const strokeDash = `${percent} ${100 - percent}`;
                                    const strokeOffset = 100 - accumulatedPercent;
                                    accumulatedPercent += percent;
                                    
                                    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
                                    const color = colors[idx % colors.length];

                                    return (
                                      <circle
                                        key={idx}
                                        cx="18"
                                        cy="18"
                                        r="15.915"
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="4.2"
                                        strokeDasharray={strokeDash}
                                        strokeDashoffset={strokeOffset}
                                        className="transition-all duration-300"
                                      />
                                    );
                                  })}
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total</span>
                                  <span className="text-[11px] font-black text-slate-800 leading-normal mt-0.5">{tripCurrency.symbol}{Math.round(grandTotal).toLocaleString()}</span>
                                </div>
                              </div>
                              
                              <div className="w-full space-y-1 max-h-[110px] overflow-y-auto scrollbar-thin pr-1">
                                {catTotals.map((cat, idx) => {
                                  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'];
                                  const colorClass = colors[idx % colors.length];
                                  const percent = Math.round((cat.value / grandTotal) * 100);
                                  return (
                                    <div key={idx} className="flex items-center justify-between text-[9px] font-bold text-slate-700">
                                      <div className="flex items-center space-x-1 truncate">
                                        <span className={`h-1.5 w-1.5 rounded-full ${colorClass} shrink-0`} />
                                        <span className="truncate">{cat.name}</span>
                                      </div>
                                      <span className="shrink-0 text-slate-500 ml-1">{percent}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-450 border border-dashed border-slate-200 rounded-2xl">
                      <DollarSign className="h-9 w-9 text-slate-350 animate-pulse mb-2" />
                      <p className="text-xs font-bold text-slate-500">No expenses logged.</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[250px] text-center leading-normal">Add shared dinner bills, group taxi fares, or activity tickets to automatically split costs.</p>
                    </div>
                  )}
                </div>
              )}

              {/* SHARED DOCUMENTS VAULT */}
              {activeMainTab === 'docs' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2 shrink-0">
                    <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-500">Shared Documents Vault</h2>
                    <button
                      onClick={() => setShowUploadDocModal(true)}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-rose-500/10"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Upload Doc</span>
                    </button>
                  </div>

                  {tripDocuments.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start scrollbar-thin">
                      {tripDocuments.map((doc) => (
                        <div key={doc.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                          <div>
                            {/* Header Section: Icon + Title & Type + Action Button */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                  <Shield className="h-5 w-5" />
                                </div>
                                <div className="overflow-hidden">
                                  <h4 className="text-xs font-black text-slate-800 truncate" title={doc.title}>
                                    {doc.title}
                                  </h4>
                                  <span className="text-[9px] uppercase font-black text-rose-500 block mt-0.5">
                                    {doc.type || 'Document'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                                    Uploaded by: <span className="text-rose-500 font-extrabold">{doc.uploaded_by || 'Me'}</span>
                                  </span>
                                </div>
                              </div>

                              {doc.user_id === user.id && (
                                <div className="flex items-center space-x-1 shrink-0">
                                  <button
                                    onClick={() => handleEditDocumentClick(doc)}
                                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                    title="Edit Document"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(doc)}
                                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                    title="Delete Document"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Attachment Box with File Name and Action Buttons (Horizontal layout) */}
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-row items-center justify-between gap-4 mt-2">
                            <div className="flex items-center space-x-2 overflow-hidden min-w-0">
                              <span className="text-rose-500 font-bold shrink-0">📄</span>
                              <span className="text-[10px] font-bold text-slate-700 truncate" title={doc.file_name}>
                                {doc.file_name}
                              </span>
                            </div>

                            <div className="flex space-x-1.5 shrink-0">
                              <button
                                onClick={() => handleViewDocument(doc.id, doc.title, doc.file_name)}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[9px] font-black transition cursor-pointer flex items-center justify-center space-x-1"
                              >
                                <span>👁</span>
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(doc.id, doc.title)}
                                className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[9px] font-black transition cursor-pointer flex items-center justify-center space-x-1 shadow-sm"
                              >
                                <span>↓</span>
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
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

              {/* WORKSPACE NOTES TAB */}
              {activeMainTab === 'notes' && (
                <div className="flex-1 flex flex-col font-sans min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2 shrink-0">
                    <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-500">Shared Scratchpad Notes</h2>
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-rose-500/10"
                    >
                      <span>💾</span>
                      <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col relative">
                    <textarea
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Paste addresses, flight links, packing ideas, or scratch details here. Updates are synced in real-time to all co-travelers..."
                      className="w-full flex-1 p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500/30 resize-none font-mono leading-relaxed"
                    />
                    <div className="absolute bottom-3 right-3 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-emerald-500/20">
                      Auto-saving enabled
                    </div>
                  </div>
                </div>
              )}

              {/* POLLS & VOTING TAB */}
              {activeMainTab === 'polls' && (
                <div className="flex-1 flex flex-col font-sans min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2 shrink-0">
                    <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-500">Active Workspace Polls</h2>
                    <button
                      onClick={() => setShowCreatePollModal(true)}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-rose-500/10"
                    >
                      <span>🗳️</span>
                      <span>Create Poll</span>
                    </button>
                  </div>

                  {polls.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                      {polls.map((poll) => {
                        const totalVotes = poll.votes.length;
                        const hasVoted = poll.votes.some(v => v.userId === user.id);
                        const userVote = poll.votes.find(v => v.userId === user.id);

                        return (
                          <div key={poll.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-sm relative group">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-black text-slate-900">{poll.question}</h4>
                              <button
                                onClick={() => handleDeletePoll(poll.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Delete Poll"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              {poll.options.map((opt, idx) => {
                                const optionVoters = poll.votes.filter(v => v.optionIndex === idx);
                                const optionVotesCount = optionVoters.length;
                                const percent = totalVotes > 0 ? Math.round((optionVotesCount / totalVotes) * 100) : 0;
                                const isUserChoice = userVote && userVote.optionIndex === idx;

                                return (
                                  <div key={idx} className="space-y-1">
                                    <button
                                      onClick={() => handleVotePoll(poll.id, idx)}
                                      className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all relative overflow-hidden flex items-center justify-between cursor-pointer ${
                                        isUserChoice
                                          ? 'bg-rose-50 border-rose-400 text-rose-500'
                                          : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div 
                                        className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                                          isUserChoice ? 'bg-rose-500/10' : 'bg-slate-200/50'
                                        }`}
                                        style={{ width: `${percent}%` }}
                                      />
                                      <span className="relative z-10">{opt}</span>
                                      <span className="relative z-10 text-[10px] text-slate-500">
                                        {optionVotesCount} votes ({percent}%)
                                      </span>
                                    </button>

                                    {optionVoters.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1 mt-0.5 px-2.5">
                                        <span className="text-[9px] text-slate-400 font-medium">Voted by:</span>
                                        {optionVoters.map((voter) => (
                                          <span key={voter.userId} className="text-[9px] bg-white border border-slate-100 text-slate-600 px-1.5 py-0.5 rounded-lg font-bold shadow-sm">
                                            {voter.userName}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 text-[9px] text-slate-450 font-semibold flex justify-between items-center px-1">
                              <span>Total Votes: {totalVotes}</span>
                              {hasVoted && (
                                <span className="text-emerald-500 flex items-center space-x-0.5">
                                  <span>✓</span>
                                  <span>Your vote is registered</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-450 border border-dashed border-slate-200 rounded-2xl">
                      <MessageSquare className="h-9 w-9 text-slate-350 animate-pulse mb-2" />
                      <p className="text-xs font-bold text-slate-500">No active polls found.</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[250px] text-center leading-normal">Create polls to vote on flight times, hotel options, or dinner spots collaboratively.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Collaborators and Chat Sidebar (4 cols on desktop, display contents on mobile) */}
        <div className="contents lg:flex lg:flex-col lg:space-y-6 lg:col-span-4 lg:order-2">
          
          {/* Members / Collaborators Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl max-h-[300px] overflow-hidden flex flex-col order-2 lg:order-1">
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
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col h-[500px] lg:h-[74vh] overflow-hidden order-4 lg:order-2">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3 shrink-0">
              <MessageCircle className="h-4.5 w-4.5 text-rose-505" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Workspace Chat</h3>
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
                disabled={confirmModal.loading}
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {confirmModal.loading && <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>{confirmModal.confirmText}</span>
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

      {/* Detailed Split Breakdown Modal */}
      {showDetailedSplitModal && (() => {
        const { balances, transactions, share } = calculateDetailedSplits();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8">
              <button
                onClick={() => setShowDetailedSplitModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3 mb-5 text-rose-500">
                <Users className="h-6 w-6 animate-pulse" />
                <h3 className="text-lg font-black text-slate-900 font-sans">Detailed Bill Split</h3>
              </div>

              <div className="space-y-6">
                {/* Info summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 block font-semibold">Total Expenses</span>
                    <strong className="text-sm font-black text-slate-800">
                      {tripCurrency.symbol}{expenses.reduce((sum, e) => sum + parseFloat(e.actualAmount || 0), 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block font-semibold">Individual Share</span>
                    <strong className="text-sm font-black text-rose-500">
                      {tripCurrency.symbol}{share.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* Individual Balances */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Member Breakdown</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                    {balances.map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                        <div>
                          <strong className="text-slate-800 block">{b.name}</strong>
                          <span className="text-[10px] text-slate-500">Paid: {tripCurrency.symbol}{b.paid.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          {b.balance > 0.01 ? (
                            <span className="font-extrabold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                              Gets back {tripCurrency.symbol}{b.balance.toFixed(2)}
                            </span>
                          ) : b.balance < -0.01 ? (
                            <span className="font-extrabold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                              Owes {tripCurrency.symbol}{Math.abs(b.balance).toFixed(2)}
                            </span>
                          ) : (
                            <span className="font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                              Settled
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transfers/Settlements */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Settlement Plan (Simplest Transfers)</h4>
                  {transactions.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                      {transactions.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-rose-50/50 border border-rose-500/10 rounded-xl text-xs">
                          <div className="flex items-center space-x-2">
                            <strong className="text-rose-500 font-extrabold">{t.from}</strong>
                            <span className="text-slate-500 font-medium">gives</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <strong className="text-slate-900 font-extrabold">{tripCurrency.symbol}{t.amount.toFixed(2)}</strong>
                            <span className="text-slate-500 font-medium">to</span>
                            <strong className="text-emerald-600 font-extrabold">{t.to}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                      🎉 Everyone is completely settled!
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => setShowDetailedSplitModal(false)}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    Close Breakdown
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Document Viewer Modal */}
      {activeViewerDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            <button
              onClick={() => setActiveViewerDoc(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500">
              <Shield className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 font-sans">{activeViewerDoc.title}</h3>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
              {activeViewerDoc.isImage ? (
                <img 
                  src={activeViewerDoc.content} 
                  alt={activeViewerDoc.title}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
                />
              ) : activeViewerDoc.isPdf ? (
                <iframe 
                  src={activeViewerDoc.content} 
                  title={activeViewerDoc.title}
                  className="w-full h-[60vh] rounded-xl border-0"
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <p className="text-sm font-semibold mb-3">Preview not available for this file type.</p>
                  <span className="text-xs text-slate-400 font-bold block">{activeViewerDoc.fileName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-5 border-t border-slate-100 mt-5">
              <button
                onClick={() => setActiveViewerDoc(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = activeViewerDoc.content;
                  link.download = activeViewerDoc.fileName || activeViewerDoc.title;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer text-center"
              >
                Download Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editDocModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-8">
            <button
              onClick={() => setEditDocModal({ show: false, docId: null, title: '', type: 'ticket' })}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500">
              <Pencil className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 font-sans">Edit Document Details</h3>
            </div>

            <form onSubmit={handleUpdateDocument} className="space-y-4 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport"
                  value={editDocModal.title}
                  onChange={(e) => setEditDocModal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Type</label>
                <select
                  value={editDocModal.type}
                  onChange={(e) => setEditDocModal(prev => ({ ...prev, type: e.target.value }))}
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

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditDocModal({ show: false, docId: null, title: '', type: 'ticket' })}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docsLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  {docsLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packing List Modal */}
      {packingModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-8">
            <button
              onClick={() => setPackingModal(prev => ({ ...prev, show: false, inputValue: '' }))}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500">
              <Sparkles className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 font-sans">{packingModal.title}</h3>
            </div>

            <form onSubmit={handlePackingModalSubmit} className="space-y-4 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  {packingModal.type === 'add-category' ? 'Category Name' : 'Item Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={packingModal.type === 'add-category' ? 'e.g. Toiletries' : 'e.g. Sunscreen'}
                  value={packingModal.inputValue}
                  onChange={(e) => setPackingModal(prev => ({ ...prev, inputValue: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40"
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPackingModal(prev => ({ ...prev, show: false, inputValue: '' }))}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreatePollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-8">
            <button
              onClick={() => setShowCreatePollModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500">
              <MessageSquare className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 font-sans">Create Group Poll</h3>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-sans">Poll Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which hotel should we book?"
                  value={newPoll.question}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40 font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-sans">Options</label>
                {newPoll.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const updatedOpts = [...newPoll.options];
                        updatedOpts[idx] = e.target.value;
                        setNewPoll(prev => ({ ...prev, options: updatedOpts }));
                      }}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40 font-sans"
                    />
                    {newPoll.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedOpts = newPoll.options.filter((_, oIdx) => oIdx !== idx);
                          setNewPoll(prev => ({ ...prev, options: updatedOpts }));
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                        title="Remove Option"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => setNewPoll(prev => ({ ...prev, options: [...prev.options, ''] }))}
                  className="text-[10px] text-rose-500 font-extrabold hover:underline transition flex items-center space-x-1"
                >
                  <span>➕</span>
                  <span>Add Option</span>
                </button>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePollModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPoll}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer font-sans disabled:opacity-50"
                >
                  {isCreatingPoll ? 'Launching...' : 'Launch Poll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Dates Modal */}
      {showEditDatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-8">
            <button
              onClick={() => setShowEditDatesModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500">
              <Calendar className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 font-sans">Edit Trip Dates</h3>
            </div>

            <form onSubmit={handleSaveDates} className="space-y-4 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-sans">Start Date</label>
                <input
                  type="date"
                  required
                  value={editDates.startDate}
                  onChange={(e) => setEditDates(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40 font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-sans">End Date</label>
                <input
                  type="date"
                  required
                  value={editDates.endDate}
                  onChange={(e) => setEditDates(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40 font-sans"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditDatesModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold transition cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer font-sans"
                >
                  Save Dates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Budget Modal */}
      {showEditBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-8">
            <button
              onClick={() => setShowEditBudgetModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-850 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 text-rose-500">
              <DollarSign className="h-6 w-6 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 font-sans">Edit Trip Budget</h3>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-sans">Total Budget ({tripCurrency.symbol})</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="e.g. 1500"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500/40 font-sans"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditBudgetModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-505 text-xs font-bold transition cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer font-sans"
                >
                  Save Budget
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
                ? 'bg-white dark:bg-slate-900 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'bg-white dark:bg-slate-900 border-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
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
