import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

const ProtectedRoute = ({ children, module, adminOnly = false }) => {
  const { user, loading, hasAccess, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If NOT logged in -> redirect to /login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If adminOnly requested but NOT admin -> redirect to /unauthorized
  if (adminOnly && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If module requested but no access -> redirect to /unauthorized
  if (module && !hasAccess(module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
