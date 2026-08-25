import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardStub from './pages/DashboardStub';
import WeatherPage from './pages/WeatherPage';
import BudgetPage from './pages/BudgetPage';
import BudgetsListPage from './pages/BudgetsListPage';
import HotelBookingPage from './pages/HotelBookingPage';
import ProfilePage from './pages/ProfilePage';
import TravelPreferencesPage from './pages/TravelPreferencesPage';
import TrackerPage from './pages/TrackerPage';
import DocumentVaultPage from './pages/DocumentVaultPage';
import CommunityFeedPage from './pages/CommunityFeedPage';
import NotFoundPage from './pages/NotFoundPage';
import SharedTripPage from './pages/SharedTripPage';
import SharedTripsWorkspace from './pages/SharedTripsWorkspace';
import CollaborativeTripPage from './pages/CollaborativeTripPage';
import TripInviteRespondPage from './pages/TripInviteRespondPage';
import MockPaymentPage from './pages/MockPaymentPage';
import AIChatbot from './components/AIChatbot';


import { CurrencyProvider } from './contexts/CurrencyContext';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Route that redirects logged-in users away from auth pages
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  const { loading } = useAuth();

  useEffect(() => {
    const checkModals = () => {
      // Find any modal overlay elements active in the DOM (full-screen overlays use fixed inset-0)
      const modalActive = document.querySelector('.fixed.inset-0');
      if (modalActive) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    checkModals();
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm animate-pulse font-medium">Loading adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthRoute>
            <LandingPage />
          </AuthRoute>
        }
      />

      <Route
        path="/login"
        element={
          <AuthRoute>
            <Navigate to="/" state={{ openAuth: true, mode: 'login' }} replace />
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <Navigate to="/" state={{ openAuth: true, mode: 'register' }} replace />
          </AuthRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardStub />
          </ProtectedRoute>
        }
      />

      <Route
        path="/weather"
        element={
          <ProtectedRoute>
            <WeatherPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            <TrackerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hotels"
        element={
          <ProtectedRoute>
            <HotelBookingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mock-payment"
        element={
          <ProtectedRoute>
            <MockPaymentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips/:id/budget"
        element={
          <ProtectedRoute>
            <BudgetPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <BudgetsListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/preferences"
        element={
          <ProtectedRoute>
            <TravelPreferencesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vault"
        element={
          <ProtectedRoute>
            <DocumentVaultPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <CommunityFeedPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shared-trips"
        element={
          <ProtectedRoute>
            <SharedTripsWorkspace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips/:id/collaborate"
        element={
          <ProtectedRoute>
            <CollaborativeTripPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shared-trip/:id"
        element={<SharedTripPage />}
      />

      <Route
        path="/trip-invite/respond"
        element={<TripInviteRespondPage />}
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// ScrollToTop resets scroll position to the top of the window on navigation path changes
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable native browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Smooth scroll offset recovery
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <Router>
              <ScrollToTop />
              <AppRoutes />
              <AIChatbot />
            </Router>
          </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
