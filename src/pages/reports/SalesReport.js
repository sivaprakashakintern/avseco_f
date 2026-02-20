import React from "react";

const SalesReport = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Report</h1>
          <p className="page-subtitle">Sales performance and trends</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="material-symbols-outlined">download</span>
            Download Report
          </button>
        </div>
      </div>
      <div className="reports-content">
        <p>Sales Report page content goes here...</p>
      </div>
    </div>
  );
};

export default SalesReport;