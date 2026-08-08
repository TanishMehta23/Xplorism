import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader, Compass, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TripInviteRespondPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const tripId = searchParams.get('tripId');
  const status = searchParams.get('status'); // 'approved' or 'declined'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const handleResponse = async () => {
      if (!tripId || !status) {
        setError('Missing trip identifier or response status in invitation link.');
        setLoading(false);
        return;
      }

      if (!['approved', 'declined'].includes(status)) {
        setError('Invalid response status. Link may be corrupted.');
        setLoading(false);
        return;
      }

      if (!isAuthenticated) {
        // Not authenticated, wait for user action
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.post(`/trips/${tripId}/collaborators/respond`, { status });
        setSuccessMsg(res.message || `Invitation successfully ${status}!`);
        setLoading(false);

        // Redirect after a brief delay
        setTimeout(() => {
          if (status === 'approved') {
            navigate(`/trips/${tripId}/collaborate`);
          } else {
            navigate('/dashboard');
          }
        }, 3000);
      } catch (err) {
        console.error('Error responding to invitation:', err);
        setError(err.response?.data?.message || err.message || 'Failed to process invitation response.');
        setLoading(false);
      }
    };

    handleResponse();
  }, [tripId, status, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-20 relative overflow-hidden">
        {/* Dynamic decorative backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl relative z-10 text-center"
        >
          {loading ? (
            <div className="py-8 space-y-4">
              <Loader className="h-12 w-12 text-rose-500 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-slate-800">Processing Invitation</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Communicating with the Xplorism flight deck to update your co-traveler workspace status...
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-6">
              <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Compass className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Authentication Required</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                To accept or decline this collaborative trip invitation, please log into your Xplorism account.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold transition text-sm shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                Log In to Xplorism
              </button>
            </div>
          ) : error ? (
            <div className="space-y-6">
              <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Invitation Error</h2>
              <p className="text-rose-500 text-sm font-bold bg-rose-50/50 border border-rose-100 p-3 rounded-2xl">
                {error}
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                The link might be expired or you may not be authorized to view this invitation. Check with the trip host.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-655 text-xs font-bold transition cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                {status === 'approved' ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {status === 'approved' ? 'Invitation Approved!' : 'Invitation Declined'}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {successMsg}
              </p>
              <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs font-semibold animate-pulse">
                <Sparkles className="h-4.5 w-4.5 text-rose-500" />
                <span>Redirecting you shortly...</span>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
