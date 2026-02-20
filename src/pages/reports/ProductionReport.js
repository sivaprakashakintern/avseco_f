import React from "react";

const ProductionReport = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Production Report</h1>
          <p className="page-subtitle">Production output and efficiency</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="material-symbols-outlined">download</span>
            Download Report
          </button>
        </div>
      </div>
      <div className="reports-content">
        <p>Production Report page content goes here...</p>
      </div>
    </div>
  );
};

export default ProductionReport;