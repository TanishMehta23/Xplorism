import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check token from localStorage on load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Asynchronously fetch fresh profile from server so profilePhoto is always up to date
          try {
            const data = await api.get('/auth/profile');
            if (data && data.user) {
              const fullUser = {
                ...parsedUser,
                ...data.user,
                profilePhoto: data.user.profile_photo || data.user.profilePhoto
              };
              setUser(fullUser);
              saveUserToStorage(fullUser);
            }
          } catch (fetchErr) {
            console.warn("Could not refresh user profile on init", fetchErr);
          }
        } catch (e) {
          console.error("Failed to parse stored user", e);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  // Helper to save user to storage without large profile photo base64 data to avoid QuotaExceededError
  const saveUserToStorage = (userObj) => {
    if (!userObj) return;
    const storageUser = { ...userObj };
    // Only remove if it exceeds 100KB to prevent QuotaExceededError while allowing compressed photos
    if (storageUser.profilePhoto && storageUser.profilePhoto.length > 100000) {
      delete storageUser.profilePhoto;
    }
    if (storageUser.profile_photo && storageUser.profile_photo.length > 100000) {
      delete storageUser.profile_photo;
    }
    localStorage.setItem('user', JSON.stringify(storageUser));
  };

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data && data.requiresOtp) {
        return data; // returns { requiresOtp: true, email }
      }
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response from server. Check if VITE_API_URL is configured.');
      }
      
      localStorage.setItem('token', data.token);
      saveUserToStorage(data.user);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await api.post('/auth/register', { name, email, password });
      if (data && data.requiresOtp) {
        return data; // returns { requiresOtp: true, email }
      }
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response from server. Check if VITE_API_URL is configured.');
      }
      
      localStorage.setItem('token', data.token);
      saveUserToStorage(data.user);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const data = await api.post('/auth/verify-otp', { email, otp });
      if (data && data.token && data.user) {
        localStorage.setItem('token', data.token);
        saveUserToStorage(data.user);
        setUser(data.user);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const data = await api.post('/auth/google', { credential });
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response from server. Check if VITE_API_URL is configured.');
      }
      
      localStorage.setItem('token', data.token);
      saveUserToStorage(data.user);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const newUser = { ...currentUser, ...updatedUser };
    saveUserToStorage(newUser);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, loginWithGoogle, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
