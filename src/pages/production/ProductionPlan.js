import React, { useState } from 'react';
import './ProductionPlan.css';

const ProductionPlan = ({ onNavigate, currentPage }) => {
  // ===== PRODUCTION DATA =====
  const [productionData] = useState([
    {
      id: 1,
      productName: '10" Round Dinner Plate',
      productSize: '10 inch',
      targetQty: 5000,
      producedQty: 3250,
      remainingQty: 1750,
      status: 'in-progress',
      unit: 'Pieces'
    },
    {
      id: 2,
      productName: '6" Square Dessert Plate',
      productSize: '6 inch',
      targetQty: 3000,
      producedQty: 3000,
      remainingQty: 0,
      status: 'completed',
      unit: 'Pieces'
    },
    {
      id: 3,
      productName: 'Partitioned Meal Tray',
      productSize: '12x8 inch',
      targetQty: 2000,
      producedQty: 1200,
      remainingQty: 800,
      status: 'in-progress',
      unit: 'Pieces'
    },
    {
      id: 4,
      productName: '8" Round Premium Plate',
      productSize: '8 inch',
      targetQty: 4000,
      producedQty: 1800,
      remainingQty: 2200,
      status: 'in-progress',
      unit: 'Pieces'
    },
    {
      id: 5,
      productName: 'Biodegradable Spoon',
      productSize: '6 inch',
      targetQty: 10000,
      producedQty: 0,
      remainingQty: 10000,
      status: 'pending',
      unit: 'Boxes'
    }
  ]);

  // ===== SEARCH & FILTER STATES =====
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // New status filter
  const [showReportOptions, setShowReportOptions] = useState(false);

  // ===== GET UNIQUE SIZES FOR FILTER =====
  const uniqueSizes = ['all', ...new Set(productionData.map(item => item.productSize))];

  // ===== FILTERED DATA =====
  const filteredData = productionData.filter(item => {
    // Search filter
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.productSize.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Size filter
    const matchesSize = sizeFilter === 'all' || item.productSize === sizeFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesSize && matchesStatus;
  });

  // Calculate totals based on filtered data
  const totalTarget = filteredData.reduce((sum, item) => sum + (item.targetQty || 0), 0);
  const totalProduced = filteredData.reduce((sum, item) => sum + (item.producedQty || 0), 0);
  const totalRemaining = filteredData.reduce((sum, item) => sum + (item.remainingQty || 0), 0);
  const overallProgress = totalTarget > 0 ? ((totalProduced / totalTarget) * 100).toFixed(1) : "0";

  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // ===== REPORT GENERATION FUNCTIONS =====
  const handleGenerateReport = () => {
    setShowReportOptions(true);
  };

  const generateAllItemsReport = () => {
    let itemsReport = '';
    filteredData.forEach(item => {
      const progress = ((item.producedQty / item.targetQty) * 100).toFixed(1);
      itemsReport += `\n${item.productName.padEnd(25)} | ${item.productSize.padEnd(8)} | Target: ${item.targetQty.toString().padStart(6)} | Produced: ${item.producedQty.toString().padStart(6)} | Balance: ${item.remainingQty.toString().padStart(6)} | ${progress.padStart(4)}% | ${item.status}`;
    });

    const report = `
═══════════════════════════════════════════
        PRODUCTION PLAN REPORT
═══════════════════════════════════════════
Date: ${today}

📊 OVERALL SUMMARY
───────────────────
Total Target    : ${totalTarget.toLocaleString()} units
Total Produced  : ${totalProduced.toLocaleString()} units
Balance         : ${totalRemaining.toLocaleString()} units
Progress        : ${overallProgress}%

📋 ITEM WISE BREAKDOWN
───────────────────
${itemsReport}

═══════════════════════════════════════════
    `;
    alert(report);
    setShowReportOptions(false);
  };

  const closeReportOptions = () => {
    setShowReportOptions(false);
  };

  const downloadCSV = () => {
    const headers = ['Product Name', 'Size', 'Target Qty', 'Produced', 'Balance', 'Progress %', 'Status'];
    const rows = filteredData.map(item => [
      item.productName,
      item.productSize,
      item.targetQty,
      item.producedQty,
      item.remainingQty,
      ((item.producedQty / item.targetQty) * 100).toFixed(1),
      item.status
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-plan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="production-page-wrapper">
      <div className="production-container">
        {/* Page Header */}
        <div className="production-header">
          <div>
            <h2>Production Plan</h2>
            <p>Track daily production targets and progress</p>
          </div>
          <div className="date-badge">
            <span className="material-symbols-outlined">calendar_today</span>
            {today}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="production-stats">
          <div className="prod-stat-card">
            <p className="prod-stat-label">🎯 TOTAL TARGET</p>
            <div className="prod-stat-value">
              <h3 className="prod-stat-number">{totalTarget.toLocaleString()}</h3>
              <span className="prod-stat-badge badge-target">Units</span>
            </div>
          </div>
          <div className="prod-stat-card">
            <p className="prod-stat-label">⚡ PRODUCED TODAY</p>
            <div className="prod-stat-value">
              <h3 className="prod-stat-number" style={{ color: '#155724' }}>{totalProduced.toLocaleString()}</h3>
              <span className="prod-stat-badge badge-progress">{overallProgress}%</span>
            </div>
          </div>
          <div className="prod-stat-card">
            <p className="prod-stat-label">⏳ BALANCE</p>
            <div className="prod-stat-value">
              <h3 className="prod-stat-number" style={{ color: '#856404' }}>{totalRemaining.toLocaleString()}</h3>
              <span className="prod-stat-badge badge-remaining">To do</span>
            </div>
          </div>
        </div>

        {/* ===== SEARCH & FILTER SECTION ===== */}
        <div className="search-filter-section">
          <div className="search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search products by name or size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-box">
            <span className="filter-label"></span>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="filter-select"
            >
              {uniqueSizes.map(size => (
                <option key={size} value={size}>
                  {size === 'all' ? 'All Sizes' : size}
                </option>
              ))}
            </select>
          </div>

          {/* New Status Filter */}
          <div className="filter-box">
            <span className="filter-label"></span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Production Table */}
        <div className="production-table-container">
          <div className="production-table-header">
            <h3>
              <span className="material-symbols-outlined">format_list_bulleted</span>
              Production Items ({filteredData.length})
            </h3>
            <div className="table-actions">
              <button className="icon-btn" onClick={handleGenerateReport} title="Generate Report">
                <span className="material-symbols-outlined">description</span>
                Report
              </button>
              <button className="icon-btn" onClick={downloadCSV} title="Download CSV">
                <span className="material-symbols-outlined">download</span>
                CSV
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="prod-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Size</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Produced</th>
                  <th className="text-right">Balance</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(item => {
                  const progress = ((item.producedQty / item.targetQty) * 100).toFixed(1);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="prod-product-cell">
                          <div className="prod-icon">
                            <span className="material-symbols-outlined">factory</span>
                          </div>
                          <span className="prod-name">{item.productName}</span>
                        </div>
                      </td>
                      <td>{item.productSize}</td>
                      <td className="text-right">{item.targetQty.toLocaleString()}</td>
                      <td className="text-right" style={{ color: '#155724', fontWeight: '600' }}>
                        {item.producedQty.toLocaleString()}
                      </td>
                      <td className="text-right" style={{ color: item.remainingQty > 0 ? '#856404' : '#7f8c8d' }}>
                        {item.remainingQty.toLocaleString()}
                      </td>
                      <td>
                        <div className="prod-progress">
                          <div className="prod-progress-bar">
                            <div className="prod-progress-fill" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="prod-progress-text">{progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`prod-status ${item.status}`}>
                          <span className="prod-status-dot"></span>
                          {item.status === 'completed' ? 'Completed' : 
                           item.status === 'in-progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="prod-table-footer">
            <div className="prod-total-info">
              <span>Total Items: <strong>{filteredData.length}</strong></span>
              <span className="total-target">Target: <strong>{totalTarget.toLocaleString()}</strong></span>
              <span className="total-produced">Produced: <strong>{totalProduced.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* ===== REPORT OPTIONS MODAL ===== */}
        {showReportOptions && (
          <div className="report-modal-overlay">
            <div className="report-modal">
              <h3 className="report-modal-title">Generate Report</h3>
              
              <div className="report-options">
                <label className="report-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="all"
                    checked={true}
                    readOnly
                  />
                  <span>All Items Report</span>
                </label>
              </div>

              <div className="report-modal-actions">
                <button className="modal-btn cancel-btn" onClick={closeReportOptions}>
                  Cancel
                </button>
                <button 
                  className="modal-btn generate-btn" 
                  onClick={generateAllItemsReport}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionPlan;