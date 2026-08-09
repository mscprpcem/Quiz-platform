import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultAdmin = {
    id: 'admin-dev',
    name: 'Admin User',
    email: 'admin@microsoftclub.edu',
    role: 'ADMIN'
  };

  const verifyToken = async () => {
    const token = localStorage.getItem('msc_quiz_token');
    if (!token) {
      setUser(defaultAdmin);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/auth/verify');
      setUser(response.data.user || defaultAdmin);
    } catch (error) {
      console.warn('Token validation fallback to default admin:', error.message);
      setUser(defaultAdmin);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('msc_quiz_token', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('msc_quiz_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
