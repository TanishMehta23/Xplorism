import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import TrackerPage from './pages/TrackerPage';
import DocumentVaultPage from './pages/DocumentVaultPage';
import CommunityFeedPage from './pages/CommunityFeedPage';
import NotFoundPage from './pages/NotFoundPage';
import SharedTripPage from './pages/SharedTripPage';
import SharedTripsWorkspace from './pages/SharedTripsWorkspace';
import CollaborativeTripPage from './pages/CollaborativeTripPage';
import TripInviteRespondPage from './pages/TripInviteRespondPage';


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

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <AppRoutes />
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
