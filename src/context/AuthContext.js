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

  const isSuperAdmin = Boolean(
    user &&
    (user.role?.toLowerCase() === 'superadmin' ||
      user.role?.toLowerCase() === 'admin' ||
      user.email === 'avsecoindustries@gmail.com' ||
      user.username === 'avsecoindustries@gmail.com')
  );

  const userRole = user?.role?.toLowerCase() || '';
  const userDept = user?.department?.toLowerCase() || '';

  const isMasterAdmin = Boolean(
    user &&
    (user.email === 'avsecoindustries@gmail.com' ||
      user.username === 'avsecoindustries@gmail.com')
  );

  const isAdmin = Boolean(
    isSuperAdmin ||
    userRole === 'admin' ||
    userRole === 'hr' ||
    userRole === 'ceo' ||
    userDept === 'ceo' ||
    userDept === 'hr' ||
    userDept === 'management'
  );

  const isCEOViewOnly = false;

  const canEdit = (user && !user.viewOnly) || isMasterAdmin;

  // Granular action-specific permission check
  const hasPermission = useCallback((moduleName, action) => {
    if (!user) return false;

    // Super Admin god-mode bypass
    if (isSuperAdmin) return true;

    // If viewOnly is true, block all write actions!
    if (user.viewOnly === true && action !== 'view') {
      return false;
    }

    // If module is assigned to employee's modules array, grant full action permissions
    if (Array.isArray(user.modules) && user.modules.includes(moduleName)) {
      return true;
    }

    // Retrieve from dynamic permissions map
    const userPerms = user.permissions ? user.permissions[moduleName] : null;

    if (!userPerms) {
      return false; // Strict check: no explicit permission -> NO access!
    }

    // 'manage' privilege grants full access (Allow All) for this module
    if (userPerms.manage) return true;

    // Bridge view/create (cached subdoc) and can_view/can_create (collection fields)
    const isAllowed =
      userPerms[action] !== undefined ? userPerms[action] : userPerms['can_' + action];

    return Boolean(isAllowed);
  }, [user, isSuperAdmin]);

  // Backward compatible module-view visibility check
  const hasAccess = useCallback((moduleName) => {
    if (!user) return false;
    if (isSuperAdmin) return true;

    if (moduleName === 'dashboard') return true;

    // Dynamic module visibility check based on assigned modules array
    if (Array.isArray(user.modules) && user.modules.includes(moduleName)) {
      return true;
    }

    // If the user has 'view' action permission for this module, they have access
    return hasPermission(moduleName, 'view');
  }, [user, isSuperAdmin, hasPermission]);

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
        hasPermission,
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
