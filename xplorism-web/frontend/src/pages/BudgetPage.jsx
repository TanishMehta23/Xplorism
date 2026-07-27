import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, Calendar, Compass as TripIcon,
  Trash2, Users, Tag, Edit, Clock, ArrowLeft, AlertCircle, Save
} from 'lucide-react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import { CURRENCIES, PRE_PLANNED_TRIPS } from './DashboardStub';

export default function BudgetPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [budgetLoading, setBudgetLoading] = useState(true);

  // Form State
  const [expenseForm, setExpenseForm] = useState({ category: 'Food', itemName: '', plannedAmount: '', actualAmount: '', date: '', notes: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
          showToast('Trip not found', 'error');
        }
        setLoading(false);
      } else {
        try {
          const trips = await api.get('/trips');
          const foundTrip = trips.find(t => t.id === id);
          if (foundTrip) {
            setTrip(foundTrip);
          } else {
            showToast('Trip not found', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to load trip details.', 'error');
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
      showToast('Pre-planned itinerary saved to your trips!', 'success');
      setTimeout(() => {
        navigate(`/trips/${response.id}/budget`);
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast('Failed to save trip.', 'error');
    } finally {
      setIsSavingTrip(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.actualAmount || !expenseForm.date) {
      showToast('Please fill in amount and date.', 'error');
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
      });
      showToast('Expense added successfully!', 'success');
      setExpenseForm({ category: 'Food', itemName: '', plannedAmount: '', actualAmount: '', date: '', notes: '' });
      setShowExpenseForm(false);
      fetchBudget();
    } catch (err) {
      console.error('Failed to add expense:', err);
      showToast('Failed to add expense.', 'error');
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
      });
      showToast('Expense updated successfully!', 'success');
      setEditingExpense(null);
      setShowExpenseForm(false);
      fetchBudget();
    } catch (err) {
      console.error('Failed to update expense:', err);
      showToast('Failed to update expense.', 'error');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/trips/${id}/expenses/${expenseId}`);
      showToast('Expense deleted.', 'success');
      fetchBudget();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showToast('Failed to delete expense.', 'error');
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
    });
    setShowExpenseForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm animate-pulse font-medium">Loading budget overview...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Trip Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 text-center max-w-md">We couldn't locate the trip you are looking for. It may have been deleted or the link is invalid.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-850 transition">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const parts = (trip.travelStyle || '').split('|');
  const style = parts[0] || 'Adventure';
  const tripCurrencyCode = parts[1] || 'INR';
  const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar activeTab="trips" />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {/* Back navigation & header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-650 hover:text-slate-900 transition-all cursor-pointer border border-slate-200 bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-rose-500 mb-1">
              <TripIcon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{style} Mode</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              {trip.destination} Budget Tracker
            </h1>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date Schedule</p>
              <p className="text-sm font-bold text-slate-800">
                {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Users className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Travelers</p>
              <p className="text-sm font-bold text-slate-800">{trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starting Budget</p>
              <p className="text-sm font-bold text-slate-800">
                {tripCurrency.symbol}{Number(trip.budget).toLocaleString(tripCurrency.locale)}
              </p>
            </div>
          </div>
        </div>

        {budgetLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Calculating planned breakdowns...</p>
          </div>
        ) : !budgetData ? (
          <div className="bg-white border border-slate-150 rounded-3xl p-12 text-center shadow-sm">
            <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">No budget data available</h2>
            <p className="text-slate-550 text-sm mb-6 max-w-sm mx-auto">We couldn't compute budget trackers for this itinerary.</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition">
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side: Overview, breakdowns */}
            <div className="lg:col-span-8 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Budget</span>
                  <p className="text-2xl font-extrabold text-emerald-800 mt-2">
                    {tripCurrency.symbol}{Number(budgetData.totalBudget).toLocaleString(tripCurrency.locale)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Planned: {tripCurrency.symbol}{Number(budgetData.totalPlanned).toLocaleString(tripCurrency.locale)}</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Spent</span>
                  <p className="text-2xl font-extrabold text-rose-800 mt-2">
                    {tripCurrency.symbol}{Number(budgetData.totalActual || budgetData.totalSpent || 0).toLocaleString(tripCurrency.locale)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Real-time tracked expenses</p>
                </div>
                <div className={`${(budgetData.remaining || budgetData.remaining === 0) && budgetData.remaining >= 0 ? 'bg-sky-50 border-sky-100' : 'bg-rose-50 border-rose-100'} border rounded-3xl p-5 shadow-sm`}>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remaining</span>
                  <p className={`text-2xl font-extrabold mt-2 ${(budgetData.remaining || budgetData.remaining === 0) && budgetData.remaining >= 0 ? 'text-sky-800' : 'text-rose-800'}`}>
                    {tripCurrency.symbol}{Number(budgetData.remaining || 0).toLocaleString(tripCurrency.locale)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Leftover funds</p>
                </div>
              </div>

              {/* Progress Utilization */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Budget Utilization Progress</h3>
                    <p className="text-xs text-slate-500">Shows current spend relative to total budget limit</p>
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
                      <h4 className="text-sm font-bold text-emerald-800">Unsaved Pre-planned Itinerary</h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        We are currently showing calculated budget estimates based on the pre-planned day itineraries. Save this trip to log actual expenses and tracking details.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSavePrePlanned}
                    disabled={isSavingTrip}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition shrink-0 shadow-sm flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingTrip ? 'Saving...' : 'Save to My Trips'}</span>
                  </button>
                </div>
              )}

              {/* Category breakdown */}
              {budgetData.categoryBreakdown && budgetData.categoryBreakdown.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-emerald-500" />
                    Category Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {budgetData.categoryBreakdown.map((cat, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-800">{cat.category}</span>
                          <div className="flex items-center space-x-2 mt-1.5">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cat.actual > cat.planned ? 'bg-rose-450' : 'bg-emerald-405'}`}
                                style={{ width: `${cat.planned > 0 ? Math.min((cat.actual / cat.planned) * 100, 100) : cat.actual > 0 ? 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400 w-12 text-right">
                              {cat.count} item{cat.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs font-bold text-slate-900">{tripCurrency.symbol}{Number(cat.actual).toLocaleString(tripCurrency.locale)}</p>
                          <p className="text-[9px] text-slate-400">of {tripCurrency.symbol}{Number(cat.planned).toLocaleString(tripCurrency.locale)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily breakdown */}
              {budgetData.dailyBreakdown && budgetData.dailyBreakdown.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                    Daily Budget Tracking
                  </h3>
                  <div className="space-y-4">
                    {budgetData.dailyBreakdown.map((day, idx) => (
                      <div key={idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-800">Day {day.day || 'N/A'}</span>
                          <span className="text-xs font-bold text-slate-700">
                            Spent: {tripCurrency.symbol}{Number(day.actual).toLocaleString(tripCurrency.locale)} / Limit: {tripCurrency.symbol}{Number(day.planned).toLocaleString(tripCurrency.locale)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div className={`h-full rounded-full ${day.actual > day.planned ? 'bg-rose-400' : 'bg-emerald-400'}`}
                            style={{ width: `${day.planned > 0 ? Math.min((day.actual / day.planned) * 100, 100) : day.actual > 0 ? 100 : 0}%` }} />
                        </div>
                        <div className="pl-4 border-l-2 border-slate-200 space-y-1.5 mt-2">
                          {day.items.map((it, iIdx) => (
                            <div key={iIdx} className="flex justify-between items-center text-[10px] text-slate-500">
                              <span>{it.name} <span className="text-slate-400">({it.type === 'itinerary' ? 'Planned Activity' : 'Expense'})</span></span>
                              <span className="font-semibold">{tripCurrency.symbol}{Number(it.actual || it.planned || 0).toLocaleString(tripCurrency.locale)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    Log New Expense
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Category</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                      >
                        <option>Food</option>
                        <option>Accommodation</option>
                        <option>Transport</option>
                        <option>Activities</option>
                        <option>Shopping</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Date</label>
                      <input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Item Name</label>
                      <input
                        type="text"
                        value={expenseForm.itemName}
                        onChange={(e) => setExpenseForm({...expenseForm, itemName: e.target.value})}
                        placeholder="e.g. Dinner at Bistro"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Planned Amount</label>
                        <input
                          type="number"
                          value={expenseForm.plannedAmount}
                          onChange={(e) => setExpenseForm({...expenseForm, plannedAmount: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Actual Spent *</label>
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Notes (optional)</label>
                      <input
                        type="text"
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                        placeholder="Any additional details"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAddExpense}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm text-center"
                      >
                        Save Expense
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-105 rounded-3xl p-6 shadow-sm text-center">
                  <DollarSign className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Save Trip to Log Spending</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    To add dynamic expenses, log actual amounts, and manage your travel budget, you'll need to save this pre-planned trip itinerary to your personal account.
                  </p>
                  <button
                    onClick={handleSavePrePlanned}
                    disabled={isSavingTrip}
                    className="w-full py-3 bg-emerald-650 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center space-x-2"
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
                  Expense History ({budgetData.expenses?.length || 0})
                </h3>
                {(!budgetData.expenses || budgetData.expenses.length === 0) ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No actual expenses logged yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                    {budgetData.expenses.map((exp, idx) => (
                      <div key={exp.id || idx} className="flex items-start justify-between py-3 group/exp">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className="text-xs font-bold text-slate-800 truncate">{exp.item_name || 'Expense'}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase shrink-0">{exp.category}</span>
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
                                className="opacity-0 group-hover/exp:opacity-100 p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                title="Edit Expense"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="opacity-0 group-hover/exp:opacity-100 p-1.5 rounded hover:bg-red-50 text-slate-450 hover:text-red-500 transition cursor-pointer"
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
                <h3 className="text-base font-extrabold">Edit Expense Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Category</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                  >
                    <option>Food</option>
                    <option>Accommodation</option>
                    <option>Transport</option>
                    <option>Activities</option>
                    <option>Shopping</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Date</label>
                  <input
                    type="date"
                    value={editingExpense.date ? editingExpense.date.split('T')[0] : ''}
                    onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Item Name</label>
                  <input
                    type="text"
                    value={editingExpense.itemName}
                    onChange={(e) => setEditingExpense({...editingExpense, itemName: e.target.value})}
                    placeholder="e.g. Dinner at Bistro"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Planned Amount</label>
                    <input
                      type="number"
                      value={editingExpense.plannedAmount}
                      onChange={(e) => setEditingExpense({...editingExpense, plannedAmount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Actual Spent *</label>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Notes (optional)</label>
                  <input
                    type="text"
                    value={editingExpense.notes}
                    onChange={(e) => setEditingExpense({...editingExpense, notes: e.target.value})}
                    placeholder="Any additional details"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateExpense(editingExpense.id)}
                    className="flex-[2] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm text-center"
                  >
                    Update Expense
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
      </AnimatePresence>
    </div>
  );
}
