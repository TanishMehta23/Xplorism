import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Calendar, Compass as TripIcon } from 'lucide-react';

export default function DashboardStub() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="relative min-h-screen bg-[#040d12] bg-grid-pattern text-slate-100 overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-teal-600/5 blur-[120px]" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-800/40 glass">
        <div className="flex items-center space-x-3 text-2xl font-bold tracking-tight">
          <img 
            src="/logo.png" 
            alt="Xplorism Logo" 
            className="h-13 w-13 object-contain rounded-full shadow-sm" 
          />
          <span className="text-white font-extrabold tracking-tight">
            Xplorism
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-300 text-sm font-medium">Hello, {user?.name || 'Traveler'}!</span>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-full hover:bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-white transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">My Trips Dashboard</h1>
            <p className="text-slate-400 text-sm">Create and manage your customized itineraries.</p>
          </div>
          <button
            onClick={() => alert("Trip creation form will be available in Phase 2!")}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-semibold text-sm transition-all duration-300 shadow-lg shadow-teal-500/20 flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Trip</span>
          </button>
        </div>

        {/* Empty State Grid */}
        <div className="glass p-12 rounded-3xl text-center flex flex-col items-center justify-center border border-dashed border-slate-850">
          <div className="h-16 w-16 rounded-2xl bg-teal-50/10 flex items-center justify-center text-teal-600 mb-6">
            <TripIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">No trips created yet</h2>
          <p className="text-slate-400 max-w-md text-sm mb-6">
            Get started by planning your first custom itinerary.
          </p>
          <button
            onClick={() => alert("Trip creation form will be available in Phase 2!")}
            className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-805/60 text-sm font-semibold transition"
          >
            Start Planning
          </button>
        </div>
      </main>
    </div>
  );
}
