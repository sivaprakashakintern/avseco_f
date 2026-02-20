import React from "react";

const Help = () => {
  return (
    <div className="help-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle">How can we help you today?</p>
        </div>
      </div>

      <div className="help-search">
        <div className="help-search-container">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search for help articles..." />
        </div>
      </div>

      <div className="help-categories">
        <h2>Popular Topics</h2>
        <div className="help-grid">
          <div className="help-card">
            <span className="material-symbols-outlined">inventory</span>
            <h3>Stock Management</h3>
            <p>Learn how to manage inventory</p>
          </div>
          <div className="help-card">
            <span className="material-symbols-outlined">factory</span>
            <h3>Production</h3>
            <p>Guide to production planning</p>
          </div>
          <div className="help-card">
            <span className="material-symbols-outlined">group</span>
            <h3>Employees</h3>
            <p>Manage your workforce</p>
          </div>
          <div className="help-card">
            <span className="material-symbols-outlined">fact_check</span>
            <h3>Attendance</h3>
            <p>Track employee attendance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;