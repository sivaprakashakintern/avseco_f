import React, { useState, useEffect } from 'react';
import './ProductionPlan.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ProductionPlan = ({ onNavigate, currentPage }) => {
  const navigate = useNavigate(); // Initialize navigate

  // ===== PRODUCT MASTER DATA =====
  const [productMaster] = useState([
    {
      id: 1,
      productName: 'Areca Leaf Plate',
      sku: 'ARP-6RND-03',
      size: '6-inch',
      cost: 2.80,
      sell: 5.00,
      margin: 44.0,
      stock: 2100,
      status: 'ACTIVE'
    },
    {
      id: 2,
      productName: 'Areca Leaf Plate',
      sku: 'ARP-8RND-04',
      size: '8-inch',
      cost: 3.50,
      sell: 6.50,
      margin: 46.2,
      stock: 1850,
      status: 'ACTIVE'
    },
    {
      id: 3,
      productName: 'Areca Leaf Plate',
      sku: 'ARP-10RND-01',
      size: '10-inch',
      cost: 4.50,
      sell: 8.00,
      margin: 43.7,
      stock: 1250,
      status: 'ACTIVE'
    },
    {
      id: 4,
      productName: 'Areca Leaf Plate',
      sku: 'ARP-12RND-07',
      size: '12-inch',
      cost: 5.80,
      sell: 10.50,
      margin: 44.8,
      stock: 950,
      status: 'ACTIVE'
    }
  ]);

  // ===== UNIQUE PRODUCTS FOR DROPDOWN (ONLY ONE PRODUCT) =====
  const uniqueProducts = [
    { id: 1, name: 'Areca Leaf Plate' }
  ];

  // ===== ALL AVAILABLE SIZES =====
  const allSizes = ['6-inch', '8-inch', '10-inch', '12-inch'];

  // ===== PRODUCTION DATA STATE WITH LOCAL STORAGE =====
  const [productionData, setProductionData] = useState(() => {
    const savedData = localStorage.getItem('productionData');
    return savedData ? JSON.parse(savedData) : [];
  });

  // ===== TARGET ENTRY FORM STATE =====
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [targetQty, setTargetQty] = useState('');

  // ===== SEARCH & FILTER STATES =====
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [manualUpdateQty, setManualUpdateQty] = useState({});
  const [editingProduced, setEditingProduced] = useState(null);

  // ===== EXPORT STATES =====
  const [selectedReportType, setSelectedReportType] = useState('size-wise');
  const [selectedFormat, setSelectedFormat] = useState('excel');

  // ===== SAVE TO LOCALSTORAGE =====
  useEffect(() => {
    localStorage.setItem('productionData', JSON.stringify(productionData));
  }, [productionData]);

  // ===== HANDLE PRODUCT SELECTION =====
  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
  };

  // ===== HANDLE SIZE SELECTION =====
  const handleSizeChange = (e) => {
    const size = e.target.value;
    setSelectedSize(size);
  };

  // ===== HANDLE DAILY PRODUCTION CLICK =====
  const handleDailyProductionClick = () => {
    // Navigate to Daily Production page - Updated to match App.js route
    navigate('/production/daily');
  };

  // ===== GET PRODUCT DETAILS FOR SELECTED SIZE =====
  const getProductDetailsForSize = (size) => {
    return productMaster.find(p => p.size === size);
  };

  // ===== HANDLE ADD TARGET =====
  const handleAddTarget = () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    if (!selectedSize || !targetQty || parseInt(targetQty) <= 0) {
      alert('Please select size and enter valid target quantity');
      return;
    }

    const product = getProductDetailsForSize(selectedSize);

    if (!product) {
      alert('Product details not found');
      return;
    }

    const targetQuantity = parseInt(targetQty);

    const existingIndex = productionData.findIndex(item =>
      item.productSize === selectedSize
    );

    if (existingIndex >= 0) {
      // Update existing target
      const updatedData = [...productionData];
      updatedData[existingIndex] = {
        ...updatedData[existingIndex],
        targetQty: targetQuantity,
        remainingQty: targetQuantity - updatedData[existingIndex].producedQty,
        status: updatedData[existingIndex].producedQty >= targetQuantity ? 'completed' :
          updatedData[existingIndex].producedQty > 0 ? 'in-progress' : 'pending'
      };
      setProductionData(updatedData);
      alert(`Target updated for ${selectedSize} Areca Leaf Plate`);
    } else {
      // Add new production target
      const newProductionItem = {
        id: Date.now(),
        productName: 'Areca Leaf Plate',
        sku: product.sku,
        productSize: product.size,
        targetQty: targetQuantity,
        producedQty: 0,
        remainingQty: targetQuantity,
        status: 'pending',
        unit: 'Pieces',
        cost: product.cost,
        sell: product.sell,
        margin: product.margin,
        size: product.size
      };
      setProductionData([...productionData, newProductionItem]);
      alert(`Target added for ${selectedSize} Areca Leaf Plate`);
    }

    setTargetQty('');
  };

  // ===== HANDLE MANUAL PRODUCTION UPDATE =====
  const handleProducedUpdate = (itemId, newProducedQty) => {
    const updatedData = productionData.map(item => {
      if (item.id === itemId) {
        const produced = parseInt(newProducedQty) || 0;
        const remaining = Math.max(item.targetQty - produced, 0);
        const status = produced >= item.targetQty ? 'completed' :
          produced > 0 ? 'in-progress' : 'pending';

        return {
          ...item,
          producedQty: produced,
          remainingQty: remaining,
          status: status
        };
      }
      return item;
    });
    setProductionData(updatedData);
    setEditingProduced(null);
    setManualUpdateQty({});
  };

  // ===== HANDLE DELETE TARGET =====
  const handleDeleteTarget = (itemId) => {
    if (window.confirm('Are you sure you want to delete this target?')) {
      const updatedData = productionData.filter(item => item.id !== itemId);
      setProductionData(updatedData);
      alert('Target deleted successfully');
    }
  };

  // ===== GET UNIQUE SIZES FOR FILTER =====
  const getUniqueSizes = () => {
    if (productionData.length === 0) return ['all'];
    return ['all', ...new Set(productionData.map(item => item.productSize))];
  };

  const uniqueSizes = getUniqueSizes();

  // ===== FILTERED DATA =====
  const filteredData = productionData.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productSize.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSize = sizeFilter === 'all' || item.productSize === sizeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesSize && matchesStatus;
  });

  // Calculate totals
  const totalTarget = filteredData.reduce((sum, item) => sum + (item.targetQty || 0), 0);
  const totalProduced = filteredData.reduce((sum, item) => sum + (item.producedQty || 0), 0);
  const totalRemaining = filteredData.reduce((sum, item) => sum + (item.remainingQty || 0), 0);
  const overallProgress = totalTarget > 0 ? ((totalProduced / totalTarget) * 100).toFixed(1) : "0";

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // ===== EXPORT FUNCTIONS =====
  const handleExportClick = () => {
    setShowExportOptions(true);
    setSelectedReportType('size-wise');
    setSelectedFormat('excel');
  };

  const closeExportOptions = () => {
    setShowExportOptions(false);
  };

  // Generate CSV
  const generateCSV = (data, filename) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Export based on selections
  const handleGenerateExport = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    const date = new Date().toISOString().split('T')[0];

    if (selectedReportType === 'size-wise') {
      // Size Wise Report
      const exportData = filteredData.map(item => ({
        'Product': item.productName,
        'Size': item.productSize,
        'SKU': item.sku,
        'Target': item.targetQty,
        'Produced': item.producedQty,
        'Balance': item.remainingQty,
        'Progress %': ((item.producedQty / item.targetQty) * 100).toFixed(1) + '%',
        'Status': item.status.toUpperCase()
      }));

      // Add summary row
      exportData.push({
        'Product': 'TOTAL',
        'Size': '',
        'SKU': '',
        'Target': totalTarget,
        'Produced': totalProduced,
        'Balance': totalRemaining,
        'Progress %': overallProgress + '%',
        'Status': ''
      });

      if (selectedFormat === 'excel') {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Size Wise Report');
        XLSX.writeFile(wb, `size-wise-report-${date}.xlsx`);
      } else if (selectedFormat === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.setTextColor(46, 139, 102);
        doc.text('Size Wise Report', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${today}`, 14, 28);

        const tableColumn = ['Size', 'SKU', 'Target', 'Produced', 'Balance', 'Progress', 'Status'];
        const tableRows = filteredData.map(item => [
          item.productSize,
          item.sku,
          item.targetQty,
          item.producedQty,
          item.remainingQty,
          ((item.producedQty / item.targetQty) * 100).toFixed(1) + '%',
          item.status
        ]);

        doc.autoTable({
          startY: 35,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [46, 139, 102] }
        });
        doc.save(`size-wise-report-${date}.pdf`);
      } else if (selectedFormat === 'csv') {
        generateCSV(exportData, `size-wise-report-${date}.csv`);
      }
    } else {
      // Overall Summary
      const summaryData = [
        { 'Summary': 'Total Items', 'Value': filteredData.length },
        { 'Summary': 'Total Target', 'Value': totalTarget + ' units' },
        { 'Summary': 'Total Produced', 'Value': totalProduced + ' units' },
        { 'Summary': 'Total Balance', 'Value': totalRemaining + ' units' },
        { 'Summary': 'Overall Progress', 'Value': overallProgress + '%' },
        { 'Summary': 'Date', 'Value': today }
      ];

      const sizeWiseData = filteredData.map(item => ({
        'Size': item.productSize,
        'Target': item.targetQty,
        'Produced': item.producedQty,
        'Balance': item.remainingQty,
        'Progress': ((item.producedQty / item.targetQty) * 100).toFixed(1) + '%',
        'Status': item.status
      }));

      if (selectedFormat === 'excel') {
        const wb = XLSX.utils.book_new();

        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        const sizeWs = XLSX.utils.json_to_sheet(sizeWiseData);
        XLSX.utils.book_append_sheet(wb, sizeWs, 'Size Wise Breakdown');

        XLSX.writeFile(wb, `overall-summary-${date}.xlsx`);
      } else if (selectedFormat === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.setTextColor(46, 139, 102);
        doc.text('Overall Summary', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${today}`, 14, 28);

        doc.setFontSize(12);
        doc.setTextColor(46, 139, 102);
        doc.text('Summary', 14, 40);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        let y = 48;
        summaryData.forEach(item => {
          doc.text(`${item.Summary}: ${item.Value}`, 20, y);
          y += 6;
        });

        doc.setFontSize(12);
        doc.setTextColor(46, 139, 102);
        doc.text('Size Wise Breakdown', 14, y + 10);

        const tableColumn = ['Size', 'Target', 'Produced', 'Balance', 'Progress', 'Status'];
        const tableRows = filteredData.map(item => [
          item.productSize,
          item.targetQty,
          item.producedQty,
          item.remainingQty,
          ((item.producedQty / item.targetQty) * 100).toFixed(1) + '%',
          item.status
        ]);

        doc.autoTable({
          startY: y + 18,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [46, 139, 102] }
        });
        doc.save(`overall-summary-${date}.pdf`);
      } else if (selectedFormat === 'csv') {
        generateCSV(sizeWiseData, `overall-summary-${date}.csv`);
      }
    }

    setShowExportOptions(false);
  };

  // ===== CLEAR ALL DATA =====
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all production data?')) {
      setProductionData([]);
      localStorage.removeItem('productionData');
      alert('All data cleared successfully');
    }
  };

  return (
    <div className="production-page-wrapper">
      <div className="production-container">
        {/* Page Header */}
        <div className="production-header">
          <div>
            <h2>Production Plan - Areca Leaf Plates</h2>
            <p>Set targets and track daily production progress by size</p>
          </div>
          <div className="header-actions">
            {/* Daily Production Button */}
            <button
              className="daily-production-btn"
              onClick={handleDailyProductionClick}
              title="Go to Daily Production"
            >
              <span className="material-symbols-outlined">production_quantity_limits</span>
              Daily Production
            </button>

            {/* Date Badge */}
            <div className="date-badge">
              <span className="material-symbols-outlined">calendar_today</span>
              {today}
            </div>
          </div>
        </div>

        {/* Target Entry Form */}
        <div className="target-entry-section">
          <h3>Set Production Target by Size</h3>
          <div className="target-form" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr' }}>
            <div className="form-group">
              <label>Select Product</label>
              <select
                value={selectedProduct}
                onChange={handleProductChange}
                className="form-select"
              >
                <option value="">-- Select Product --</option>
                {uniqueProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Size</label>
              <select
                value={selectedSize}
                onChange={handleSizeChange}
                className="form-select"
              >
                <option value="">-- Select Size --</option>
                {allSizes.map((size, index) => (
                  <option key={index} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Quantity (Pieces)</label>
              <input
                type="number"
                value={targetQty}
                onChange={(e) => setTargetQty(e.target.value)}
                placeholder="Enter target quantity"
                className="form-input"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>&nbsp;</label>
              <button
                onClick={handleAddTarget}
                className="btn-add-target"
              >
                <span className="material-symbols-outlined">add_task</span>
                Add / Update Target
              </button>
            </div>
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
            <p className="prod-stat-label">⚡ PRODUCED</p>
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

        {/* Search & Filter Section */}
        <div className="search-filter-section">
          <div className="search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search by size or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-box">
            <span className="material-symbols-outlined filter-icon">filter_list</span>
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

          <div className="filter-box">
            <span className="material-symbols-outlined filter-icon">info</span>
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

          {productionData.length > 0 && (
            <button
              className="clear-all-btn"
              onClick={handleClearAllData}
              title="Clear all data"
            >
              <span className="material-symbols-outlined">delete_sweep</span>
              Clear All
            </button>
          )}
        </div>

        {/* Production Table */}
        <div className="production-table-container">
          <div className="production-table-header">
            <h3>
              <span className="material-symbols-outlined">format_list_bulleted</span>
              Production Items by Size ({filteredData.length})
            </h3>
            <div className="table-actions">
              <button className="icon-btn export-btn" onClick={handleExportClick} title="Export Data">
                <span className="material-symbols-outlined">download</span>
                Export
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="prod-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>SKU</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Produced</th>
                  <th className="text-right">Balance</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map(item => {
                    const progress = ((item.producedQty / item.targetQty) * 100).toFixed(1);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="prod-product-cell">
                            <div className="prod-icon">
                              <span className="material-symbols-outlined">eco</span>
                            </div>
                            <span className="prod-name">{item.productName}</span>
                          </div>
                        </td>
                        <td><strong>{item.productSize}</strong></td>
                        <td><span className="prod-sku">{item.sku}</span></td>
                        <td className="text-right">{item.targetQty.toLocaleString()}</td>
                        <td className="text-right">
                          {editingProduced === item.id ? (
                            <input
                              type="number"
                              className="edit-produced-input"
                              defaultValue={item.producedQty}
                              onChange={(e) => setManualUpdateQty({ ...manualUpdateQty, [item.id]: e.target.value })}
                              onBlur={() => handleProducedUpdate(item.id, manualUpdateQty[item.id])}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleProducedUpdate(item.id, manualUpdateQty[item.id]);
                                }
                              }}
                              autoFocus
                              min="0"
                              max={item.targetQty}
                            />
                          ) : (
                            <span
                              className="editable-value"
                              onClick={() => {
                                setEditingProduced(item.id);
                                setManualUpdateQty({ ...manualUpdateQty, [item.id]: item.producedQty });
                              }}
                              style={{ color: '#155724', fontWeight: '600', cursor: 'pointer' }}
                            >
                              {item.producedQty.toLocaleString()}
                              <span className="edit-icon">✎</span>
                            </span>
                          )}
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
                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-btn-small edit-btn"
                              onClick={() => {
                                setSelectedProduct('1');
                                setSelectedSize(item.productSize);
                                setTargetQty(item.targetQty);
                              }}
                              title="Edit Target"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              className="icon-btn-small delete-btn"
                              onClick={() => handleDeleteTarget(item.id)}
                              title="Delete Target"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
                      No production targets set. Please add targets using the form above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="prod-table-footer">
            <div className="prod-total-info">
              <span>Total Items: <strong>{filteredData.length}</strong></span>
              <span className="total-target">Target: <strong>{totalTarget.toLocaleString()}</strong></span>
              <span className="total-produced">Produced: <strong>{totalProduced.toLocaleString()}</strong></span>
              <span className="total-balance">Balance: <strong>{totalRemaining.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* Export Options Modal */}
        {showExportOptions && (
          <div className="report-modal-overlay">
            <div className="report-modal">
              <h3 className="report-modal-title">Export Data</h3>

              <div className="export-options">
                {/* Report Type Radio Buttons */}
                <div className="export-section">
                  <label className="export-option-header">Select Report Type</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="reportType"
                        value="size-wise"
                        checked={selectedReportType === 'size-wise'}
                        onChange={(e) => setSelectedReportType(e.target.value)}
                      />
                      <span>Size Wise Report</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="reportType"
                        value="overall"
                        checked={selectedReportType === 'overall'}
                        onChange={(e) => setSelectedReportType(e.target.value)}
                      />
                      <span>Overall Summary</span>
                    </label>
                  </div>
                </div>

                {/* Format Selection */}
                <div className="export-section">
                  <label className="export-option-header">Select Format</label>
                  <div className="format-buttons">
                    <button
                      className={`format-btn ${selectedFormat === 'excel' ? 'active' : ''}`}
                      onClick={() => setSelectedFormat('excel')}
                    >
                      <span className="material-symbols-outlined">table_chart</span>
                      Excel
                    </button>
                    <button
                      className={`format-btn ${selectedFormat === 'pdf' ? 'active' : ''}`}
                      onClick={() => setSelectedFormat('pdf')}
                    >
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                      PDF
                    </button>
                    <button
                      className={`format-btn ${selectedFormat === 'csv' ? 'active' : ''}`}
                      onClick={() => setSelectedFormat('csv')}
                    >
                      <span className="material-symbols-outlined">data_table</span>
                      CSV
                    </button>
                  </div>
                </div>
              </div>

              <div className="report-modal-actions">
                <button className="modal-btn cancel-btn" onClick={closeExportOptions}>
                  Cancel
                </button>
                <button className="modal-btn generate-btn" onClick={handleGenerateExport}>
                  <span className="material-symbols-outlined">download</span>
                  Generate {selectedReportType === 'size-wise' ? 'Size Wise' : 'Overall'} {selectedFormat.toUpperCase()}
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