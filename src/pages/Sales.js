import React, { useState } from "react";
import "./Sales.css";

const Sales = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("list");

    // Sample Sales Data
    const [sales] = useState([
        {
            id: "SO-001",
            client: "Reliance Retail",
            date: "2026-02-24",
            amount: 45000,
            status: "Delivered",
            items: "6 Inch Round Plate (5000 units)",
        },
        {
            id: "SO-002",
            client: "Big Bazaar",
            date: "2026-02-23",
            amount: 32000,
            status: "Shipped",
            items: "8 Inch Round Plate (3000 units)",
        },
        {
            id: "SO-003",
            client: "More Supermarket",
            date: "2026-02-22",
            amount: 18500,
            status: "Pending",
            items: "10 Inch Dinner Plate (1500 units)",
        },
        {
            id: "SO-004",
            client: "Local Distributor",
            date: "2026-02-21",
            amount: 12000,
            status: "Delivered",
            items: "12 Inch Party Plate (1000 units)",
        },
    ]);

    const filteredSales = sales.filter(sale =>
        sale.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="sales-container">
            <div className="page-header premium-header">
                <div>
                    <h1 className="page-title">Sales Management</h1>
                    <p className="page-subtitle">Track and manage your sales orders and customer distributions</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary">
                        <span className="material-symbols-outlined">add</span>
                        New Sales Order
                    </button>
                </div>
            </div>

            <div className="sales-stats">
                <div className="stat-card">
                    <div className="stat-icon green">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Revenue</span>
                        <span className="stat-value">₹1,07,500</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <span className="material-symbols-outlined">shopping_bag</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Orders</span>
                        <span className="stat-value">{sales.length}</span>
                    </div>
                </div>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                        type="text"
                        placeholder="Search by client or order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="view-toggle">
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <span className="material-symbols-outlined">view_list</span>
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <span className="material-symbols-outlined">grid_view</span>
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="sales-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map((sale) => (
                            <tr key={sale.id}>
                                <td className="order-id">{sale.id}</td>
                                <td className="client-name">{sale.client}</td>
                                <td>{sale.date}</td>
                                <td className="item-details">{sale.items}</td>
                                <td className="amount">₹{sale.amount.toLocaleString()}</td>
                                <td>
                                    <span className={`status-badge ${sale.status.toLowerCase()}`}>
                                        {sale.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="action-btn view" title="View Details">
                                            <span className="material-symbols-outlined">visibility</span>
                                        </button>
                                        <button className="action-btn edit" title="Edit">
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Sales;
