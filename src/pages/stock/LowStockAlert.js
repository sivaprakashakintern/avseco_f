import React from "react";

const LowStockAlert = () => {
  return (
    <div className="stock-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Low Stock Alerts</h1>
          <p className="page-subtitle">Items that need reordering</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="material-symbols-outlined">notifications_active</span>
            Mark All Read
          </button>
        </div>
      </div>

      <div className="alerts-list-container">
        <div className="alert-item-critical">
          <div className="alert-icon">
            <span className="material-symbols-outlined">emergency</span>
          </div>
          <div className="alert-details">
            <h4>Areca Leaf - Grade A</h4>
            <p>Current Stock: 45 kg | Reorder Level: 100 kg</p>
          </div>
          <button className="reorder-btn">Reorder Now</button>
        </div>
        <div className="alert-item-warning">
          <div className="alert-icon">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="alert-details">
            <h4>Packaging Box - Small</h4>
            <p>Current Stock: 28 pcs | Reorder Level: 50 pcs</p>
          </div>
          <button className="reorder-btn">Reorder Now</button>
        </div>
      </div>
    </div>
  );
};

export default LowStockAlert;