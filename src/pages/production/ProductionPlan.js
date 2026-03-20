import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils.js';
import { useAppContext } from '../../context/AppContext.js';
import { productionTargetApi } from '../../utils/api.js';
import './ProductionPlan.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';




const ProductionPlan = ({ onNavigate, currentPage }) => {

  const { 
    products: dbProducts, 
    productionTargets, 
    fetchTargets, 
    employees,
    productionStats
  } = useAppContext();

  
  // ===== TARGET ENTRY FORM STATE =====
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [targetQty, setTargetQty] = useState('');


  


  // ===== DYNAMIC PRODUCT DATA FROM DATABASE =====
  const uniqueProducts = React.useMemo(() => {
    const products = dbProducts || [];
    const unique = [];
    const names = new Set();
    
    products.forEach(p => {
      if (!names.has(p.name)) {
        names.add(p.name);
        unique.push({ id: p.id || p._id, name: p.name });
      }
    });

    // Fallback if empty
    if (unique.length === 0) {
      return [];
    }
    
    return unique;
  }, [dbProducts]);

  // ===== DYNAMIC SIZES FOR SELECTED PRODUCT =====
  const availableSizes = React.useMemo(() => {
    if (!selectedProduct) return [];
    
    // Find the product name for the selected ID
    const productObj = uniqueProducts.find(p => p.id === selectedProduct || p.name === selectedProduct);
    const productName = productObj ? productObj.name : '';
    
    if (!productName) return [];

    return (dbProducts || [])
      .filter(p => p.name === productName)
      .map(p => p.size);
  }, [selectedProduct, uniqueProducts, dbProducts]);



  // ===== PRODUCTION DATA STATE =====
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Custom Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // ===== SEARCH & FILTER STATES =====
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExportOptions, setShowExportOptions] = useState(false);


  // ===== EXPORT STATES =====
  const [selectedReportType, setSelectedReportType] = useState('size-wise');
  const [selectedFormat, setSelectedFormat] = useState('excel');

  // Clear individual item loading state

  // Removed local sync as DB is now source of truth

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






  // Existing helpers...
  const getProductDetailsForSize = (size) => {
    const productObj = uniqueProducts.find(p => p.id === selectedProduct || p.name === selectedProduct);
    const productName = productObj ? productObj.name : '';
    return dbProducts.find(p => p.name === productName && p.size === size);
  };

  // ===== HANDLE ADD TARGET =====
  const handleAddTarget = async () => {
    if (!selectedProduct) {
      showToast('Please select a product', 'error');
      return;
    }

    if (!selectedSize || !targetQty || parseInt(targetQty) <= 0) {
      showToast('Please select size and enter valid target quantity', 'error');
      return;
    }

    const product = getProductDetailsForSize(selectedSize);

    if (!product) {
      showToast('Product details not found', 'error');
      return;
    }

    const targetQuantity = parseInt(targetQty);

    const targetPayload = {
      productName: product.name,
      sku: product.sku,
      productSize: product.size,
      targetQty: targetQuantity,
      remainingQty: targetQuantity, // Initially same as target
      status: 'pending',
      unit: 'Pieces',
      size: product.size,
      date: new Date().toLocaleDateString('en-IN').replace(/\//g, '-') // DD-MM-YYYY
    };

    try {
      await productionTargetApi.save(targetPayload);
      await fetchTargets();
      showToast(`Target saved for ${selectedSize} Areca Plate`, 'success');
      setTargetQty('');
    } catch (err) {
      console.error("Error saving target:", err);
      showToast("Failed to save target to database", 'error');
    }
  };



  // ===== HANDLE CLEAR ALL DATA =====
  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all production targets? This cannot be undone.')) {
      try {
        setLoading(true);
        await productionTargetApi.clearAll();
        await fetchTargets();
        showToast('All production targets cleared successfully', 'success');
      } catch (err) {
        console.error("Error clearing data:", err);
        showToast("Failed to clear data from server", 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // ===== HANDLE DELETE TARGET =====
  const handleDeleteTarget = (itemId) => {
    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);
      await productionTargetApi.delete(itemToDelete);
      await fetchTargets();
      showToast('Target deleted successfully', 'success');
    } catch (err) {
      console.error("Error deleting target:", err);
      showToast("Failed to delete target", 'error');
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
      setLoading(false);
    }
  };





  // ===== FILTERED DATA =====
  const filteredData = (productionTargets || []).filter(item => {
    const productName = item.productName || '';
    const productSize = item.productSize || '';
    const sku = item.sku || '';

    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productSize.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalTarget = filteredData.reduce((sum, item) => sum + (item.targetQty || 0), 0);
  const totalProduced = filteredData.reduce((sum, item) => sum + (item.producedQty || 0), 0);
  const totalRemaining = filteredData.reduce((sum, item) => sum + (item.remainingQty || 0), 0);
  const overallProgress = totalTarget > 0 ? ((totalProduced / totalTarget) * 100).toFixed(1) : "0";

  if (toast.show) {
    // Return Toast UI inside the render
  }

  const today = formatDate(new Date());

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


  return (
    <div className="production-page-wrapper">
      {/* Loading Overlay */}
      {loading && (
        <div className="glass-loading-overlay">
          <div className="premium-spinner"></div>
          <span>Syncing with database...</span>
        </div>
      )}

      {/* Toast Notification Overlay */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      <div className="production-container">
        {/* ===== PREMIUM ANALYTICS HEADER ===== */}
        <div className="page-header premium-header">
          <div>
            <h1 className="page-title">Production Plan</h1>
          </div>
          <div className="header-actions">
            {/* Date Badge */}
            <div className="btn-export-premium" style={{ cursor: 'default', background: 'rgba(255, 255, 255, 0.1)' }}>
              <span className="material-symbols-outlined">calendar_today</span>
              {today}
            </div>
          </div>
        </div>




        {/* Central Entry Form (Target Setting Only) */}
        <div className="target-entry-section">
          <h3>Set Production Target by Size</h3>
          <div className="target-form">
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
                {availableSizes.map((size, index) => (
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

            <button
              onClick={handleAddTarget}
              className="btn-add-target"
            >
              <span className="material-symbols-outlined">add_task</span>
              Add / Update Target
            </button>
          </div>
        </div>

        {/* Global Production Stats - New Section from Image */}
        <div className="premium-stats-grid">
          <div className="premium-stat-card today">
            <div className="p-stat-info">
              <span className="p-stat-label">Today's Production</span>
              <div className="p-stat-value">{(productionStats?.today || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {(productionStats?.availableSizes || []).map(size => (
                  <span key={size} className="breakdown-tag">
                    {size.split('-')[0]}: {productionStats?.todayBySize?.[size] || 0}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="premium-stat-card week">
            <div className="p-stat-info">
              <span className="p-stat-label">Last 7 Days</span>
              <div className="p-stat-value">{(productionStats?.week || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {(productionStats?.availableSizes || []).map(size => (
                  <span key={size} className="breakdown-tag">
                    {size.split('-')[0]}: {productionStats?.weekBySize?.[size] || 0}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="premium-stat-card month">
            <div className="p-stat-info">
              <span className="p-stat-label">This Month</span>
              <div className="p-stat-value">{(productionStats?.month || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {(productionStats?.availableSizes || []).map(size => (
                  <span key={size} className="breakdown-tag">
                    {size.split('-')[0]}: {productionStats?.monthBySize?.[size] || 0}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="premium-stat-card stock">
            <div className="p-stat-info">
              <span className="p-stat-label">Total Produced</span>
              <div className="p-stat-value">{(productionStats?.stock || 0).toLocaleString()}</div>
              <span className="p-stat-tag">All time</span>
            </div>
          </div>
        </div>

        {/* Plan Summary Section - Premium Version */}
        <div className="premium-stats-grid plan-summary">
          <div className="premium-stat-card today"> {/* Using 'today' class for color consistency or 'target' if added to CSS */}
            <div className="p-stat-info">
              <span className="p-stat-label">Total Target</span>
              <div className="p-stat-value">{(totalTarget || 0).toLocaleString()}</div>
              <span className="p-stat-tag">Units</span>
            </div>
          </div>

          <div className="premium-stat-card week">
            <div className="p-stat-info">
              <span className="p-stat-label">Produced</span>
              <div className="p-stat-value">{(totalProduced || 0).toLocaleString()}</div>
              <span className="p-stat-tag">{overallProgress}%</span>
            </div>
          </div>

          <div className="premium-stat-card month">
            <div className="p-stat-info">
              <span className="p-stat-label">Balance</span>
              <div className="p-stat-value">{(totalRemaining || 0).toLocaleString()}</div>
              <span className="p-stat-tag">To do</span>
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

          {productionTargets.length > 0 && (
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
                  <th className="hide-mobile">Product</th>
                  <th>Size</th>
                  <th className="hide-mobile">SKU</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Produced</th>
                  <th className="text-right">Balance</th>
                  <th className="hide-mobile">Progress</th>
                  <th className="hide-mobile">Status</th>
                  <th>Del</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map(item => {
                    const progress = ((item.producedQty / item.targetQty) * 100).toFixed(1);
                    return (
                      <tr key={item.id}>
                        <td className="hide-mobile">
                          <div className="prod-product-cell">
                            <div className="prod-icon">
                              <span className="material-symbols-outlined">eco</span>
                            </div>
                            <span className="prod-name">{item.productName}</span>
                          </div>
                        </td>
                        <td><strong>{item.productSize}</strong></td>

                        <td className="hide-mobile"><span className="prod-sku">{item.sku}</span></td>
                        <td className="text-right">{item.targetQty.toLocaleString()}</td>
                        <td className="text-right">
                          <span
                            className="produced-value-cell"
                            style={{ color: '#155724', fontWeight: '600' }}
                          >
                            {item.producedQty.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right" style={{ color: item.remainingQty > 0 ? '#856404' : '#7f8c8d' }}>
                          {item.remainingQty.toLocaleString()}
                        </td>
                        <td className="hide-mobile">
                          <div className="prod-progress">
                            <div className="prod-progress-bar">
                              <div className="prod-progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="prod-progress-text">{progress}%</span>
                          </div>
                        </td>
                        <td className="hide-mobile">
                          <span className={`prod-status ${item.status}`}>
                            <span className="prod-status-dot"></span>
                            {item.status === 'completed' ? 'Completed' :
                              item.status === 'in-progress' ? 'In Progress' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
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

          {/* ===== MOBILE CARD LAYOUT (shown on ≤1024px, hidden on desktop) ===== */}
          <div className="mobile-prod-card">
            {filteredData.length > 0 ? (
              <div className="mobile-table-container">
                <table className="mobile-quick-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th className="text-center">Target</th>
                      <th className="text-center">Prod</th>
                      <th className="text-center">Bal</th>
                      <th className="text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(item => (
                      <tr key={`mob-${item.id}`}>
                        <td className="mobile-size-cell">
                          <strong>{item.productSize}</strong>
                        </td>
                        <td className="text-center">{item.targetQty.toLocaleString()}</td>
                        <td className="text-center" style={{ color: '#2e8b66', fontWeight: '700' }}>
                          {item.producedQty.toLocaleString()}
                        </td>
                        <td className="text-center" style={{ color: item.remainingQty > 0 ? '#b45b0b' : '#6b7a73' }}>
                          {item.remainingQty.toLocaleString()}
                        </td>
                        <td className="text-center">
                          <div className="mobile-actions">
                            <button
                              className="mobile-row-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTarget(item.id);
                              }}
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data" style={{ padding: '32px 16px', textAlign: 'center', color: '#8a9e94', fontSize: '13px', fontStyle: 'italic' }}>
                No production targets set. Please add targets using the form above.
              </div>
            )}

          </div>

          <div className="prod-table-footer">
            <div className="prod-total-info">
              <span>Item: <strong>{filteredData.length}</strong></span>
              <span className="total-target">Tgt: <strong>{totalTarget.toLocaleString()}</strong></span>
              <span className="total-produced">Prod: <strong>{totalProduced.toLocaleString()}</strong></span>
              <span className="total-balance">Bal: <strong>{totalRemaining.toLocaleString()}</strong></span>
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

        {/* Modals */}
        {showDeleteModal && (
          <div className="report-modal-overlay">
            <div className="report-modal confirm-delete-modal">
              <div className="modal-icon danger">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="report-modal-title">Delete Production Target?</h3>
              <p className="report-modal-desc">This will remove the target and all tracking data for this item. This action cannot be undone.</p>
              <div className="report-modal-actions">
                <button className="modal-btn cancel-btn" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="modal-btn delete-btn-premium" onClick={confirmDelete}>
                  Yes, Delete Target
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