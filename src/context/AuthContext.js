import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axiosConfig.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set axios default header whenever user state changes
  useEffect(() => {
    if (user && user.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  const loginHelper = async (username, password) => {
    if (!username || !password) {
      throw new Error('Please enter both username and password');
    }
    
    try {
      const { data } = await axios.post('/auth/login', { username, password });
      
      if (data && data.token) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
        return data;
      } else {
        throw new Error('Login response missing authentication token');
      }
    } catch (error) {
      throw error;
    }
  };

  const logoutHelper = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const { data } = await axios.get('/auth/me');
      const updatedUser = { ...user, ...data };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const hasAccess = (moduleName) => {
    if (!user) return false;
    if (user.role && user.role.toLowerCase() === 'admin') return true;
    return user.modules && user.modules.includes(moduleName);
  };

  const isAdmin = user && user.role && user.role.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        employee: user,
        modules: user?.modules || [],
        isAdmin,
        isFirstLogin: user?.isFirstLogin,
        login: loginHelper,
        logout: logoutHelper,
        refreshUser,
        hasAccess,
      }}
    >
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

export default AuthContext;
