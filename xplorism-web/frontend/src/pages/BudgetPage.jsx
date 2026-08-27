import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, Calendar, Compass as TripIcon,
  Trash2, Users, Tag, Edit, Clock, ArrowLeft, AlertCircle, Save,
  ArrowLeftRight, Coins
} from 'lucide-react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CURRENCIES, PRE_PLANNED_TRIPS } from './DashboardStub';
import { useLanguage } from '../context/LanguageContext';

export default function BudgetPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [budgetLoading, setBudgetLoading] = useState(true);

  // Live Currency Rates Converter State
  const [convAmount, setConvAmount] = useState('1');
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('INR');
  const [rates, setRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      setRatesLoading(true);
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurr}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            setRates(data.rates);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live exchange rates:", err);
        // Fallback static mock rates mapping (standard conversion averages)
        const mockRates = {
          USD: { INR: 83.5, EUR: 0.92, GBP: 0.79, AED: 3.67, CAD: 1.37, AUD: 1.51, JPY: 156.4, USD: 1 },
          EUR: { INR: 90.7, USD: 1.09, GBP: 0.86, AED: 3.99, CAD: 1.49, AUD: 1.64, JPY: 170.2, EUR: 1 },
          INR: { USD: 0.012, EUR: 0.011, GBP: 0.009, AED: 0.044, CAD: 0.016, AUD: 0.018, JPY: 1.87, INR: 1 },
          GBP: { USD: 1.27, EUR: 1.16, INR: 105.7, AED: 4.65, CAD: 1.73, AUD: 1.91, JPY: 198.1, GBP: 1 },
          AED: { USD: 0.27, EUR: 0.25, INR: 22.7, GBP: 0.21, CAD: 0.37, AUD: 0.41, JPY: 42.6, AED: 1 }
        };
        const baseRates = mockRates[fromCurr] || mockRates['USD'];
        setRates(baseRates);
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, [fromCurr]);

  const convertedValue = (() => {
    const amt = parseFloat(convAmount);
    if (isNaN(amt)) return 0;
    if (fromCurr === toCurr) return amt;
    const rate = rates[toCurr];
    return rate ? (amt * rate).toFixed(2) : '...';
  })();

  const handleSwapCurrencies = () => {
    const temp = fromCurr;
    setFromCurr(toCurr);
    setToCurr(temp);
  };

  // Form State
  const [expenseForm, setExpenseForm] = useState({ category: 'Food', itemName: '', plannedAmount: '', actualAmount: '', date: '', notes: '', paidBy: 'Me' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // AI & OCR States
  const [aiInsights, setAiInsights] = useState([]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleFetchInsights = async () => {
    setAiInsightsLoading(true);
    try {
      const res = await api.post(`/trips/${id}/budget/insights`);
      if (res && res.insights) {
        setAiInsights(res.insights);
        showToast('AI Insights successfully updated!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load AI Insights.', 'error');
    } finally {
      setAiInsightsLoading(false);
    }
  };

  const handleReceiptOcr = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.post(`/trips/${id}/budget/scan-receipt`, {
          fileContent: reader.result,
          fileName: file.name
        });
        if (res) {
          setExpenseForm(prev => ({
            ...prev,
            itemName: res.itemName || '',
            category: res.category === 'Food & Dining' ? 'Food' : res.category === 'Accommodation' ? 'Accommodation' : res.category === 'Transportation' ? 'Transport' : res.category === 'Activities & Tours' ? 'Activities' : res.category === 'Shopping' ? 'Shopping' : 'Other',
            actualAmount: String(res.actualAmount || '')
          }));
          showToast('Receipt scanned! Form fields populated.', 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to parse receipt image.', 'error');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const isPrePlanned = typeof id === 'string' && id.startsWith('pre-');

  // Fetch Trip Details
  useEffect(() => {
    const fetchTripDetails = async () => {
      setLoading(true);
      if (isPrePlanned) {
        const preTrip = PRE_PLANNED_TRIPS.find(t => t.id === id);
        if (preTrip) {
          setTrip(preTrip);
        } else {
          showToast(t('toast_trip_not_found'), 'error');
        }
        setLoading(false);
      } else {
        try {
          const trips = await api.get('/trips');
          const foundTrip = trips.find(t => t.id === id);
          if (foundTrip) {
            setTrip(foundTrip);
          } else {
            showToast(t('toast_trip_not_found'), 'error');
          }
        } catch (err) {
          console.error(err);
          showToast(t('toast_load_trip_fail'), 'error');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTripDetails();
  }, [id, isPrePlanned]);

  // Fetch Budget Details
  const fetchBudget = async () => {
    if (!id || !trip) return;
    setBudgetLoading(true);
    setShowExpenseForm(false);

    if (isPrePlanned) {
      const totalBudget = parseFloat(trip.budget) || 0;
      const itineraryItems = trip.itineraries || [];
      const expenses = [];

      const totalPlanned = itineraryItems.reduce(
        (sum, item) => sum + parseFloat(item.estimatedCost || 0),
        0
      );
      const totalActual = 0;
      const remaining = totalBudget - totalActual;
      const utilizationPercent = 0;

      const standardCategories = {
        'Accommodation': 0.35,
        'Food & Dining': 0.25,
        'Activities & Tours': 0.15,
        'Transportation': 0.15,
        'Shopping': 0.10
      };

      const categoryMap = {};
      Object.entries(standardCategories).forEach(([cat, pct]) => {
        categoryMap[cat] = {
          category: cat,
          planned: parseFloat((totalBudget * pct).toFixed(2)),
          actual: 0,
          count: 0,
          items: []
        };
      });

      const autoCategorize = (item) => {
        const name = ((item.activity || '') + ' ' + (item.location || '')).toLowerCase();
        if (name.includes('food') || name.includes('restaurant') || name.includes('dinner') || name.includes('lunch') || name.includes('breakfast') || name.includes('cafe') || name.includes('market') || name.includes('tasting') || name.includes('meal')) {
          return 'Food & Dining';
        }
        if (name.includes('museum') || name.includes('gallery') || name.includes('tour') || name.includes('guide') || name.includes('ticket') || name.includes('entrance') || name.includes('admission')) {
          return 'Activities & Tours';
        }
        if (name.includes('hotel') || name.includes('hostel') || name.includes('resort') || name.includes('stay') || name.includes('lodging') || name.includes('accommodation')) {
          return 'Accommodation';
        }
        if (name.includes('flight') || name.includes('train') || name.includes('bus') || name.includes('taxi') || name.includes('uber') || name.includes('ferry') || name.includes('transport') || name.includes('cab') || name.includes('rental') || name.includes('gas') || name.includes('fuel')) {
          return 'Transportation';
        }
        if (name.includes('shop') || name.includes('souvenir') || name.includes('gift') || name.includes('boutique') || name.includes('mall') || name.includes('bazaar')) {
          return 'Shopping';
        }
        return 'Miscellaneous';
      };

      const findStandardCategory = (cat) => {
        const match = Object.keys(standardCategories).find(sc => 
          sc.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(sc.toLowerCase())
        );
        return match || 'Miscellaneous';
      };

      itineraryItems.forEach(item => {
        const cat = autoCategorize(item);
        const standardCat = findStandardCategory(cat);
        if (!categoryMap[standardCat]) {
          categoryMap[standardCat] = { category: standardCat, planned: 0, actual: 0, count: 0, items: [] };
        }
        categoryMap[standardCat].count += 1;
      });

      const categoryBreakdown = Object.values(categoryMap).map(c => ({
        ...c,
        planned: parseFloat(c.planned.toFixed(2)),
        actual: parseFloat(c.actual.toFixed(2)),
        diff: parseFloat((c.actual - c.planned).toFixed(2)),
      })).sort((a, b) => b.planned - a.planned);

      const dailyMap = {};
      itineraryItems.forEach(item => {
        const day = item.day;
        if (!dailyMap[day]) dailyMap[day] = { day, planned: 0, actual: 0, items: [] };
        dailyMap[day].planned += parseFloat(item.estimatedCost || 0);
        dailyMap[day].items.push({
          type: 'itinerary',
          name: item.activity,
          location: item.location,
          planned: parseFloat(item.estimatedCost || 0),
          actual: 0,
          time: item.time,
        });
      });
      const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.day - b.day);

      setBudgetData({
        tripId: id,
        destination: trip.destination,
        totalBudget,
        totalPlanned,
        totalActual,
        remaining,
        utilizationPercent,
        categoryBreakdown,
        dailyBreakdown,
        expenses,
        isPrePlanned: true
      });
      setBudgetLoading(false);
    } else {
      try {
        const data = await api.get(`/trips/${id}/budget`);
        setBudgetData(data);
      } catch (err) {
        console.error('Failed to fetch budget:', err);
        setBudgetData(null);
      } finally {
        setBudgetLoading(false);
      }
    }
  };

  useEffect(() => {
    if (trip) {
      fetchBudget();
    }
  }, [trip]);

  // Handle Save Pre-planned Trip to User's Account
  const [isSavingTrip, setIsSavingTrip] = useState(false);
  const handleSavePrePlanned = async () => {
    if (!trip || isSavingTrip) return;
    setIsSavingTrip(true);
    try {
      const response = await api.post('/trips', {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        travelers: trip.travelers,
        travelStyle: trip.travelStyle,
        interests: trip.interests,
        itinerary: trip.itineraries
      });
      showToast(t('toast_save_trip_success'), 'success');
      setTimeout(() => {
        navigate(`/trips/${response.id}/budget`);
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast(t('toast_save_trip_fail'), 'error');
    } finally {
      setIsSavingTrip(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.actualAmount || !expenseForm.date) {
      showToast(t('toast_fill_fields'), 'error');
      return;
    }
    try {
      const parts = (trip.travelStyle || '').split('|');
      const tripCurrencyCode = parts[1] || 'INR';

      await api.post(`/trips/${id}/expenses`, {
        category: expenseForm.category,
        itemName: expenseForm.itemName || 'Unnamed Expense',
        plannedAmount: parseFloat(expenseForm.plannedAmount || 0),
        actualAmount: parseFloat(expenseForm.actualAmount),
        date: expenseForm.date,
        notes: expenseForm.notes || '',
        currency: tripCurrencyCode,
        paidBy: expenseForm.paidBy || 'Me',
      });
      showToast(t('toast_expense_added'), 'success');
      setExpenseForm({ category: 'Food', itemName: '', plannedAmount: '', actualAmount: '', date: '', notes: '', paidBy: 'Me' });
      setShowExpenseForm(false);
      fetchBudget();
    } catch (err) {
      console.error('Failed to add expense:', err);
      showToast(t('toast_add_expense_fail'), 'error');
    }
  };

  const handleUpdateExpense = async (expenseId) => {
    if (!editingExpense) return;
    try {
      await api.put(`/trips/${id}/expenses/${expenseId}`, {
        category: editingExpense.category,
        itemName: editingExpense.itemName,
        plannedAmount: parseFloat(editingExpense.plannedAmount || 0),
        actualAmount: parseFloat(editingExpense.actualAmount),
        date: editingExpense.date,
        notes: editingExpense.notes || '',
        paidBy: editingExpense.paidBy || 'Me',
      });
      showToast(t('toast_expense_updated'), 'success');
      setEditingExpense(null);
      setShowExpenseForm(false);
      fetchBudget();
    } catch (err) {
      console.error('Failed to update expense:', err);
      showToast(t('toast_update_expense_fail'), 'error');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/trips/${id}/expenses/${expenseId}`);
      showToast(t('toast_expense_deleted'), 'success');
      fetchBudget();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showToast(t('toast_delete_expense_fail'), 'error');
    }
  };

  const startEditExpense = (expense) => {
    setEditingExpense({
      id: expense.id,
      category: expense.category || 'Food',
      itemName: expense.itemName || '',
      plannedAmount: expense.plannedAmount?.toString() || '',
      actualAmount: expense.actualAmount?.toString() || '',
      date: expense.date || '',
      notes: expense.notes || '',
      paidBy: expense.paidBy || expense.paid_by || 'Me',
    });
    setShowExpenseForm(true);
  };

  const totalSpentVal = budgetData?.categoryBreakdown?.reduce((sum, c) => sum + parseFloat(c.actual || 0), 0) || 0;

  const getSlices = () => {
    if (!budgetData || !budgetData.categoryBreakdown) return [];
    let accumulatedPercent = 0;
    return budgetData.categoryBreakdown.map(cat => {
      const val = parseFloat(cat.actual || 0);
      const pct = totalSpentVal > 0 ? (val / totalSpentVal) * 100 : 0;
      const color = cat.category.toLowerCase().includes('accommodation') ? '#3b82f6'
                  : cat.category.toLowerCase().includes('food') ? '#ef4444'
                  : cat.category.toLowerCase().includes('activities') ? '#eab308'
                  : cat.category.toLowerCase().includes('transport') ? '#10b981'
                  : cat.category.toLowerCase().includes('shop') ? '#ec4899'
                  : '#64748b';
      const offset = accumulatedPercent;
      accumulatedPercent += pct;
      return { ...cat, pct, color, offset };
    });
  };

  const slices = getSlices();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm animate-pulse font-medium">{t('loading_saved')}</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Trip Not Found</h2>
        <p className="text-slate-550 text-sm mb-6 text-center max-w-md">We couldn't locate the trip you are looking for.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-850 transition">
          {t('back_to_dashboard')}
        </button>
      </div>
    );
  }

  const parts = (trip.travelStyle || '').split('|');
  const style = parts[0] || 'Adventure';
  const tripCurrencyCode = parts[1] || 'INR';
  const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;

  const getCategoryTranslation = (catName) => {
    const normalized = (catName || '').toLowerCase();
    if (normalized === 'food' || normalized === 'food & dining') return t('category_food_dining');
    if (normalized === 'accommodation') return t('category_accommodation');
    if (normalized === 'transport' || normalized === 'transportation') return t('category_transportation');
    if (normalized === 'activities' || normalized === 'activities & tours') return t('category_activities_tours');
    if (normalized === 'shopping') return t('category_shopping');
    return t('category_miscellaneous');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar activeTab="trips" />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {/* Back navigation & header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-650 hover:text-slate-900 transition-all cursor-pointer border border-slate-200 bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-rose-500 mb-1">
                <TripIcon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t('style_' + style.toLowerCase()) || style} Mode</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                {trip.destination} {t('budget_tracker')}
              </h1>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('date_schedule')}</p>
              <p className="text-sm font-bold text-slate-800">
                {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Users className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('travelers')}</p>
              <p className="text-sm font-bold text-slate-800">{trip.travelers} {trip.travelers === 1 ? t('traveler') : t('travelers')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('starting_budget')}</p>
              <p className="text-sm font-bold text-slate-800">
                {tripCurrency.symbol}{Number(trip.budget).toLocaleString(tripCurrency.locale)}
              </p>
            </div>
          </div>
        </div>

        {budgetLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">{t('calculating_breakdowns')}</p>
          </div>
        ) : !budgetData ? (
          <div className="bg-white border border-slate-150 rounded-3xl p-12 text-center shadow-sm">
            <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">{t('no_budget_data')}</h2>
            <p className="text-slate-550 text-sm mb-6 max-w-sm mx-auto">{t('no_budget_data_desc')}</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition">
              {t('back_to_dashboard')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side: Overview, breakdowns */}
            <div className="lg:col-span-8 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('total_estimated_budget')}</span>
                  <p className="text-2xl font-extrabold text-emerald-800 mt-2">
                    {tripCurrency.symbol}{Number(budgetData.totalBudget).toLocaleString(tripCurrency.locale)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{t('budget_planned')}: {tripCurrency.symbol}{Number(budgetData.totalPlanned).toLocaleString(tripCurrency.locale)}</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{t('budget_spent')}</span>
                  <p className="text-2xl font-extrabold text-rose-800 mt-2">
                    {tripCurrency.symbol}{Number(budgetData.totalActual || budgetData.totalSpent || 0).toLocaleString(tripCurrency.locale)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{t('tracked_expenses_desc')}</p>
                </div>
                <div className={`${(budgetData.remaining || budgetData.remaining === 0) && budgetData.remaining >= 0 ? 'bg-sky-50 border-sky-100' : 'bg-rose-50 border-rose-100'} border rounded-3xl p-5 shadow-sm`}>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('remaining_funds')}</span>
                  <p className={`text-2xl font-extrabold mt-2 ${(budgetData.remaining || budgetData.remaining === 0) && budgetData.remaining >= 0 ? 'text-sky-800' : 'text-rose-800'}`}>
                    {tripCurrency.symbol}{Number(budgetData.remaining || 0).toLocaleString(tripCurrency.locale)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{t('leftover_funds')}</p>
                </div>
              </div>

              {/* Progress Utilization */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t('utilization_progress')}</h3>
                    <p className="text-xs text-slate-505">{t('utilization_progress_desc')}</p>
                  </div>
                  <span className={`text-sm font-extrabold ${(budgetData.utilizationPercent || budgetData.percentSpent || 0) > 80 ? 'text-rose-600' : (budgetData.utilizationPercent || budgetData.percentSpent || 0) > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {Math.round(budgetData.utilizationPercent || budgetData.percentSpent || 0)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${(budgetData.utilizationPercent || budgetData.percentSpent || 0) > 80 ? 'bg-rose-500' : (budgetData.utilizationPercent || budgetData.percentSpent || 0) > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(budgetData.utilizationPercent || budgetData.percentSpent || 0, 100)}%` }}
                  />
                </div>
              </div>

              {/* Preplanned notice */}
              {budgetData.isPrePlanned && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 font-sans">Unsaved Pre-planned Itinerary</h4>
                      <p className="text-xs text-emerald-705 mt-1 font-sans">
                        We are currently showing calculated budget estimates based on the pre-planned day itineraries. Save this trip to log actual expenses and tracking details.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSavePrePlanned}
                    disabled={isSavingTrip}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition shrink-0 shadow-sm flex items-center space-x-2 font-sans"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingTrip ? 'Saving...' : 'Save to My Trips'}</span>
                  </button>
                </div>
              )}

              {/* Visual Breakdown Analytics Dashboard */}
              {budgetData.categoryBreakdown && budgetData.categoryBreakdown.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b pb-4 border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <Tag className="h-4.5 w-4.5 mr-2 text-emerald-500" />
                      Visual Budget Analytics
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Doughnut Chart SVG */}
                    <div className="md:col-span-4 text-center border-r border-slate-50 md:pr-4">
                      <div className="relative inline-block">
                        <svg width="120" height="120" viewBox="0 0 36 36" className="transform -rotate-90">
                          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="3" />
                          {slices.map((slice, i) => slice.pct > 0 && (
                            <circle
                              key={i}
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth="3.2"
                              strokeDasharray={`${slice.pct} ${100 - slice.pct}`}
                              strokeDashoffset={100 - slice.offset}
                              className="transition-all duration-300 hover:stroke-[3.8]"
                              title={`${slice.category}: ${slice.pct.toFixed(1)}%`}
                            />
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Spent</span>
                          <span className="text-sm font-black text-slate-800 mt-0.5">
                            {tripCurrency.symbol}{Math.round(totalSpentVal).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comparative Planned vs Actual Bar Chart */}
                    <div className="md:col-span-8 space-y-3.5">
                      {budgetData.categoryBreakdown.map((cat, idx) => {
                        const planned = parseFloat(cat.planned || 0);
                        const actual = parseFloat(cat.actual || 0);
                        const maxVal = Math.max(1, ...budgetData.categoryBreakdown.map(c => Math.max(parseFloat(c.planned || 0), parseFloat(c.actual || 0))));
                        const plannedPct = (planned / maxVal) * 100;
                        const actualPct = (actual / maxVal) * 100;
                        const color = cat.category.toLowerCase().includes('accommodation') ? 'bg-blue-500'
                                    : cat.category.toLowerCase().includes('food') ? 'bg-red-500'
                                    : cat.category.toLowerCase().includes('activities') ? 'bg-amber-500'
                                    : cat.category.toLowerCase().includes('transport') ? 'bg-emerald-500'
                                    : cat.category.toLowerCase().includes('shop') ? 'bg-pink-500'
                                    : 'bg-slate-500';

                        return (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between font-bold text-slate-700">
                              <span>{getCategoryTranslation(cat.category)}</span>
                              <span>
                                {tripCurrency.symbol}{Math.round(actual)} <span className="text-slate-400 font-medium">/ {tripCurrency.symbol}{Math.round(planned)}</span>
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {/* Planned Bar */}
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-300 rounded-full" style={{ width: `${plannedPct}%` }} />
                              </div>
                              {/* Actual Bar */}
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${color}`} style={{ width: `${actualPct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Standard category list grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-5 border-slate-100">
                    {budgetData.categoryBreakdown.map((cat, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-800">{getCategoryTranslation(cat.category)}</span>
                          <div className="flex items-center space-x-2 mt-1.5">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cat.actual > cat.planned ? 'bg-rose-450' : 'bg-emerald-405'}`}
                                style={{ width: `${cat.planned > 0 ? Math.min((cat.actual / cat.planned) * 100, 100) : cat.actual > 0 ? 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400 w-12 text-right">
                              {cat.count} {cat.count === 1 ? t('item') : t('items')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs font-bold text-slate-900">{tripCurrency.symbol}{Number(cat.actual).toLocaleString(tripCurrency.locale)}</p>
                          <p className="text-[9px] text-slate-400">{t('of')} {tripCurrency.symbol}{Number(cat.planned).toLocaleString(tripCurrency.locale)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Smart Assistant Card */}
              {!budgetData.isPrePlanned && (
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-16 -right-16 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-125 transition duration-500" />
                  <h3 className="text-sm font-extrabold flex items-center gap-2 mb-3">
                    <span className="text-rose-500">🤖</span> Xplorism AI Smart Insights
                  </h3>
                  {aiInsightsLoading ? (
                    <div className="flex items-center space-x-2 text-xs py-4 text-slate-400 font-bold">
                      <div className="h-4.5 w-4.5 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin" />
                      <span>Consulting Gemini for destination cost-saving recommendations...</span>
                    </div>
                  ) : aiInsights.length > 0 ? (
                    <div className="space-y-2.5">
                      {aiInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                          <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                          <p className="font-semibold text-slate-350 leading-relaxed">{insight}</p>
                        </div>
                      ))}
                      <button
                        onClick={handleFetchInsights}
                        className="text-[10px] font-black text-rose-400 uppercase tracking-wider hover:text-rose-300 mt-2 block cursor-pointer transition"
                      >
                        Recalculate Tips
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <p className="text-xs text-slate-400 font-medium max-w-md">Let Gemini analyze your current category expenses and recommend hyper-localized savings for this trip.</p>
                      <button
                        onClick={handleFetchInsights}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-black text-xs text-white transition active:scale-95 cursor-pointer shadow-md"
                      >
                        Get AI Coach Tips
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Daily breakdown */}
              {budgetData.dailyBreakdown && budgetData.dailyBreakdown.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                    {t('budget_tracker')}
                  </h3>
                  <div className="space-y-4">
                    {budgetData.dailyBreakdown.map((day, idx) => (
                      <div key={idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-800">{t('day')} {day.day || 'N/A'}</span>
                          <span className="text-xs font-bold text-slate-700">
                            {t('budget_spent')}: {tripCurrency.symbol}{Number(day.actual).toLocaleString(tripCurrency.locale)} / {t('budget_limit')}: {tripCurrency.symbol}{Number(day.planned).toLocaleString(tripCurrency.locale)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div className={`h-full rounded-full ${day.actual > day.planned ? 'bg-rose-400' : 'bg-emerald-400'}`}
                            style={{ width: `${day.planned > 0 ? Math.min((day.actual / day.planned) * 100, 100) : day.actual > 0 ? 100 : 0}%` }} />
                        </div>
                        <div className="pl-4 border-l-2 border-slate-200 space-y-1.5 mt-2">
                          {day.items.map((it, iIdx) => (
                            <div key={iIdx} className="flex justify-between items-center text-[10px] text-slate-500">
                              <span>{it.name} <span className="text-slate-400">({it.type === 'itinerary' ? t('budget_planned') : t('budget_spent')})</span></span>
                              <span className="font-semibold">{tripCurrency.symbol}{Number(it.actual || it.planned || 0).toLocaleString(tripCurrency.locale)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Co-Traveler Split Ledger */}
              {!budgetData.isPrePlanned && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    <Users className="h-4.5 w-4.5 mr-2 text-emerald-500" />
                    👥 Co-Traveler Split Share Ledger
                  </h3>
                  
                  {(() => {
                    const travelersCount = Math.max(1, trip.travelers);
                    const totalSpentVal = budgetData.totalActual || budgetData.totalSpent || 0;
                    const targetShare = totalSpentVal / travelersCount;
                    
                    const payments = { 'Me': 0 };
                    for (let i = 0; i < travelersCount - 1; i++) {
                      payments[`Co-Traveler ${String.fromCharCode(65 + i)}`] = 0;
                    }
                    
                    (budgetData.expenses || []).forEach(exp => {
                      const payer = exp.paidBy || exp.paid_by || 'Me';
                      const amt = parseFloat(exp.actualAmount || exp.actual_amount || 0);
                      if (payments[payer] !== undefined) {
                        payments[payer] += amt;
                      } else {
                        payments['Me'] += amt;
                      }
                    });
                    
                    return (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                          {Object.entries(payments).map(([person, paid]) => {
                            const balance = paid - targetShare;
                            const isCreditor = balance >= 0;
                            return (
                              <div key={person} className="p-3.5 rounded-2xl border bg-slate-50/65 flex flex-col justify-between">
                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{person === 'Me' ? 'Me (You)' : person}</p>
                                  <p className="text-sm font-black text-slate-800 mt-1">{tripCurrency.symbol}{paid.toLocaleString()}</p>
                                </div>
                                <span className={`text-[9px] font-black uppercase mt-2.5 px-2.5 py-0.5 rounded-full w-max ${
                                  isCreditor ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {isCreditor ? `Owed: +${tripCurrency.symbol}${balance.toFixed(2)}` : `Owes: -${tripCurrency.symbol}${Math.abs(balance).toFixed(2)}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-[11px] font-semibold space-y-1.5">
                          <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider">Settlement Plan</p>
                          {Object.entries(payments)
                            .filter(([_, paid]) => paid < targetShare)
                            .map(([debtor, paid]) => {
                              const debt = targetShare - paid;
                              const creditor = Object.entries(payments).find(([_, pPaid]) => pPaid > targetShare)?.[0] || 'Me';
                              return (
                                <p key={debtor} className="flex justify-between items-center text-slate-300">
                                  <span>{debtor === 'Me' ? 'You' : debtor} should pay {creditor === 'Me' ? 'You' : creditor}:</span>
                                  <span className="font-bold text-emerald-400">{tripCurrency.symbol}{debt.toFixed(2)}</span>
                                </p>
                              );
                            })}
                          {Object.values(payments).every(p => Math.abs(p - targetShare) < 1) && (
                            <p className="text-emerald-400 font-bold">All traveler shares are perfectly balanced!</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Right side: Add expense form & Expense History */}
            <div className="lg:col-span-4 space-y-8">
              {/* Form panel */}
              {!budgetData.isPrePlanned ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    <Plus className="h-4 w-4 mr-2 text-emerald-500" />
                    {t('add_new_expense')}
                  </h3>

                  {/* Receipt OCR Scanner */}
                  <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition text-center space-y-2 relative">
                    {ocrLoading ? (
                      <div className="flex flex-col items-center justify-center py-2 space-y-1">
                        <div className="h-4.5 w-4.5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                        <span className="text-[10px] text-slate-450 font-bold">Scanning receipt & calculating totals...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Coins className="h-5 w-5 text-emerald-500 animate-pulse" />
                          <span className="text-[10px] text-slate-500 font-bold">Log expense faster by scanning a receipt</span>
                        </div>
                        <input
                          type="file"
                          id="receipt-ocr-uploader"
                          onChange={handleReceiptOcr}
                          className="hidden"
                          accept="image/*"
                        />
                        <label
                          htmlFor="receipt-ocr-uploader"
                          className="mx-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] cursor-pointer transition active:scale-95 block w-max shadow-sm"
                        >
                          Scan Receipt File
                        </label>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('category_label')}</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                      >
                        <option value="Food">{t('category_food_dining')}</option>
                        <option value="Accommodation">{t('category_accommodation')}</option>
                        <option value="Transport">{t('category_transportation')}</option>
                        <option value="Activities">{t('category_activities_tours')}</option>
                        <option value="Shopping">{t('category_shopping')}</option>
                        <option value="Other">{t('category_miscellaneous')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('date_label')}</label>
                      <input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('item_name_label')}</label>
                      <input
                        type="text"
                        value={expenseForm.itemName}
                        onChange={(e) => setExpenseForm({...expenseForm, itemName: e.target.value})}
                        placeholder={t('item_placeholder')}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('planned_cost')}</label>
                        <input
                          type="number"
                          value={expenseForm.plannedAmount}
                          onChange={(e) => setExpenseForm({...expenseForm, plannedAmount: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('actual_spent')}</label>
                        <input
                          type="number"
                          value={expenseForm.actualAmount}
                          onChange={(e) => setExpenseForm({...expenseForm, actualAmount: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('notes_label')}</label>
                      <input
                        type="text"
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                        placeholder={t('notes_placeholder')}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Paid By</label>
                      <select
                        value={expenseForm.paidBy || 'Me'}
                        onChange={(e) => setExpenseForm({...expenseForm, paidBy: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-750 outline-none focus:border-emerald-400 focus:bg-white transition cursor-pointer"
                      >
                        <option value="Me">Me (Current User)</option>
                        {Array.from({ length: Math.max(0, trip.travelers - 1) }).map((_, i) => (
                          <option key={i} value={`Co-Traveler ${String.fromCharCode(65 + i)}`}>
                            Co-Traveler {String.fromCharCode(65 + i)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAddExpense}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm text-center"
                      >
                        {t('save_expense')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-105 rounded-3xl p-6 shadow-sm text-center">
                  <DollarSign className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 mb-2 font-sans">Save Trip to Log Spending</h4>
                  <p className="text-xs text-slate-505 leading-relaxed mb-4 font-sans">
                    To add dynamic expenses, log actual amounts, and manage your travel budget, you'll need to save this pre-planned trip itinerary to your personal account.
                  </p>
                  <button
                    onClick={handleSavePrePlanned}
                    disabled={isSavingTrip}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center space-x-2 font-sans"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingTrip ? 'Saving trip...' : 'Save & Enable Budgeting'}</span>
                  </button>
                </div>
              )}

              {/* Expense history */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                  {t('expense_history')} ({budgetData.expenses?.length || 0})
                </h3>
                {(!budgetData.expenses || budgetData.expenses.length === 0) ? (
                  <p className="text-xs text-slate-400 py-4 text-center">{t('no_expenses_logged')}</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                    {budgetData.expenses.map((exp, idx) => (
                      <div key={exp.id || idx} className="flex items-start justify-between py-3 group/exp">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className="text-xs font-bold text-slate-800 truncate">{exp.item_name || 'Expense'}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase shrink-0">{getCategoryTranslation(exp.category)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {exp.date ? new Date(exp.date).toLocaleDateString() : ''}
                            {exp.notes ? ` • ${exp.notes}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0 ml-4">
                          <span className="text-xs font-extrabold text-rose-600">
                            {tripCurrency.symbol}{Number(exp.actual_amount || 0).toLocaleString(tripCurrency.locale)}
                          </span>
                          {!budgetData.isPrePlanned && (
                            <>
                              <button
                                onClick={() => startEditExpense(exp)}
                                className="opacity-100 md:opacity-0 group-hover/exp:opacity-100 p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                title="Edit Expense"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="opacity-100 md:opacity-0 group-hover/exp:opacity-100 p-1.5 rounded hover:bg-red-50 text-slate-455 hover:text-red-500 transition cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Converter Panel */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <Coins className="h-4.5 w-4.5 mr-2 text-emerald-500" />
                  Live Currency Converter
                </h3>

                <div className="space-y-3.5 font-semibold text-xs text-slate-600">
                  {/* Amount Input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Amount</label>
                    <input
                      type="number"
                      value={convAmount}
                      onChange={(e) => setConvAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                    />
                  </div>

                  {/* Currencies Dropdowns with Swap Button */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">From</label>
                      <select
                        value={fromCurr}
                        onChange={(e) => setFromCurr(e.target.value)}
                        className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition cursor-pointer"
                      >
                        {['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'JPY', 'SGD'].map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleSwapCurrencies}
                      className="mt-5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition text-slate-500 hover:text-emerald-500 cursor-pointer shadow-sm flex items-center justify-center"
                      title="Swap Currencies"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">To</label>
                      <select
                        value={toCurr}
                        onChange={(e) => setToCurr(e.target.value)}
                        className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition cursor-pointer"
                      >
                        {['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'JPY', 'SGD'].map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Output Display */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 text-center space-y-1">
                    <p className="text-[10px] font-bold text-slate-450 uppercase">Converted Value</p>
                    {ratesLoading ? (
                      <div className="flex items-center justify-center space-x-1.5 py-1">
                        <div className="h-3 w-3 border-2 border-emerald-250 border-t-emerald-500 rounded-full animate-spin" />
                        <span className="text-xs text-slate-400 font-semibold">Updating rates...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-extrabold text-emerald-800">
                          {toCurr} {convertedValue}
                        </p>
                        {rates[toCurr] && (
                          <p className="text-[9px] text-slate-400 font-semibold">
                            1 {fromCurr} = {rates[toCurr].toFixed(4)} {toCurr}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-6 relative text-slate-800"
            >
              <div className="flex items-center space-x-3 text-emerald-600 mb-4">
                <Edit className="h-5 w-5" />
                <h3 className="text-base font-extrabold">{t('edit_log_expenses')}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('category_label')}</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                  >
                    <option value="Food">{t('category_food_dining')}</option>
                    <option value="Accommodation">{t('category_accommodation')}</option>
                    <option value="Transport">{t('category_transportation')}</option>
                    <option value="Activities">{t('category_activities_tours')}</option>
                    <option value="Shopping">{t('category_shopping')}</option>
                    <option value="Other">{t('category_miscellaneous')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('date_label')}</label>
                  <input
                    type="date"
                    value={editingExpense.date ? editingExpense.date.split('T')[0] : ''}
                    onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('item_name_label')}</label>
                  <input
                    type="text"
                    value={editingExpense.itemName}
                    onChange={(e) => setEditingExpense({...editingExpense, itemName: e.target.value})}
                    placeholder={t('item_placeholder')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('planned_cost')}</label>
                    <input
                      type="number"
                      value={editingExpense.plannedAmount}
                      onChange={(e) => setEditingExpense({...editingExpense, plannedAmount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('actual_spent')}</label>
                    <input
                      type="number"
                      value={editingExpense.actualAmount}
                      onChange={(e) => setEditingExpense({...editingExpense, actualAmount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">{t('notes_label')}</label>
                  <input
                    type="text"
                    value={editingExpense.notes}
                    onChange={(e) => setEditingExpense({...editingExpense, notes: e.target.value})}
                    placeholder={t('notes_placeholder')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-100 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={() => handleUpdateExpense(editingExpense.id)}
                    className="flex-[2] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm text-center"
                  >
                    {t('save_expense')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[100] flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
                : 'bg-rose-50/95 border-rose-200 text-rose-800'
            }`}
          >
            <span className="text-xs font-bold tracking-wide">{toast.message}</span>
          </motion.div>
        )}
        <Footer />
      </AnimatePresence>
    </div>
  );
}
