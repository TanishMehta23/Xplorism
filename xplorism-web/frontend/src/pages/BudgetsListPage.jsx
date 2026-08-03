import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Calendar, Compass as TripIcon,
  Users, Edit, ArrowRight, AlertCircle, TrendingUp, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import { CURRENCIES } from './DashboardStub';

export default function BudgetsListPage() {
  const navigate = useNavigate();
  const [tripsWithBudgets, setTripsWithBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchTripsAndBudgets = async () => {
    setLoading(true);
    try {
      const tripsData = await api.get('/trips');
      const budgetPromises = tripsData.map(async (trip) => {
        try {
          const bData = await api.get(`/trips/${trip.id}/budget`);
          return { ...trip, budgetData: bData };
        } catch (err) {
          console.error(`Failed to fetch budget for trip ${trip.id}:`, err);
          return { ...trip, budgetData: null };
        }
      });
      const combined = await Promise.all(budgetPromises);
      setTripsWithBudgets(combined);
    } catch (err) {
      console.error(err);
      showToast('Failed to load saved itineraries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndBudgets();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar activeTab="budgets" />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center space-x-2 text-rose-500 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Financial Overview</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">My Saved Budgets</h1>
            <p className="text-slate-500 text-sm">Monitor, track expenses, and manage budgets across all your saved itineraries.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl border bg-white border-slate-200 hover:bg-slate-50 active:scale-95 transition-all select-none self-start md:self-auto cursor-pointer text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Aggregating budget calculations...</p>
          </div>
        ) : tripsWithBudgets.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl text-center flex flex-col items-center justify-center border border-dashed border-slate-200 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 mb-6 border border-slate-100">
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No itineraries budget logged</h2>
            <p className="text-slate-555 max-w-sm text-sm mb-6 leading-relaxed">
              Create and save a custom trip itinerary first to track real-time budgets and log expenses.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              Start Planning
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tripsWithBudgets.map((trip) => {
              const parts = (trip.travelStyle || '').split('|');
              const style = parts[0] || 'Adventure';
              const tripCurrencyCode = parts[1] || 'USD';
              const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;
              
              const totalPlanned = trip.budgetData?.totalPlanned || 0;
              const totalActual = trip.budgetData?.totalActual || 0;
              const utilizationPercent = trip.budgetData?.utilizationPercent || 0;
              const remaining = trip.budgetData?.remaining ?? (trip.budget - totalActual);

              return (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}/budget`)}
                  className="group relative bg-white p-6 rounded-3xl border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all duration-205 flex flex-col justify-between cursor-pointer overflow-hidden shadow-sm"
                >
                  <div>
                    {/* Header meta */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-650 border border-emerald-100">
                        {style}
                      </span>
                      <div className="flex items-center space-x-1 font-bold text-emerald-650 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg text-[10px]">
                        <span>{tripCurrency.symbol} {tripCurrencyCode}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-950 mb-1 group-hover:text-emerald-600 transition truncate">
                      {trip.destination}
                    </h3>

                    <div className="flex items-center space-x-2 text-slate-500 text-[11px] mb-4">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      <span>
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-5 py-3 border-y border-slate-50">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Limit</span>
                        <span className="text-sm font-extrabold text-slate-800">
                          {tripCurrency.symbol}{Number(trip.budget).toLocaleString(tripCurrency.locale)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Spent</span>
                        <span className="text-sm font-extrabold text-rose-600">
                          {tripCurrency.symbol}{Number(totalActual).toLocaleString(tripCurrency.locale)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Utilization</span>
                        <span className={utilizationPercent > 80 ? 'text-rose-600' : 'text-emerald-600'}>
                          {Math.round(utilizationPercent)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${utilizationPercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Expected Allocation */}
                    {trip.budgetData?.categoryBreakdown && trip.budgetData.categoryBreakdown.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-slate-50 space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Allocation Breakdown</span>
                        <div className="flex flex-wrap gap-1.5">
                          {trip.budgetData.categoryBreakdown.map((cat, cIdx) => (
                            <span key={cIdx} className="inline-flex items-center text-[9px] font-semibold bg-slate-50 border border-slate-100 text-slate-650 px-2 py-0.5 rounded-md">
                              {cat.category}: <span className="font-extrabold text-slate-800 ml-1">{tripCurrency.symbol}{Number(cat.planned).toLocaleString(tripCurrency.locale)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Call to action bar */}
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-600 pt-3 border-t border-slate-50 group-hover:text-emerald-700">
                    <span className="flex items-center space-x-1">
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit & Log Expenses</span>
                    </span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
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
