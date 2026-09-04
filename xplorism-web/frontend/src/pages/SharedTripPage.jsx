import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Compass as TripIcon, DollarSign, Users, Sparkles, Clock,
  MapPin, Download, Share2, ArrowRight, ArrowLeft, Sun, Cloud,
  CloudRain, Snowflake, Wind, UserPlus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { CURRENCIES } from './DashboardStub';

export default function SharedTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [joining, setJoining] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleJoinTrip = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setJoining(true);
      await api.post(`/trips/${id}/join`);
      showToast('Successfully joined trip workspace!', 'success');
      navigate(`/trips/${id}/collaborate`);
    } catch (err) {
      console.error('Error joining trip:', err);
      showToast(err.response?.data?.message || 'Failed to join trip.', 'error');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    const fetchSharedTrip = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/trips/share/${id}`);
        setTrip(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching shared trip:', err);
        setError(err.message || 'Failed to load the shared trip.');
        setLoading(false);
      }
    };
    if (id) {
      fetchSharedTrip();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-slate-505 text-sm font-medium animate-pulse">Loading shared itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md bg-white border border-slate-100 p-8 rounded-3xl shadow-xl"
        >
          <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <TripIcon className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black mb-3">Itinerary Not Found</h2>
          <p className="text-slate-505 text-sm mb-6">
            {error || "We couldn't find the shared trip. The link might be broken or the trip was deleted."}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold transition flex items-center justify-center space-x-2 shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Xplorism Home</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const parts = (trip.travelStyle || '').split('|');
  const style = parts[0] || 'Adventure';
  const tripCurrencyCode = parts[1] || 'USD';
  const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;
  const daysCount = Math.max(1, Math.ceil(Math.abs(new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)) + 1);

  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const getDayItineraries = () => {
    if (!trip.itineraries) return [];
    return trip.itineraries
      .filter((item) => item.day === activeDayTab)
      .sort((a, b) => {
        const getScore = (timeStr) => {
          if (!timeStr) return 999;
          const val = timeStr.toLowerCase().trim();
          if (val.startsWith('morning')) return 1;
          if (val.startsWith('afternoon')) return 2;
          if (val.startsWith('evening') || val.startsWith('night')) return 3;

          const match = val.match(/(\d+):(\d+)\s*(am|pm)/);
          if (match) {
            let hrs = parseInt(match[1]);
            const mins = parseInt(match[2]);
            const isPm = match[3] === 'pm';
            if (isPm && hrs < 12) hrs += 12;
            if (!isPm && hrs === 12) hrs = 0;
            return hrs * 60 + mins + 10;
          }
          return 999;
        };
        return getScore(a.time) - getScore(b.time);
      });
  };

  const shareTripLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Shareable link copied!', 'success');
    }).catch(err => {
      showToast('Failed to copy link', 'error');
    });
  };

  const exportTripToICS = () => {
    try {
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Xplorism//Itinerary Export//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      const formatICSDate = (date, hrs, mins) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(hrs).padStart(2, '0');
        const mi = String(mins).padStart(2, '0');
        return `${yyyy}${mm}${dd}T${hh}${mi}00`;
      };

      const itineraries = trip.itineraries || [];
      const tripStartDate = new Date(trip.startDate);

      itineraries.forEach((act, idx) => {
        const dayNum = parseInt(act.day) || 1;
        const eventDate = new Date(tripStartDate);
        eventDate.setDate(eventDate.getDate() + (dayNum - 1));

        let hours = 9;
        let minutes = 0;
        const timeStr = act.time || '';
        const cleanTime = timeStr.toLowerCase().trim();
        const match = cleanTime.match(/(\d+):(\d+)\s*(am|pm)/);
        if (match) {
          hours = parseInt(match[1]);
          minutes = parseInt(match[2]);
          const isPm = match[3] === 'pm';
          if (isPm && hours < 12) hrs += 12;
          if (!isPm && hours === 12) hours = 0;
        } else {
          if (cleanTime.includes('morning')) { hours = 9; }
          else if (cleanTime.includes('afternoon')) { hours = 14; }
          else if (cleanTime.includes('evening')) { hours = 18; }
          else if (cleanTime.includes('night')) { hours = 21; }
        }

        const dtStart = formatICSDate(eventDate, hours, minutes);
        const endMinutes = (minutes + 30) % 60;
        const endHours = hours + Math.floor((minutes + 30) / 60) + 1;
        const dtEnd = formatICSDate(eventDate, endHours % 24, endMinutes);

        const escapeText = (str) => (str || '').replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:trip-${trip.id}-day-${dayNum}-${idx}@xplorism.com`);
        icsContent.push(`DTSTAMP:${formatICSDate(new Date(), 12, 0)}Z`);
        icsContent.push(`DTSTART;TZID=UTC:${dtStart}`);
        icsContent.push(`DTEND;TZID=UTC:${dtEnd}`);
        icsContent.push(`SUMMARY:${escapeText(act.activity)}`);
        if (act.location) {
          icsContent.push(`LOCATION:${escapeText(act.location)}`);
        }
        icsContent.push(`DESCRIPTION:Day ${dayNum} - ${escapeText(act.activity)}${act.estimatedCost ? ` (Estimated Cost: ${act.estimatedCost})` : ''}`);
        icsContent.push('END:VEVENT');
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${trip.destination.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Calendar export (.ics) downloaded!', 'success');
    } catch (err) {
      console.error('Failed to export calendar', err);
      showToast('Failed to export calendar', 'error');
    }
  };

  const exportTripToPDF = async () => {
    setIsExporting(true);
    try {
      let heroImage = '';
      try {
        const destCity = (trip.destination || '').split(',')[0].trim();
        const searchQuery = encodeURIComponent(destCity);
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
          const pageTitle = searchData.query.search[0].title;
          const imageQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=1000&origin=*`;
          const imageRes = await fetch(imageQueryUrl);
          const imageData = await imageRes.json();
          const pages = imageData.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
            heroImage = pages[pageId].thumbnail.source;
          }
        }
      } catch (err) {
        console.error("Failed to fetch Wikipedia cover image", err);
      }

      if (!heroImage) {
        heroImage = trip.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
      }

      const daysMap = {};
      if (trip.itineraries) {
        trip.itineraries.forEach(item => {
          if (!daysMap[item.day]) {
            daysMap[item.day] = [];
          }
          daysMap[item.day].push(item);
        });
      }

      let daysHtml = '';
      const sortedDays = Object.keys(daysMap).map(Number).sort((a, b) => a - b);
      const getScore = (timeStr) => {
        if (!timeStr) return 999;
        const val = timeStr.toLowerCase().trim();
        if (val.startsWith('morning')) return 1;
        if (val.startsWith('afternoon')) return 2;
        if (val.startsWith('evening') || val.startsWith('night')) return 3;
        const match = val.match(/(\d+):(\d+)\s*(am|pm)/);
        if (match) {
          let hrs = parseInt(match[1]);
          const mins = parseInt(match[2]);
          const isPm = match[3] === 'pm';
          if (isPm && hrs < 12) hrs += 12;
          if (!isPm && hrs === 12) hrs = 0;
          return hrs * 60 + mins + 10;
        }
        return 999;
      };

      sortedDays.forEach((dayNum) => {
        const dayActivities = daysMap[dayNum] || [];
        const activities = dayActivities.sort((a, b) => getScore(a.time) - getScore(b.time));

        daysHtml += `
          <div class="day-section">
            <h3 class="day-title">
              <svg class="day-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Day ${dayNum} Schedule
            </h3>
            <div class="timeline">
              ${activities.map(act => `
                <div class="timeline-item">
                  <div class="time-badge">${act.time || 'All Day'}</div>
                  <div class="activity-card">
                    <p class="activity-desc">${act.activity}</p>
                    <div class="activity-meta">
                      ${act.location ? `
                        <span class="meta-item">
                          <svg class="icon text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          ${act.location}
                        </span>
                      ` : ''}
                      ${act.estimatedCost !== undefined ? `
                        <span class="meta-item cost-tag">
                          Est. Cost: ${tripCurrency.symbol}${Number(act.estimatedCost).toLocaleString(tripCurrency.locale)}
                        </span>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });

      const interestsHtml = (trip.interests && trip.interests.length > 0)
        ? trip.interests.map(i => `<span class="interest-badge">${i}</span>`).join('')
        : '<span class="no-interests">None Selected</span>';

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Itinerary - ${trip.destination}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1e293b; line-height: 1.5; padding: 40px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 24px; }
          .branding { display: flex; align-items: center; gap: 10px; }
          .brand-logo { width: 32px; height: 32px; background-color: #f87171; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px; }
          .brand-name { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
          .doc-type { font-size: 11px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; }
          
          .hero-banner { 
            position: relative;
            width: 100%;
            height: 280px;
            border-radius: 24px;
            background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.8)), url('${heroImage}');
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 35px;
            margin-bottom: 30px;
            color: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .hero-title { font-family: 'Playfair Display', serif; font-size: 38px; font-weight: 800; color: #ffffff; margin-bottom: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
          .hero-subtitle { font-size: 14px; font-weight: 500; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
          
          .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .metric-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ef4444; border-radius: 16px; padding: 16px; text-align: left; }
          .metric-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .metric-value { font-size: 15px; font-weight: 750; color: #0f172a; }
          
          .interests-section { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 20px; padding: 18px 24px; margin-bottom: 35px; }
          .interests-title { font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .interests-list { display: flex; flex-wrap: wrap; gap: 8px; }
          .interest-badge { background-color: #ffffff; border: 1px solid #fde68a; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 600; color: #78350f; }
          
          .day-section { margin-bottom: 40px; }
          .day-title { font-size: 22px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #ef4444; padding-bottom: 8px; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
          .day-title-icon { width: 20px; height: 20px; color: #ef4444; }
          .timeline { position: relative; padding-left: 24px; }
          .timeline::before { content: ''; position: absolute; left: 5px; top: 12px; bottom: 12px; width: 2px; background-color: #f1f5f9; }
          .timeline-item { position: relative; margin-bottom: 28px; }
          .timeline-item::before { content: ''; position: absolute; left: -23px; top: 6px; width: 10px; height: 10px; border-radius: 50%; background-color: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 0 2px #fee2e2; }
          .time-badge { font-size: 12px; font-weight: 750; color: #ef4444; margin-bottom: 6px; }
          
          .activity-card { background: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #ef4444; border-radius: 14px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.01); }
          .activity-desc { font-size: 14.5px; color: #1e293b; font-weight: 500; margin-bottom: 8px; }
          .activity-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
          .meta-item { font-size: 11px; color: #475569; display: flex; align-items: center; gap: 4px; font-weight: 600; }
          .cost-tag { background-color: #f1f5f9; padding: 2px 8px; border-radius: 6px; color: #334155; }
          .icon { width: 12px; height: 12px; }
          
          @media print {
            body { padding: 20px; }
            .timeline-item { page-break-inside: avoid; }
            .hero-banner { 
              background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.8)), url('${heroImage}') !important;
              print-color-adjust: exact !important; 
              -webkit-print-color-adjust: exact !important; 
            }
            .metric-card { background-color: #f8fafc !important; border-left: 4px solid #ef4444 !important; }
            .interests-section { background-color: #fffbeb !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="branding"><div class="brand-logo">X</div><div class="brand-name">Xplorism</div></div>
          <div class="doc-type">Personalized Travel Itinerary</div>
        </div>

        <div class="hero-banner">
          <div class="hero-content">
            <h1 class="hero-title">${trip.destination}</h1>
            <p class="hero-subtitle">${formatDate(trip.startDate)} to ${formatDate(trip.endDate)} • Planned with Xplorism AI</p>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card"><div class="metric-label">Duration</div><div class="metric-value">${daysCount} Days</div></div>
          <div class="metric-card"><div class="metric-label">Travelers</div><div class="metric-value">${trip.travelers} ${trip.travelers === 1 ? 'Person' : 'People'}</div></div>
          <div class="metric-card"><div class="metric-label">Style</div><div class="metric-value">${style}</div></div>
          <div class="metric-card"><div class="metric-label">Budget</div><div class="metric-value">${tripCurrency.symbol}${Number(trip.budget).toLocaleString(tripCurrency.locale)}</div></div>
        </div>

        <div class="interests-section">
          <div class="interests-title">Selected Interests</div>
          <div class="interests-list">${interestsHtml}</div>
        </div>

        ${daysHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const dayTabs = Array.from({ length: daysCount }, (_, i) => i + 1);
  const activeDayItineraries = getDayItineraries();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-16">
      {/* Brand Header */}
      <header className="border-b border-slate-100 bg-white/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-rose-500/20">
            X
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            Xplorism
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleJoinTrip}
            disabled={joining}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-rose-500/10 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{joining ? 'Joining...' : 'Add to Collaborative Trip'}</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-55 border border-slate-150 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <span>Plan Your Own Trip</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-6 mt-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Trip Summary & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card Wrapper */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-rose-500/5 blur-[50px]" />

            <div className="flex items-center space-x-2 text-rose-505 mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{style} Mode</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">
              {trip.destination}
            </h1>
            <p className="text-slate-500 text-xs font-semibold">
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </p>

            <hr className="border-slate-100 my-6" />

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Duration</span>
                <span className="text-sm font-extrabold text-slate-800">{daysCount} Days</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Travelers</span>
                <span className="text-sm font-extrabold text-slate-800">{trip.travelers} {trip.travelers === 1 ? 'Person' : 'People'}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Budget Allocation</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {tripCurrency.symbol}{Number(trip.budget).toLocaleString(tripCurrency.locale)}
                </span>
              </div>
            </div>

            {/* Interests Section */}
            {trip.interests && trip.interests.length > 0 && (
              <div className="mt-6">
                <span className="text-[10px] uppercase font-bold text-slate-505 block mb-3">Trip Focus & Interests</span>
                <div className="flex flex-wrap gap-2">
                  {trip.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-505 block mb-1">Trip Tools</span>
            <button
              onClick={shareTripLink}
              className="w-full py-3 rounded-xl border border-slate-150 bg-slate-55 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center justify-center space-x-2 text-sm shadow-sm"
            >
              <Share2 className="h-4 w-4 text-rose-500" />
              <span>Copy Shareable Link</span>
            </button>
            <button
              onClick={exportTripToICS}
              className="w-full py-3 rounded-xl border border-slate-150 bg-slate-55 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center justify-center space-x-2 text-sm shadow-sm"
            >
              <Calendar className="h-4 w-4 text-rose-500" />
              <span>Export Calendar (.ics)</span>
            </button>
            <button
              disabled={isExporting}
              onClick={exportTripToPDF}
              className="w-full py-3 rounded-xl border border-slate-150 bg-slate-55 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center justify-center space-x-2 text-sm shadow-sm disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-rose-500" />
              <span>{isExporting ? 'Exporting PDF...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Timelines & Itineraries */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col h-full min-h-[500px]">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-black text-slate-900">Daily Itinerary</h2>
              <div className="flex space-x-1.5 overflow-x-auto max-w-[60%] no-scrollbar py-1">
                {dayTabs.map((dayNum) => (
                  <button
                    key={dayNum}
                    onClick={() => setActiveDayTab(dayNum)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${activeDayTab === dayNum
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-150'
                      }`}
                  >
                    Day {dayNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Timelines content */}
            <div className="flex-1 relative">
              {activeDayItineraries.length > 0 ? (
                <div className="relative pl-7 border-l border-slate-100 space-y-6 ml-2.5">
                  <AnimatePresence mode="popLayout">
                    {activeDayItineraries.map((act, index) => (
                      <motion.div
                        key={act.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="relative group"
                      >
                        {/* Timeline Point */}
                        <div className="absolute -left-[36px] top-1.5 h-4 w-4 rounded-full bg-slate-50 border-[3px] border-rose-500 shadow-md group-hover:scale-110 transition-transform duration-300" />

                        <div className="bg-slate-50 border border-slate-100 hover:border-rose-500/30 rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center space-x-2 text-rose-500 font-bold text-xs mb-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{act.time || 'All Day'}</span>
                          </div>

                          <p className="text-slate-800 font-medium text-sm leading-relaxed mb-3">
                            {act.activity}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-550">
                            {act.location && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                <span>{act.location}</span>
                              </span>
                            )}
                            {act.estimatedCost !== undefined && (
                              <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-150 text-[11px] font-black text-emerald-600">
                                Est: {tripCurrency.symbol}{Number(act.estimatedCost).toLocaleString(tripCurrency.locale)}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                  <TripIcon className="h-10 w-10 text-slate-400 mb-4 animate-bounce" />
                  <p className="text-sm font-semibold">No activities planned for Day {activeDayTab}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-2.5 border text-sm font-bold ${toast.type === 'success'
                ? 'bg-white border-emerald-100 text-emerald-600'
                : 'bg-white border-rose-100 text-rose-500'
              }`}
          >
            <Sparkles className="h-4.5 w-4.5" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
