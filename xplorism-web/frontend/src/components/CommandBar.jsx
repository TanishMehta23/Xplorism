import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Compass, Radio, Users, CloudSun, DollarSign,
  FolderLock, User, Sparkles, Sun, Moon, CornerDownLeft,
  X, Plus, Globe
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Navigation commands & quick actions
  const items = [
    // Section: Navigation
    { id: 'trips', title: 'Trips & Itinerary Studio', category: 'Navigation', icon: Compass, action: () => navigate('/dashboard'), badge: 'G T' },
    { id: 'tracker', title: 'Live Aviation Radar & Airspace', category: 'Navigation', icon: Radio, action: () => navigate('/tracker'), badge: 'G R' },
    { id: 'shared', title: 'Collaborative Trip Workspaces', category: 'Navigation', icon: Users, action: () => navigate('/shared-trips'), badge: 'G C' },
    { id: 'weather', title: 'Weather Radar & 3-Day Forecasts', category: 'Navigation', icon: CloudSun, action: () => navigate('/weather'), badge: 'G W' },
    { id: 'budgets', title: 'Multi-Currency Budget Manager', category: 'Navigation', icon: DollarSign, action: () => navigate('/budgets'), badge: 'G B' },
    { id: 'vault', title: 'Encrypted Document Vault', category: 'Navigation', icon: FolderLock, action: () => navigate('/vault'), badge: 'G V' },
    { id: 'community', title: 'Explorers Social Community', category: 'Navigation', icon: Globe, action: () => navigate('/community'), badge: 'G S' },
    { id: 'profile', title: 'User Profile & Travel Preferences', category: 'Navigation', icon: User, action: () => navigate('/profile'), badge: 'G P' },

    // Section: Quick Actions
    { id: 'new-trip', title: 'Plan New Trip Itinerary', category: 'Quick Actions', icon: Plus, action: () => window.dispatchEvent(new Event('open-trip-wizard')), badge: 'Create' },
    { id: 'concierge', title: 'Open Trip Concierge', category: 'Quick Actions', icon: Sparkles, action: () => window.dispatchEvent(new Event('open-xplorism-ai')), badge: 'Ask' },
    { id: 'toggle-theme', title: `Switch to ${isDark ? 'Light' : 'Dark'} Mode`, category: 'Preferences', icon: isDark ? Sun : Moon, action: () => toggleTheme(), badge: 'Theme' },
  ];

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Global keydown listeners for Cmd+K / Ctrl+K and /
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Slash key when not typing inside input/textarea
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-bar', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-bar', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation within list
  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col cursor-default transition-all duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white shadow-black/80' : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
        }`}
      >
        {/* Search Input Bar */}
        <div className={`flex items-center px-4 py-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <Search className="h-4 w-4 text-rose-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command, page, or action..."
            className="w-full bg-transparent text-sm sm:text-base outline-none font-medium placeholder-slate-400 leading-normal"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 mr-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[340px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No matching commands or pages found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => { item.action(); setIsOpen(false); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition cursor-pointer border-none text-xs sm:text-sm font-semibold ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-sm'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800/60'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isSelected
                        ? 'border-white/30 text-white/90 bg-white/10'
                        : isDark
                        ? 'border-slate-800 text-slate-400 bg-slate-800/50'
                        : 'border-slate-200 text-slate-500 bg-slate-50'
                    }`}>
                      {item.badge}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-white/80" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className={`px-4 py-2 border-t flex items-center justify-between text-[10px] font-medium text-slate-400 ${
          isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3">
            <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono">↵</kbd> Select</span>
            <span><kbd className="font-mono">esc</kbd> Dismiss</span>
          </div>
          <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold">Xplorism Engine</span>
        </div>
      </div>
    </div>
  );
}

