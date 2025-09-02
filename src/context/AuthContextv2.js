// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../config';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
        ]);
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${BASE_URL}/login`, { email, password });
      if (data?.token && data?.user) {
        await Promise.all([
          AsyncStorage.setItem('token', data.token),
          AsyncStorage.setItem('user', JSON.stringify(data.user)),
        ]);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error?.response?.data || error?.message);
      return { success: false, error: error?.response?.data?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user'),
      ]);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const value = { user, token, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
