import React from 'react';
import { useAppContext } from '../context/AppContext.js';
import './LoadingScreen.css';

const LoadingScreen = () => {
  const { isUpdating } = useAppContext();

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
