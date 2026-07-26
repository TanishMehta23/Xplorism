import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, DollarSign, Users, Compass, 
  Sparkles, X, ChevronRight, ChevronLeft, Check, AlertCircle
} from 'lucide-react';
import { generateItinerary } from '../services/itineraryGenerator';
import { api } from '../services/api';

const TRAVEL_STYLES = [
  { id: 'Adventure', name: 'Adventure', desc: 'Thrill-seeking & outdoor exploration' },
  { id: 'Luxury', name: 'Luxury', desc: 'Premium comfort & curated experiences' },
  { id: 'Budget', name: 'Budget', desc: 'Smart spending & local flavors' },
  { id: 'Cultural', name: 'Cultural', desc: 'Art, history, and heritage focus' },
  { id: 'Romantic', name: 'Romantic', desc: 'Picturesque settings & cozy dates' },
  { id: 'Relaxing', name: 'Relaxing', desc: 'Leisurely pace & spa vibes' }
];

const INTERESTS = ['Food', 'Nature', 'Architecture', 'Nightlife', 'Art', 'History', 'Beaches', 'Shopping', 'Hiking'];

const COUNTRY_TO_CURRENCY = {
  // Eurozone
  at: 'EUR', be: 'EUR', cy: 'EUR', ee: 'EUR', fi: 'EUR', fr: 'EUR', de: 'EUR', gr: 'EUR', ie: 'EUR', it: 'EUR', lv: 'EUR', lt: 'EUR', lu: 'EUR', mt: 'EUR', nl: 'EUR', pt: 'EUR', sk: 'EUR', si: 'EUR', es: 'EUR', hr: 'EUR',
  // Others
  in: 'INR', us: 'USD', gb: 'GBP', jp: 'JPY', cn: 'CNY', ch: 'CHF', ca: 'CAD', au: 'AUD', sg: 'SGD', nz: 'NZD', ae: 'AED', hk: 'HKD', th: 'THB', my: 'MYR', kr: 'KRW'
};

const CURRENCY_CONFIGS = {
  INR: { symbol: '₹', locale: 'en-IN', min: 5000, max: 500000, step: 5000, def: 50000, backpacker: 30000, comfort: 150000 },
  USD: { symbol: '$', locale: 'en-US', min: 100, max: 10000, step: 100, def: 1000, backpacker: 800, comfort: 2500 },
  EUR: { symbol: '€', locale: 'de-DE', min: 100, max: 10000, step: 100, def: 1000, backpacker: 800, comfort: 2500 },
  GBP: { symbol: '£', locale: 'en-GB', min: 100, max: 8000, step: 100, def: 800, backpacker: 650, comfort: 2000 },
  JPY: { symbol: '¥', locale: 'ja-JP', min: 10000, max: 1000000, step: 10000, def: 150000, backpacker: 80000, comfort: 400000 },
  AUD: { symbol: 'A$', locale: 'en-AU', min: 150, max: 15000, step: 150, def: 1500, backpacker: 1200, comfort: 4000 },
  CAD: { symbol: 'C$', locale: 'en-CA', min: 150, max: 15000, step: 150, def: 1500, backpacker: 1200, comfort: 4000 },
  CHF: { symbol: 'CHF', locale: 'de-CH', min: 100, max: 10000, step: 100, def: 1000, backpacker: 800, comfort: 2500 },
  CNY: { symbol: '¥', locale: 'zh-CN', min: 1000, max: 100000, step: 1000, def: 10000, backpacker: 6000, comfort: 30000 },
  SGD: { symbol: 'S$', locale: 'en-SG', min: 150, max: 15000, step: 150, def: 1500, backpacker: 1200, comfort: 4000 }
};

export default function TripWizard({ isOpen, onClose, onTripCreated, currencyCode = 'INR', initialData = null }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  
  const [wizardCurrencyCode, setWizardCurrencyCode] = useState(currencyCode);
  const currConfig = CURRENCY_CONFIGS[wizardCurrencyCode] || CURRENCY_CONFIGS.USD;

  // Form State
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(currConfig.def);
  const [travelers, setTravelers] = useState(1);
  const [travelStyle, setTravelStyle] = useState('Adventure');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [planType, setPlanType] = useState('dates'); // 'dates' or 'days'
  const [durationDays, setDurationDays] = useState(3);
  
  // Pre-populate form if initialData is provided
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDestination(initialData.destination || '');
        setStartDate(initialData.startDate || '');
        setEndDate(initialData.endDate || '');
        setBudget(initialData.budget || 1000);
        setTravelers(initialData.travelers || 1);
        
        const parts = (initialData.travelStyle || '').split('|');
        setTravelStyle(parts[0] || 'Adventure');
        if (parts[1]) {
          setWizardCurrencyCode(parts[1]);
        }
        setSelectedInterests(initialData.interests || []);
        
        if (initialData.startDate && initialData.endDate) {
          const diff = Math.abs(new Date(initialData.endDate) - new Date(initialData.startDate));
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
          setDurationDays(days);
        }
        setPlanType('dates');
      } else {
        setDestination('');
        setStartDate('');
        setEndDate('');
        setTravelers(1);
        setTravelStyle('Adventure');
        setSelectedInterests([]);
        setWizardCurrencyCode(currencyCode);
        setPlanType('dates');
        setDurationDays(3);
      }
      setStep(1);
      setError('');
    }
  }, [isOpen, initialData]);

  // Update budget when currencyCode changes for new plans
  useEffect(() => {
    if (isOpen && !initialData) {
      setWizardCurrencyCode(currencyCode);
    }
  }, [currencyCode, isOpen, initialData]);

  useEffect(() => {
    if (isOpen && !initialData) {
      setBudget(currConfig.def);
    }
  }, [wizardCurrencyCode, isOpen, initialData]);

  // Generation State
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  // Nominatim Autocomplete with local fallback dictionary
  useEffect(() => {
    if (destination.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      const popularCities = [
        { place_id: 'pop-tokyo', display_name: 'Tokyo, Japan', address: { country_code: 'jp' } },
        { place_id: 'pop-paris', display_name: 'Paris, France', address: { country_code: 'fr' } },
        { place_id: 'pop-newyork', display_name: 'New York, USA', address: { country_code: 'us' } },
        { place_id: 'pop-london', display_name: 'London, UK', address: { country_code: 'gb' } },
        { place_id: 'pop-sydney', display_name: 'Sydney, Australia', address: { country_code: 'au' } },
        { place_id: 'pop-rome', display_name: 'Rome, Italy', address: { country_code: 'it' } },
        { place_id: 'pop-singapore', display_name: 'Singapore', address: { country_code: 'sg' } },
        { place_id: 'pop-zurich', display_name: 'Zurich, Switzerland', address: { country_code: 'ch' } },
        { place_id: 'pop-delhi', display_name: 'New Delhi, India', address: { country_code: 'in' } },
        { place_id: 'pop-barcelona', display_name: 'Barcelona, Spain', address: { country_code: 'es' } },
        { place_id: 'pop-amsterdam', display_name: 'Amsterdam, Netherlands', address: { country_code: 'nl' } }
      ];

      const query = destination.toLowerCase().trim();
      const localMatches = popularCities.filter(c => c.display_name.toLowerCase().includes(query));

      try {
        const data = await api.get(`/geocode?q=${encodeURIComponent(destination)}`);
        if (data && data.length > 0) {
          const combined = [...data];
          localMatches.forEach(lm => {
            if (!combined.some(c => c.display_name.toLowerCase().includes(lm.display_name.toLowerCase()))) {
              combined.unshift(lm);
            }
          });
          setSuggestions(combined.slice(0, 6));
        } else {
          setSuggestions(localMatches);
        }
      } catch (err) {
        console.error('Suggestions error:', err);
        setSuggestions(localMatches);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [destination]);

  // Click outside suggestions list
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.destination-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  if (!isOpen) return null;

  const handleInterestToggle = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!destination.trim()) {
        setError('Please enter or select a destination.');
        return;
      }
    } else if (step === 2) {
      if (planType === 'days') {
        const today = new Date();
        const start = today.toISOString().split('T')[0];
        const end = new Date(today.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setStartDate(start);
        setEndDate(end);
      } else {
        if (!startDate || !endDate) {
          setError('Both start and end dates are required.');
          return;
        }
        if (new Date(startDate) > new Date(endDate)) {
          setError('Start date cannot be after end date.');
          return;
        }
        if (new Date(startDate) < new Date(new Date().setHours(0,0,0,0))) {
          setError('Start date cannot be in the past.');
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setStep(5);
    
    try {
      setGenStatus('Resolving location details...');
      await new Promise(r => setTimeout(r, 600));

      setGenStatus(`Generating customized travel plan with Gemini AI for ${destination}...`);
      const genResult = await api.post('/trips/generate', {
        destination,
        startDate,
        endDate,
        budget,
        travelers,
        travelStyle,
        interests: selectedInterests
      });
      
      setGenStatus('Injecting custom travel schedules...');
      await new Promise(r => setTimeout(r, 800));

      setGenStatus('Structuring cost-budget plans...');
      await new Promise(r => setTimeout(r, 600));

      setGenStatus('Finalizing itinerary details...');
      
      // Save Trip to DB via API
      const payload = {
        destination: genResult.resolvedName || destination,
        startDate,
        endDate,
        budget,
        travelers,
        travelStyle: `${travelStyle}|${wizardCurrencyCode}`,
        interests: selectedInterests,
        itinerary: genResult.itinerary
      };

      await api.post('/trips', payload);
      
      setGenStatus('Trip Created Successfully!');
      await new Promise(r => setTimeout(r, 500));
      
      onTripCreated();
      onClose();
      // Reset state
      setStep(1);
      setDestination('');
      setStartDate('');
      setEndDate('');
      setBudget(currConfig.def);
      setTravelers(1);
      setTravelStyle('Adventure');
      setSelectedInterests([]);
      setGenerating(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate itinerary. Please try again.');
      setStep(4);
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col max-h-[90vh] text-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-500">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <h3 className="font-bold text-lg text-slate-900">Create Custom Trip</h3>
          </div>
          {!generating && (
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Steps Tracker */}
        {!generating && (
          <div className="px-6 pt-4 flex justify-between text-xs font-semibold text-slate-400">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`flex items-center space-x-1 transition-all duration-300 ${step >= s ? 'text-rose-500' : ''}`}
              >
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] border ${step >= s ? 'bg-rose-50 border-rose-250 text-rose-500 font-bold' : 'border-slate-200 text-slate-450'}`}>
                  {step > s ? <Check className="h-3 w-3" /> : s}
                </div>
                <span className="hidden sm:inline">
                  {s === 1 && 'Where'}
                  {s === 2 && 'When'}
                  {s === 3 && 'Details'}
                  {s === 4 && 'Style'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Content Box */}
        <div className="h-[320px] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-2 text-red-655 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Destination</label>
                  <div className="relative destination-container">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-450 h-5 w-5" />
                    <input 
                      type="text" 
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="e.g. Tokyo, Paris, New York"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-rose-400 rounded-xl outline-none text-slate-800 transition text-sm shadow-sm"
                    />
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 z-20 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                        {suggestions.map((item) => (
                          <button
                            key={item.place_id}
                            onClick={() => {
                              const city = item.display_name.split(',')[0];
                              setDestination(city);
                              
                              if (item.address && item.address.country_code) {
                                const cc = item.address.country_code.toLowerCase();
                                const detectedCurrency = COUNTRY_TO_CURRENCY[cc] || 'USD';
                                setWizardCurrencyCode(detectedCurrency);
                              }
                              
                              setSuggestions([]);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition text-slate-650 text-xs flex items-center space-x-2"
                          >
                            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">{item.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Plan Type Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPlanType('dates')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${planType === 'dates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Specific Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanType('days')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${planType === 'days' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-550 hover:text-slate-800'}`}
                  >
                    Number of Days
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {planType === 'dates' ? (
                    <motion.div
                      key="datesForm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-2 gap-4 pt-2"
                    >
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-455 h-5 w-5 pointer-events-none" />
                          <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-11 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-rose-400 rounded-xl outline-none text-slate-800 transition text-sm shadow-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-455 h-5 w-5 pointer-events-none" />
                          <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-11 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-rose-400 rounded-xl outline-none text-slate-800 transition text-sm shadow-sm"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="daysForm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="pt-2"
                    >
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-4">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Trip Duration</span>
                        <div className="flex items-center space-x-6">
                          <button 
                            type="button"
                            onClick={() => setDurationDays(Math.max(1, durationDays - 1))}
                            className="h-10 w-10 rounded-full border border-slate-250 bg-white hover:bg-slate-200 hover:border-slate-350 transition flex items-center justify-center text-lg font-bold text-slate-700 cursor-pointer shadow-sm active:scale-95"
                          >
                            -
                          </button>
                          <span className="text-3xl font-extrabold text-slate-900 w-16 text-center">
                            {durationDays}
                          </span>
                          <button 
                            type="button"
                            onClick={() => setDurationDays(Math.min(30, durationDays + 1))}
                            className="h-10 w-10 rounded-full border border-slate-250 bg-white hover:bg-slate-200 hover:border-slate-350 transition flex items-center justify-center text-lg font-bold text-slate-700 cursor-pointer shadow-sm active:scale-95"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">{durationDays === 1 ? 'day' : 'days'} selected</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Travelers Counter */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Number of Travelers</label>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center space-x-3 text-slate-700">
                      <Users className="h-5 w-5 text-rose-450" />
                      <span className="text-sm font-bold">
                        {travelers === 1 ? 'Solo Adventurer' : travelers === 2 ? 'Couple / Pair' : `${travelers} Explorers`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setTravelers(Math.max(1, travelers - 1))}
                        className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer font-bold text-slate-600"
                      >
                        -
                      </button>
                      <span className="font-bold w-6 text-center text-slate-900">{travelers}</span>
                      <button
                        type="button"
                        onClick={() => setTravelers(travelers + 1)}
                        className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer font-bold text-slate-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Budget Slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-750 mb-2">
                    <span>Total Trip Budget</span>
                    <span className="text-rose-500 font-extrabold">{currConfig.symbol}{budget.toLocaleString(currConfig.locale)}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center space-x-3 text-slate-500">
                      <span className="text-rose-500 font-bold text-lg">{currConfig.symbol}</span>
                      <span className="text-xs font-semibold">
                        {budget < currConfig.backpacker ? 'Backpacker Budget' : budget < currConfig.comfort ? 'Comfort Traveler' : 'Premium Luxury'}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min={currConfig.min} 
                      max={currConfig.max} 
                      step={currConfig.step}
                      value={budget} 
                      onChange={(e) => setBudget(parseInt(e.target.value))}
                      className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Travel Style */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Travel Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    {TRAVEL_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setTravelStyle(style.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${travelStyle === style.id ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 bg-slate-50 hover:border-slate-350'}`}
                      >
                        <h4 className="text-sm font-bold text-slate-900">{style.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${isSelected ? 'bg-slate-900 border-slate-900 text-white font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="py-12 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative">
                  <div className="h-16 w-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
                  <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 text-rose-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-extrabold text-slate-900">Generating Itinerary</h4>
                  <p className="text-slate-500 text-sm">{genStatus}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!generating && (
          <div className="p-6 border-t border-slate-100 flex justify-between bg-slate-50/50">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-150 transition flex items-center space-x-2 text-slate-600 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white transition flex items-center space-x-2 cursor-pointer shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-sm font-bold text-white shadow-md shadow-rose-150 transition flex items-center space-x-2 cursor-pointer"
              >
                <Sparkles className="h-4.5 w-4.5" />
                <span>Generate Itinerary</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
