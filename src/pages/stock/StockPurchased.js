import React from "react";
import "./Stock.css";

const StockPurchased = () => {
  const purchaseOrders = [
    {
      id: 1,
      supplier: "Green Leaf Supplies",
      poNumber: "PO-2026-001",
      date: "10 Feb 2026",
      items: 5,
      totalAmount: "₹45,000",
      status: "Received",
    },
    {
      id: 2,
      supplier: "EcoPack Solutions",
      poNumber: "PO-2026-002",
      date: "08 Feb 2026",
      items: 3,
      totalAmount: "₹12,500",
      status: "Pending",
    },
    {
      id: 3,
      supplier: "Areca Farmers Co-op",
      poNumber: "PO-2026-003",
      date: "05 Feb 2026",
      items: 8,
      totalAmount: "₹78,000",
      status: "Received",
    },
    {
      id: 4,
      supplier: "Packaging Mart",
      poNumber: "PO-2026-004",
      date: "02 Feb 2026",
      items: 2,
      totalAmount: "₹8,900",
      status: "Pending",
    },
  ];

  const totalSpent = "₹45,67,890";
  const pendingCount = purchaseOrders.filter(po => po.status === "Pending").length;
  const receivedCount = purchaseOrders.filter(po => po.status === "Received").length;

  return (
    <div className="stock-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Purchased</h1>
          <p className="page-subtitle">Purchase orders and receipts</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="material-symbols-outlined">add_shopping_cart</span>
            New Purchase
          </button>
          <button className="btn-outline">
            <span className="material-symbols-outlined">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stock-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">receipt</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{purchaseOrders.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <span className="material-symbols-outlined">pending</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Received</span>
            <span className="stat-value">{receivedCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <span className="material-symbols-outlined">currency_rupee</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">{totalSpent}</span>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="stock-table-container">
        <div className="table-header">
          <h3>Purchase Orders</h3>
          <div className="table-filters">
            <div className="search-box">
              <span className="material-symbols-outlined">search</span>
              <input type="text" placeholder="Search PO number or supplier..." />
            </div>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>PO Number</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td className="supplier-name">{po.supplier}</td>
                  <td className="po-number">{po.poNumber}</td>
                  <td>{po.date}</td>
                  <td className="text-center">{po.items}</td>
                  <td className="amount">{po.totalAmount}</td>
                  <td>
                    <span className={`status-badge ${po.status.toLowerCase()}`}>
                      {po.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn">View</button>
                      <button className="action-icon">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Total */}
        <div className="table-footer">
          <div className="pagination-info">
            Showing <span>1-4</span> of <span>24</span> orders
          </div>
          <div className="total-amount">
            <span>Total Spent:</span>
            <strong>{totalSpent}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockPurchased;