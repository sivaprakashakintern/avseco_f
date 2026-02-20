import React from "react";

const StockReport = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Report</h1>
          <p className="page-subtitle">Inventory movement and valuation</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="material-symbols-outlined">download</span>
            Download Report
          </button>
        </div>
      </div>
      <div className="reports-content">
        <p>Stock Report page content goes here...</p>
      </div>
    </div>
  );
};

export default StockReport;