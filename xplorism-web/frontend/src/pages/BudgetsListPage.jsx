import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Calendar, Compass as TripIcon,
  Users, Edit, ArrowRight, AlertCircle, TrendingUp, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CURRENCIES } from './DashboardStub';
import { useLanguage } from '../context/LanguageContext';

const getTripImage = (destination) => {
  const dest = (destination || '').toLowerCase();
  if (dest.includes('vancouver')) {
    return 'https://images.unsplash.com/photo-1559511260-66a654ae982a?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('tokyo') || dest.includes('japan')) {
    return 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('paris') || dest.includes('france')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('new york') || dest.includes('york') || dest.includes('usa')) {
    return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('london') || dest.includes('uk') || dest.includes('united kingdom')) {
    return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('sydney') || dest.includes('australia')) {
    return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('rome') || dest.includes('italy') || dest.includes('venice')) {
    return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('singapore')) {
    return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('zurich') || dest.includes('swiss') || dest.includes('switzerland') || dest.includes('geneva')) {
    return 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('barcelona') || dest.includes('spain')) {
    return 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('amsterdam') || dest.includes('netherlands')) {
    return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('delhi') || dest.includes('india')) {
    return 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('rishikesh')) {
    return 'https://images.unsplash.com/photo-1566418879480-1a134a413d33?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('germany') || dest.includes('frankfurt')) {
    return 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('ayodhya')) {
    return 'https://images.unsplash.com/photo-1600664901390-3413f6df1600?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('jodhpur') || dest.includes('jaisalmer') || dest.includes('rajasthan')) {
    return 'https://images.unsplash.com/photo-1602643163983-ed0babc39797?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('manali') || dest.includes('himachal') || dest.includes('spiti') || dest.includes('lahaul')) {
    return 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('ladakh') || dest.includes('kashmir') || dest.includes('leh')) {
    return 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('dharamshala')) {
    return 'https://images.unsplash.com/photo-1626621341515-bbf8a53a914c?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('agra')) {
    return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80';
  }

  // Use a beautiful Unsplash travel scene as fallback instead of random Picsum stock photos
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
};

export default function BudgetsListPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      showToast(t('toast_load_itineraries_fail'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndBudgets();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar activeTab="budgets" />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center space-x-2 text-rose-500 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">{t('financial_overview')}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>{t('my_saved_budgets')}</h1>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('budgets_desc')}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-10 w-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('aggregating_budgets')}</p>
          </div>
        ) : tripsWithBudgets.length === 0 ? (
          <div className="p-16 rounded-3xl text-center flex flex-col items-center justify-center border border-dashed shadow-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6 border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('no_budgets')}</h2>
            <p className="max-w-sm text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t('no_budgets_desc')}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              {t('start_planning')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  className="group relative rounded-3xl border transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:border-rose-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                >
                  {/* Trip Cover Image (Flush Top) */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={getTripImage(trip.destination)}
                      alt={trip.destination}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    
                    {/* Style Badge floating on top-left of image */}
                    <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-rose-650 backdrop-blur-sm border border-white/20 shadow-sm">
                      {t('style_' + style.toLowerCase()) || style}
                    </span>
                    
                    {/* Currency floating on top-right of image */}
                    <div className="absolute top-4 right-4 flex items-center space-x-1 font-bold text-white bg-black/40 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-lg text-[10px]">
                      <span>{tripCurrency.symbol} {tripCurrencyCode}</span>
                    </div>
                  </div>

                  {/* Content Container (Padded) */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold mb-1 group-hover:text-rose-500 transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                        {trip.destination}
                      </h3>

                      <div className="flex items-center space-x-2 text-[11px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
                        <Calendar className="h-3.5 w-3.5 text-rose-500" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Stats metrics */}
                      <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y" style={{ borderColor: 'var(--border-secondary)' }}>
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>{t('budget_limit')}</span>
                          <span className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
                            {tripCurrency.symbol}{Number(trip.budget).toLocaleString(tripCurrency.locale)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>{t('budget_spent')}</span>
                          <span className="text-sm font-extrabold text-rose-500">
                            {tripCurrency.symbol}{Number(totalActual).toLocaleString(tripCurrency.locale)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                          <span>{t('budget_utilization')}</span>
                          <span className={utilizationPercent > 80 ? 'text-rose-500' : 'text-emerald-500'}>
                            {Math.round(utilizationPercent)}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${utilizationPercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Expected Allocation */}
                      {trip.budgetData?.categoryBreakdown && trip.budgetData.categoryBreakdown.length > 0 && (
                        <div className="mb-4 pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--border-secondary)' }}>
                          <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>{t('allocation_breakdown')}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {trip.budgetData.categoryBreakdown.map((cat, cIdx) => (
                              <span key={cIdx} className="inline-flex items-center text-[9px] font-bold border px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                                {t('category_' + cat.category.toLowerCase().replace(/[^a-z0-9]+/g, '_')) || cat.category}: <span className="font-extrabold ml-1" style={{ color: 'var(--text-primary)' }}>{tripCurrency.symbol}{Number(cat.planned).toLocaleString(tripCurrency.locale)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Call to action bar */}
                    <div className="flex items-center justify-between text-xs font-extrabold pt-3 border-t group-hover:text-rose-500 transition-colors" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }}>
                      <span className="flex items-center space-x-1.5">
                        <Edit className="h-3.5 w-3.5 text-rose-500" />
                        <span>{t('edit_log_expenses')}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
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
      <Footer />
    </div>
  );
}
