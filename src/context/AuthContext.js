// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../config';


const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  // console.log('context', context);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  // Set up axios interceptor for 401 errors
  useEffect(() => {
    // Request interceptor to add token to headers
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken && config.headers) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Skip 401 handling for authentication endpoints (login, register, etc.)
          const authEndpoints = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp'];
          const requestUrl = error.config?.url || '';
          const isAuthEndpoint = authEndpoints.some(endpoint => requestUrl.includes(endpoint));
          
          if (!isAuthEndpoint) {
            // Unauthorized error on protected endpoint - logout user
            console.log('Unauthorized error detected, logging out...');
            
            // Clear storage and state
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              setToken(null);
              setUser(null);
            } catch (err) {
              console.error('Error during logout:', err);
            }
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/login`, { email, password });
      if (response.data && response.data.token) {
        const { token, user } = response.data;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
