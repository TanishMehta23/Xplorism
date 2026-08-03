import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Compass, Sun, Moon, DollarSign, Hotel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeTab }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.profile-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'T';

  return (
    <>
      <nav className="relative z-30 w-full" style={{ backgroundColor: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}>
      <style>{`
        .nav-link {
          position: relative;
          transition: color 0.2s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 100%;
          transform: scaleX(0);
          height: 2px;
          bottom: -2px;
          left: 0;
          background-color: #f43f5e; /* rose-500 */
          transform-origin: bottom left;
          transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1); /* slow and smooth */
        }
        .nav-button:hover .nav-link::after {
          transform: scaleX(1);
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Left Section: Logo */}
        <div 
          className="flex items-center space-x-3 text-2xl font-bold tracking-tight cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <img 
            src="/logo.png" 
            alt="Xplorism Logo" 
            className="h-12 w-12 object-contain rounded-full shadow-sm" 
          />
          <span style={{ color: 'var(--text-primary)' }} className="font-extrabold tracking-tight">
            Xplorism
          </span>
        </div>
        
        {/* Right Section: Nav Links + Profile Avatar Dropdown */}
        <div className="flex items-center space-x-6">
          {/* Desktop Nav Links aligned to the right */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
            <button 
              onClick={() => navigate('/dashboard')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'trips' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Compass className="h-4 w-4" />
              <span className="nav-link">Trips</span>
            </button>
            <button 
              onClick={() => navigate('/weather')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'weather' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Sun className="h-4 w-4" />
              <span className="nav-link">Weather</span>
            </button>
            <button 
              onClick={() => navigate('/hotels')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'hotels' ? 'text-rose-500 font-bold' : ''}`}
            >
              <Hotel className="h-4 w-4" />
              <span className="nav-link">Hotels</span>
            </button>
            <button 
              onClick={() => navigate('/budgets')}
              className={`nav-button hover:text-rose-500 transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'budgets' ? 'text-rose-500 font-bold' : ''}`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="nav-link">Budgets</span>
            </button>
          </div>

          {/* Mobile Nav Links */}
          <div className="flex md:hidden items-center space-x-3 text-xs font-bold mr-2" style={{ color: 'var(--text-secondary)' }}>
            <button 
              onClick={() => navigate('/dashboard')} 
              className={`hover:text-rose-500 transition cursor-pointer ${activeTab === 'trips' ? 'text-rose-500' : ''}`}
            >
              Trips
            </button>
            <button 
              onClick={() => navigate('/weather')} 
              className={`hover:text-rose-500 transition cursor-pointer ${activeTab === 'weather' ? 'text-rose-500' : ''}`}
            >
              Weather
            </button>
            <button 
              onClick={() => navigate('/hotels')} 
              className={`hover:text-rose-500 transition cursor-pointer ${activeTab === 'hotels' ? 'text-rose-500' : ''}`}
            >
              Hotels
            </button>
            <button 
              onClick={() => navigate('/budgets')} 
              className={`hover:text-rose-500 transition cursor-pointer ${activeTab === 'budgets' ? 'text-rose-500' : ''}`}
            >
              Budgets
            </button>
          </div>

          {/* Profile Dropdown Container */}
          <div className="relative profile-container">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 rounded-full font-extrabold flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer select-none text-sm tracking-wide border"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
            >
              {userInitial}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-2xl shadow-xl py-2 z-50 border"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                  <p className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Logged in as</p>
                  <p className="text-xs font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Traveler'}</p>
                </div>
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center space-x-2 cursor-pointer border-b"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(217,119,6,0.12)' : '#fffbeb'; e.currentTarget.style.color = '#d97706'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  )}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.12)'; e.currentTarget.style.color = '#fb7185'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
          <div className="rounded-3xl border p-6 max-w-sm w-full shadow-xl relative" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <LogOut className="h-5 w-5" />
              <h3 className="text-lg font-bold font-sans" style={{ color: 'var(--text-primary)' }}>Log Out</h3>
            </div>
            <p className="text-sm mb-6 leading-relaxed font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to log out of your session?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 font-sans"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 font-sans"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
