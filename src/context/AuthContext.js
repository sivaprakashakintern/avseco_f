import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
        // Set header IMMEDIATELY to avoid race conditions with initial fetches
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
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
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = useCallback(async () => {
    try {
      // Ensure header is set if we have a token (safety check)
      if (user?.token && !axios.defaults.headers.common['Authorization']) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      }
      
      const { data } = await axios.get('/auth/me');
      const updatedUser = { ...user, ...data };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      // If we get a 401 here, the token might be expired
      if (error.response?.status === 401) {
        logoutHelper();
      }
    }
  }, [user]);

  const isSuperAdmin = user && user.name && user.name === 'Nithish Kumar';
  
  const userRole = user?.role?.toLowerCase() || '';
  const userDept = user?.department?.toLowerCase() || '';

  const isAdminUser = userRole === 'admin' || userRole === 'ceo' || userRole === 'hr';
  const isAdmin = isSuperAdmin || isAdminUser;

  const isCEOViewOnly = Boolean(
    isAdminUser && (user?.viewOnly || userRole === 'ceo' || userRole === 'hr' || userDept === 'ceo' || userDept === 'hr')
  );

  const canEdit = isSuperAdmin ? true : !isCEOViewOnly;

  const hasAccess = useCallback((moduleName) => {
    if (!user) return false;
    // Super admin has access to everything
    if (isSuperAdmin) return true;

    const role = user?.role?.toLowerCase() || '';
    const dept = user?.department?.toLowerCase() || '';
    const isLocalAdminUser = role === 'admin' || role === 'ceo' || role === 'hr';
    const isLocalCEOViewOnly = Boolean(
      isLocalAdminUser && (user?.viewOnly || role === 'ceo' || role === 'hr' || dept === 'ceo' || dept === 'hr')
    );

    if (isLocalCEOViewOnly && ['notifications'].includes(moduleName)) return false;
    // Every user should have access to the dashboard home page
    if (moduleName === 'dashboard') return true;
    if (isLocalAdminUser) return true;
    return user.modules && user.modules.includes(moduleName);
  }, [user, isSuperAdmin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        employee: user,
        modules: user?.modules || [],
        isAdmin,
        isSuperAdmin,
        isCEOViewOnly,
        canEdit,
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
