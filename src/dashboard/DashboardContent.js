import React, { useState } from 'react';
import './DashboardContent.css'; // Create this CSS file

const DashboardContent = () => {
  const [activeChartPeriod, setActiveChartPeriod] = useState('Monthly');

  const stats = [
    { label: 'Total Stock', value: '45,200', unit: 'Units', trend: '+12%', trendUp: true },
    { label: 'Stock Value', value: '₹12,40,000', unit: '', trend: '+5.2%', trendUp: true },
    { label: 'Purchased (Mo)', value: '8,500', unit: 'Units', trend: '-2.4%', trendUp: false },
    { label: 'Sold (Mo)', value: '7,200', unit: 'Units', trend: '+15.8%', trendUp: true },
    { label: 'Employees', value: '124', unit: 'Active', trend: 'Stable', trendUp: null },
  ];

  const transactions = [
    { id: '#TRX-8821', product: '12" Round Plate', quantity: '2,500', status: 'Delivered', statusClass: 'delivered', value: '₹12,500' },
    { id: '#TRX-8822', product: '8" Square Plate', quantity: '1,200', status: 'Pending', statusClass: 'pending', value: '₹5,400' },
    { id: '#TRX-8823', product: 'Partitioned Plate', quantity: '5,000', status: 'In Transit', statusClass: 'transit', value: '₹35,000' },
  ];

  const stockAlerts = [
    { product: '10" Dinner Plate', status: 'Critically Low: 45 units left', type: 'critical', icon: 'warning', action: 'Restock' },
    { product: 'Soup Bowls', status: 'Low Stock: 210 units left', type: 'warning', icon: 'inventory', action: 'Order' },
    { product: '6" Dessert Plate', status: 'Healthy: 4,500 units left', type: 'healthy', icon: 'check_circle', action: '' },
  ];

  const stockMovement = [60, 45, 75, 55, 90, 65, 80];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr'];
  const purchaseData = [80, 70, 90, 60];
  const salesData = [65, 75, 50, 85];

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">Real-time factory metrics for Areca Leaf Plate production</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">
              {stat.value} {stat.unit && <span className="stat-unit">{stat.unit}</span>}
            </div>
            <div className={`stat-trend ${stat.trendUp === true ? 'trend-up' : stat.trendUp === false ? 'trend-down' : 'trend-neutral'}`}>
              <span className="trend-icon">
                {stat.trendUp === true && '↗'}
                {stat.trendUp === false && '↘'}
                {stat.trendUp === null && '→'}
              </span>
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Stock Movement */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Stock Movement</h3>
              <p className="chart-subtitle">Daily inventory fluctuation</p>
            </div>
            <div className="chart-controls">
              <button className={`period-btn ${activeChartPeriod === 'Weekly' ? 'active' : ''}`} 
                onClick={() => setActiveChartPeriod('Weekly')}>Weekly</button>
              <button className={`period-btn ${activeChartPeriod === 'Monthly' ? 'active' : ''}`} 
                onClick={() => setActiveChartPeriod('Monthly')}>Monthly</button>
            </div>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {stockMovement.map((height, i) => (
                <div key={i} className="bar-wrapper">
                  <div className="bar" style={{ height: `${height}%` }}></div>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {days.map(day => <span key={day}>{day}</span>)}
            </div>
          </div>
        </div>

        {/* Purchase vs Sales */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Purchase vs Sales</h3>
              <p className="chart-subtitle">Monthly volume comparison</p>
            </div>
            <div className="chart-legend">
              <span className="legend-dot purchase-dot"></span>
              <span>Purchase</span>
              <span className="legend-dot sales-dot"></span>
              <span>Sales</span>
            </div>
          </div>
          <div className="chart-container">
            <div className="comparison-chart">
              {purchaseData.map((purchase, i) => (
                <div key={i} className="comparison-group">
                  <div className="bar-purchase" style={{ height: `${purchase}%` }}></div>
                  <div className="bar-sales" style={{ height: `${salesData[i]}%` }}></div>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {months.map(month => <span key={month}>{month}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="bottom-grid">
        {/* Transactions */}
        <div className="transactions-card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i}>
                    <td className="order-id">{tx.id}</td>
                    <td>{tx.product}</td>
                    <td>{tx.quantity}</td>
                    <td><span className={`status-badge ${tx.statusClass}`}>{tx.status}</span></td>
                    <td className="order-value">{tx.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="alerts-card">
          <div className="card-header">
            <h3 className="card-title">Stock Alerts</h3>
          </div>
          <div className="alerts-list">
            {stockAlerts.map((alert, i) => (
              <div key={i} className={`alert-item ${alert.type}`}>
                <div className={`alert-icon ${alert.type}`}>
                  <span className="material-symbols-outlined">{alert.icon}</span>
                </div>
                <div className="alert-details">
                  <p className="alert-product">{alert.product}</p>
                  <p className="alert-status">{alert.status}</p>
                </div>
                {alert.action && (
                  <button className={`alert-btn ${alert.type}`}>{alert.action}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;