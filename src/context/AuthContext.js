import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axiosConfig.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  const loginHelper = async (email, password) => {
    if (!email || !password) {
      throw new Error('Please enter both email and password');
    }
    
    try {
      const { data } = await axios.post('/auth/login', { email, password });
      
      if (data && data.token) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
        return data;
      } else {
        throw new Error('Login response missing authentication token');
      }
    } catch (error) {
      // Re-throw to be caught by the component
      throw error;
    }
  };

  const registerHelper = async (name, email, password) => {
    const { data } = await axios.post('/auth/register', { name, email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logoutHelper = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: loginHelper,
        register: registerHelper,
        logout: logoutHelper,
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
