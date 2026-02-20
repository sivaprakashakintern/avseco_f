import React from "react";

const EmployeeReport = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Report</h1>
          <p className="page-subtitle">Workforce analytics and attendance</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="material-symbols-outlined">download</span>
            Download Report
          </button>
        </div>
      </div>
      <div className="reports-content">
        <p>Employee Report page content goes here...</p>
      </div>
    </div>
  );
};

export default EmployeeReport;