import React from 'react';
import { useAppContext } from '../context/AppContext.js';
import './LoadingScreen.css';

const LoadingScreen = () => {
  const { fetchStatus } = useAppContext();

  const modules = [
    { key: 'products', label: 'Products & Stock', icon: 'inventory_2' },
    { key: 'production', label: 'Production Line', icon: 'factory' },
    { key: 'employees', label: 'Employee Records', icon: 'groups' },
    { key: 'sales', label: 'Sales History', icon: 'payments' },
    { key: 'expenses', label: 'Expense Logs', icon: 'receipt_long' }
  ];

  return (
    <div className="glass-loading-overlay">
      <div className="loader-card">
        <div className="loader-header">
          <div className="premium-spinner-small"></div>
          <div className="brand-load">
            <h3>AVS ECO</h3>
            <span>INDUSTRIAL SUITE</span>
          </div>
        </div>

        <div className="modules-progress">
          {modules.map((mod) => (
            <div key={mod.key} className={`module-item ${fetchStatus[mod.key]}`}>
              <span className="material-symbols-outlined mod-icon">{mod.icon}</span>
              <span className="mod-label">{mod.label}</span>
              <div className="mod-status">
                {fetchStatus[mod.key] === 'success' ? (
                  <span className="material-symbols-outlined success-tick">check_circle</span>
                ) : fetchStatus[mod.key] === 'error' ? (
                  <span className="material-symbols-outlined error-cross">error</span>
                ) : (
                  <div className="dot-pulse"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="load-footer">
          Initializing Secure Connection...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
