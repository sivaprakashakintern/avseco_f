import React from "react";

const FinancialReport = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Report</h1>
          <p className="page-subtitle">Revenue, expenses and profit</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="material-symbols-outlined">download</span>
            Download Report
          </button>
        </div>
      </div>
      <div className="reports-content">
        <p>Financial Report page content goes here...</p>
      </div>
    </div>
  );
};

export default FinancialReport;