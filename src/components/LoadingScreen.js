import React from 'react';
import { useAppContext } from '../context/AppContext.js';
import './LoadingScreen.css';

const LoadingScreen = () => {
  const { fetchStatus, isUpdating } = useAppContext();

  const modules = [
    { key: 'products', label: 'Products & Stock', icon: 'inventory_2' },
    { key: 'production', label: 'Production Line', icon: 'factory' },
    { key: 'employees', label: 'Employee Records', icon: 'groups' },
    { key: 'sales', label: 'Sales History', icon: 'payments' },
    { key: 'expenses', label: 'Expense Logs', icon: 'receipt_long' }
  ];

  return (
    <div className="glass-loading-overlay">
      <div className="loader-container-minimal">
        <div className="premium-spinner-large"></div>
        <div className="brand-load-minimal">
          <h3>AVS ECO</h3>
          <span>INDUSTRIAL SUITE</span>
        </div>
        <div className="loading-status-minimal">
          {isUpdating ? "Syncing Workspace..." : "Initializing Workspace..."}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
