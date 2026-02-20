import React, { useState } from "react";
import "./Stock.css";

const StockOverview = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const stockStats = {
    totalItems: 2845,
    totalValue: "₹1,24,56,800",
    lowStock: 8,
    outOfStock: 3,
    categories: 12,
  };

  const stockItems = [
    {
      id: 1,
      name: "Areca Leaf - Grade A",
      sku: "RM-AL-001",
      category: "Raw Material",
      quantity: 1250,
      unit: "kg",
      price: "₹45",
      value: "₹56,250",
      status: "normal",
    },
    {
      id: 2,
      name: "Packaging Box - Small",
      sku: "PK-BX-001",
      category: "Packaging",
      quantity: 45,
      unit: "pcs",
      price: "₹12",
      value: "₹540",
      status: "low",
    },
    // ... more items
  ];

  return (
    <div className="stock-page">
      <div className="page-header">
        <div>
          <h1>Stock Overview</h1>
          <p>Real-time inventory management</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="material-symbols-outlined">add</span>
            Add Stock
          </button>
          <button className="btn-outline">
            <span className="material-symbols-outlined">download</span>
            Export
          </button>
        </div>
      </div>

      <div className="stock-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">inventory</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Items</span>
            <span className="stat-value">{stockStats.totalItems}</span>
          </div>
        </div>
        {/* More stat cards */}
      </div>

      <div className="stock-table-container">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.sku}</td>
                <td>{item.category}</td>
                <td>{item.quantity} {item.unit}</td>
                <td>{item.price}</td>
                <td>{item.value}</td>
                <td>
                  <span className={`status-badge ${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};