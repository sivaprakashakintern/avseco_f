import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils.js';
import { useAppContext } from '../../context/AppContext.js';
import { productionTargetApi, notificationApi } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import dayjs from 'dayjs';
import './ProductionPlan.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';




const today = formatDate(new Date());

const ProductionPlan = ({ onNavigate, currentPage }) => {

  const { 
    products: dbProducts, 
    productionTargets, 
    productionHistory,
    fetchTargets, 
    saveProductionTarget,
    deleteProductionTarget
  } = useAppContext();
  const { isAdmin } = useAuth();

  
  // ===== TARGET ENTRY FORM STATE =====
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [targetQty, setTargetQty] = useState('');
  const [targetType, setTargetType] = useState('daily'); // 'daily' or 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));


  


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
    
    return unique.map(p => {
      const sizes = (dbProducts || [])
        .filter(dp => dp.name === p.name)
        .map(dp => dp.size);
      
      const uniqueSizes = [...new Set(sizes)].sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numA - numB;
      });

      return { ...p, sizes: uniqueSizes };
    });
  }, [dbProducts]);

  useEffect(() => {
    if (uniqueProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(uniqueProducts[0].id || uniqueProducts[0].name);
    }
  }, [uniqueProducts, selectedProduct]);

  // ===== DYNAMIC SIZES FOR SELECTED PRODUCT =====
  const availableSizes = React.useMemo(() => {
    if (!selectedProduct) return [];
    
    // Find the product object that matches the selectedProduct ID or name
    const product = uniqueProducts.find(p => p.id === selectedProduct || p.name === selectedProduct);
    const productSizes = product ? product.sizes : [];

    if (targetType === 'monthly') {
      return ['All Sizes', ...productSizes];
    }
    return productSizes;
  }, [selectedProduct, uniqueProducts, targetType]);

  useEffect(() => {
    if (targetType === 'monthly') {
      setSelectedSize('All Sizes');
    } else {
      setSelectedSize('');
    }
  }, [targetType]);

  // ===== AUTO-FETCH / CARRY OVER TARGET LOGIC =====
  useEffect(() => {
    if (!selectedProduct || !selectedSize || !productionTargets) {
      setTargetQty('');
      return;
    }

    const productObj = uniqueProducts.find(p => p.id === selectedProduct || p.name === selectedProduct);
    const productName = productObj ? productObj.name : '';
    const targetDateStr = targetType === 'daily' ? today : selectedMonth;

    // 1. Check if a target already exists for THIS date
    const existingTargetNow = productionTargets.find(t => 
      t.productName === productName && 
      t.productSize === selectedSize &&
      t.date === targetDateStr
    );

    // POINT 1: If it already exists, clear input so user can add extra quantity (additive logic)
    if (existingTargetNow) {
      setTargetQty('');
      return;
    }

    // POINT 2: For daily targets, if no target exists yet, carry over balance from yesterday
    if (targetType === 'daily') {
      const yesterday = dayjs().subtract(1, 'day').format('DD-MM-YYYY');
      const yesterdayTarget = (productionTargets || []).find(t => 
        t.productName === productName && 
        t.productSize === selectedSize &&
        t.date === yesterday
      );

      if (yesterdayTarget) {
        // Calculate what was actually produced yesterday
        const relevantHistory = (productionHistory || []).filter(h => {
          if (h.product !== productName) return false;
          if (h.size !== selectedSize) return false;
          if (!h.date) return false;
          const parts = h.date.split('-');
          const hDate = parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : h.date;
          return hDate === yesterday;
        });

        const producedYesterday = relevantHistory.reduce((sum, h) => sum + (h.quantity || 0), 0);
        const balance = Math.max(0, (Number(yesterdayTarget.targetQty) || 0) - producedYesterday);

        if (balance > 0) {
          setTargetQty(String(balance));
          return;
        }
      }
    }

    setTargetQty('');
  }, [selectedProduct, selectedSize, productionTargets, uniqueProducts, targetType, selectedMonth, productionHistory]);



  // ===== PRODUCTION DATA STATE =====
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Custom Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
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
    setSelectedSize(''); // Reset size when product changes
    setTargetQty(''); // Reset target quantity
  };







  // Existing helpers...
  const getProductDetailsForSize = (size) => {
    const productObj = uniqueProducts.find(p => p.id === selectedProduct || p.name === selectedProduct);
    const productName = productObj ? productObj.name : '';
    if (size === 'All Sizes') {
      return dbProducts.find(p => p.name === productName);
    }
    return dbProducts.find(p => p.name === productName && p.size === size);
  };

  const handleSendReminder = async (item, produced, remaining) => {
    try {
      await notificationApi.sendPush({
        title: "Production Nudge",
        message: `Status for ${item.productSize}: ${produced.toLocaleString()} / ${(produced + remaining).toLocaleString()} pieces produced. Please focus on completing this target.`,
        targetAudience: "All Employees"
      });
      showToast("Operators nudged successfully!");
    } catch (err) {
      showToast("Failed to send nudge", "error");
    }
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
        showToast('Product definition not found. Please try again.', 'error');
        return;
    }

    const isMonthly = targetType === 'monthly';
    const targetQuantity = parseInt(targetQty);
    
    // ADDITIVE LOGIC: If target already exists, add to it
    const existingTarget = (productionTargets || []).find(t => 
      t.productName === product.name && 
      t.productSize === (isMonthly ? 'All Sizes' : product.size) && 
      t.date === (isMonthly ? selectedMonth : today)
    );

    const finalTargetQty = existingTarget ? (Number(existingTarget.targetQty) + targetQuantity) : targetQuantity;

    // VALIDATION: New target cannot be less than already produced quantity
    const targetDate = isMonthly ? selectedMonth : today;
    const prodHistory = (productionHistory || []).filter(h => {
        if (h.product !== product.name) return false;
        if (!isMonthly && h.size !== product.size) return false;
        
        const hDate = h.date;
        if (!hDate) return false;
        const parts = hDate.split('-');
        if (isMonthly) {
            const hMonth = parts[0].length === 4 ? `${parts[0]}-${parts[1]}` : `${parts[2]}-${parts[1]}`;
            return hMonth === targetDate;
        } else {
            const formattedHDate = parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : hDate;
            return formattedHDate === targetDate;
        }
    });
    const alreadyProduced = prodHistory.reduce((sum, h) => sum + (h.quantity || 0), 0);

    if (finalTargetQty < alreadyProduced) {
      showToast(`Already produced ${alreadyProduced} pcs. Give a target higher than this!`, 'error');
      return;
    }

    const targetPayload = {
      productName: product.name,
      sku: product.hsn || product.sku,
      productSize: isMonthly ? 'All Sizes' : product.size,
      targetQty: finalTargetQty,
      remainingQty: Math.max(0, finalTargetQty - alreadyProduced),
      status: finalTargetQty <= alreadyProduced ? 'completed' : 'pending',
      unit: 'Pieces',
      size: isMonthly ? 'All Sizes' : product.size,
      date: isMonthly ? selectedMonth : today,
      targetType: targetType
    };

    try {
      // Use localized save function for instant UI update
      await saveProductionTarget(targetPayload);
      showToast(`Target saved for ${selectedSize} Areca Plate`, 'success');
      
      // Clear form for next entry while keeping product selected
      setSelectedSize('');
      setTargetQty('');
    } catch (err) {
      console.error("Error saving target:", err);
      showToast("Failed to save target to database", 'error');
    }
  };



  // ===== HANDLE CLEAR ALL DATA =====
  const handleClearAllData = async () => {
    setShowClearModal(true);
  };

  const confirmClearAll = async () => {
    try {
      setLoading(true);
      await productionTargetApi.clearAll();
      await fetchTargets();
      showToast('All production targets cleared successfully', 'success');
      setShowClearModal(false);
    } catch (err) {
      console.error("Error clearing data:", err);
      showToast("Failed to clear data from server", 'error');
    } finally {
      setLoading(false);
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
      await deleteProductionTarget(itemToDelete);
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





  // ===== FILTERED & SORTED DATA =====
  const filteredData = (productionTargets || []).filter(item => {
    const productName = item.productName || '';
    const productSize = item.productSize || '';
    const sku = item.sku || '';

    const matchesSearch = (productName?.toLowerCase() || "").includes(searchTerm?.toLowerCase() || "") ||
      (productSize?.toLowerCase() || "").includes(searchTerm?.toLowerCase() || "") ||
      (sku?.toLowerCase() || "").includes(searchTerm?.toLowerCase() || "");
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // 1. "All Sizes" targets always go to the bottom
    const aIsAll = a.productSize === 'All Sizes';
    const bIsAll = b.productSize === 'All Sizes';
    if (aIsAll && !bIsAll) return 1;
    if (!aIsAll && bIsAll) return -1;
    
    // 2. Otherwise sort by numeric size ascending
    const aSize = parseInt(a.productSize) || 0;
    const bSize = parseInt(b.productSize) || 0;
    if (aSize !== bSize) return aSize - bSize;
    
    // 3. Last fallback: product name
    return (a.productName || '').localeCompare(b.productName || '');
  });

  // Calculate totals
  const totalTarget = filteredData.reduce((sum, item) => sum + (item.targetQty || 0), 0);
  const totalProduced = filteredData.reduce((sum, item) => sum + (item.producedQty || 0), 0);
  const totalRemaining = filteredData.reduce((sum, item) => sum + (item.remainingQty || 0), 0);
  const overallProgress = totalTarget > 0 ? ((totalProduced / totalTarget) * 100).toFixed(1) : "0";

  if (toast.show) {
    // Return Toast UI inside the render
  }


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
    <div className="premium-dashboard-main-new">
      <div className="premium-dashboard-container-new">
        
        {/* PREMIUM HEADER SECTION */}
        <div className="premium-header-new">
          <div className="header-left-new">
            <h1 className="header-title-mini">Production Plan</h1>
          </div>

          <div className="header-actions-new">
            {/* Unified Daily/Monthly Toggle moved to Action side */}
            <div className="header-toggle-group-new">
              <button 
                className={`header-toggle-btn-new ${targetType === 'daily' ? 'active' : ''}`}
                onClick={() => setTargetType('daily')}
              >
                Daily
              </button>
              <button 
                className={`header-toggle-btn-new ${targetType === 'monthly' ? 'active' : ''}`}
                onClick={() => setTargetType('monthly')}
              >
                Monthly
              </button>
            </div>

            {targetType === 'daily' ? (
              <div className="premium-date-display-new">
                <span className="material-symbols-outlined">calendar_today</span>
                <span>{today}</span>
              </div>
            ) : (
              <div className="month-picker-wrapper-new">
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="premium-month-select-new"
                />
              </div>
            )}
          </div>
        </div>

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="premium-loading-overlay-new">
            <div className="premium-spinner-new"></div>
            <span>Syncing with database...</span>
          </div>
        )}

        {/* TARGET ENTRY FORM - ONE LINE PREMIUM CARD */}
        <div className="premium-card-new target-entry-card-new">
          <div className="premium-form-row-new">
            {/* Product Selection */}
            <div className="form-group-new">
              <label className="premium-label-new">Product Name</label>
              <div className="select-wrapper-new">
                <span className="material-symbols-outlined input-icon-new">inventory_2</span>
                <select 
                  className="premium-select-new"
                  value={selectedProduct}
                  onChange={handleProductChange}
                >
                  {uniqueProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Size Selection */}
            <div className="form-group-new">
              <label className="premium-label-new">Size / Dimensions</label>
              <div className="select-wrapper-new">
                <span className="material-symbols-outlined input-icon-new">straighten</span>
                <select 
                  className="premium-select-new"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="" disabled>Select Size...</option>
                  {availableSizes.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Quantity */}
            <div className="form-group-new">
              <label className="premium-label-new">Target Quantity (Pcs)</label>
              <div className="select-wrapper-new">
                <span className="material-symbols-outlined input-icon-new">track_changes</span>
                <input 
                  type="number"
                  className="premium-input-new"
                  placeholder="Enter target..."
                  value={targetQty}
                  onChange={(e) => setTargetQty(e.target.value)}
                />
              </div>
            </div>

            {/* Add Button */}
            <div className="form-group-new btn-container-new">
              <button 
                className="premium-submit-btn-new"
                onClick={handleAddTarget}
              >
                <span className="material-symbols-outlined">add_task</span>
                Add / Update Target
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH & GLOBAL ACTIONS */}
        <div className="table-controls-row-new">
          <div className="search-group-new">
            <span className="material-symbols-outlined search-icon-new">search</span>
            <input 
              type="text" 
              className="premium-search-input-new"
              placeholder="Search by size or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="global-actions-new">
            <div className="status-filter-wrapper-new">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="premium-filter-select-new"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {productionTargets.length > 0 && (
              <button className="premium-clear-btn-new" onClick={handleClearAllData}>
                <span className="material-symbols-outlined">delete_sweep</span>
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* PRODUCTION ITEMS TABLE CARD */}
        <div className="premium-card-new table-card-new">
          <div className="premium-table-header-new">
            <div className="header-left">
              <span className="material-symbols-outlined header-icon">format_list_bulleted</span>
              <h3>Production Items by Size ({filteredData.length})</h3>
            </div>
            <button className="premium-export-btn-new" onClick={handleExportClick}>
              <span className="material-symbols-outlined">download</span>
              Export Report
            </button>
          </div>

          <div className="premium-table-wrapper-new">
            <table className="premium-data-table-new">
              <thead>
                <tr>
                  <th className="hide-mobile">Product</th>
                  <th>Size</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Produced</th>
                  <th className="text-right">Balance</th>
                  <th className="hide-mobile">Progress</th>
                  <th className="hide-mobile">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map(item => {
                    // Recalculate producedQty locally
                    let displayProduced = 0;
                    let displayTarget = item.targetQty || 0;
                    const targetDate = item.date;
                    
                    const relevantHistory = (productionHistory || []).filter(h => {
                       if (h.product !== item.productName) return false;
                       const isAllSizes = item.productSize === 'All Sizes';
                       if (!isAllSizes && h.size !== item.productSize) return false;
                       
                       const hDate = h.date;
                       if (!hDate) return false;
                       const parts = hDate.split('-');
                       if (targetDate.length === 7) { 
                         const hMonth = parts[0].length === 4 ? `${parts[0]}-${parts[1]}` : `${parts[2]}-${parts[1]}`;
                         return hMonth === targetDate;
                       } else {
                         const formattedHDate = parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : hDate;
                         return formattedHDate === targetDate;
                       }
                    });

                    displayProduced = relevantHistory.reduce((sum, h) => sum + (h.quantity || 0), 0);
                    const displayRemaining = Math.max(0, displayTarget - displayProduced);
                    const progress = displayTarget > 0 ? Math.min(100, (displayProduced / displayTarget) * 100).toFixed(1) : "0";
                    const statusClass = progress >= 100 ? 'status-completed' : (progress > 0 ? 'status-progress' : 'status-pending');
                    const isMasterRow = item.productSize === 'All Sizes';

                    return (
                      <tr key={item.id} className={isMasterRow ? 'master-row-new' : ''}>
                        <td className="hide-mobile">
                          <span className="product-text-new">{isMasterRow ? 'MASTER TOTAL' : item.productName}</span>
                        </td>
                        <td>
                          <div className="size-badge-new">
                            {isMasterRow && <span className="material-symbols-outlined master-star">stars</span>}
                            {item.productSize}
                          </div>
                        </td>
                        <td className="text-right font-bold">{displayTarget.toLocaleString()}</td>
                        <td className="text-right text-success-new font-bold">{displayProduced.toLocaleString()}</td>
                        <td className="text-right text-warning-new font-bold">{displayRemaining.toLocaleString()}</td>
                        <td className="hide-mobile">
                          <div className="progress-container-new">
                            <div className="progress-bar-new">
                              <div className="progress-fill-new" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="progress-text-new">{progress}%</span>
                          </div>
                        </td>
                        <td className="hide-mobile">
                          <div className={`status-tag-new ${statusClass}`}>
                            <span className="status-dot-new"></span>
                            {statusClass === 'status-completed' ? 'Completed' : 
                             statusClass === 'status-progress' ? 'In Progress' : 'Pending'}
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="action-btns-new">
                            {isAdmin && displayRemaining > 0 && (
                              <button 
                                className="remind-btn-new" 
                                title="Send Reminder"
                                onClick={() => handleSendReminder(item, displayProduced, displayRemaining)}
                              >
                                <span className="material-symbols-outlined">campaign</span>
                              </button>
                            )}
                            <button className="delete-btn-new" onClick={() => handleDeleteTarget(item.id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-table-new">No production items scheduled for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW (Responsive Replacement) */}
          <div className="mobile-cards-container-new">
            {filteredData.map(item => {
               // Reuse history logic for mobile
               let displayProduced = 0;
               const targetDate = item.date;
               const relevantHistory = (productionHistory || []).filter(h => {
                  if (h.product !== item.productName) return false;
                  const isAllSizes = item.productSize === 'All Sizes';
                  if (!isAllSizes && h.size !== item.productSize) return false;
                  const hDate = h.date;
                  if (!hDate) return false;
                  const parts = hDate.split('-');
                  if (targetDate.length === 7) { 
                    const hMonth = parts[0].length === 4 ? `${parts[0]}-${parts[1]}` : `${parts[2]}-${parts[1]}`;
                    return hMonth === targetDate;
                  } else {
                    const formattedHDate = parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : hDate;
                    return formattedHDate === targetDate;
                  }
               });
               displayProduced = relevantHistory.reduce((sum, h) => sum + (h.quantity || 0), 0);
               const displayRemaining = Math.max(0, item.targetQty - displayProduced);
               const isMaster = item.productSize === 'All Sizes';

               return (
                 <div key={`m-${item.id}`} className={`mobile-row-card-new ${isMaster ? 'master' : ''}`}>
                    <div className="card-header-mob">
                      <span className="mob-size">{item.productSize}</span>
                      <button className="mob-delete" onClick={() => handleDeleteTarget(item.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <div className="card-stats-grid-mob">
                      <div className="stat-item">
                        <span className="stat-label">Target</span>
                        <span className="stat-value">{item.targetQty.toLocaleString()}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Prod</span>
                        <span className="stat-value text-success">{displayProduced.toLocaleString()}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Balance</span>
                        <span className="stat-value text-warning">{displayRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                 </div>
               );
            })}
          </div>
        </div>

        {/* MODAL SYSTEM */}
        {showExportOptions && (
          <div className="modal-overlay">
            <div className="modal-content export-modal">
              <div className="modal-header">
                <h3>Export Planning Report</h3>
                <button className="modal-close" onClick={closeExportOptions}>×</button>
              </div>
              <div className="modal-body export-body-premium">
                <div className="export-section-new">
                  <label className="section-label-new">REPORT TYPE</label>
                  <div className="premium-radio-group-new">
                    <label className={`radio-card-new ${selectedReportType === 'size-wise' ? 'active' : ''}`}>
                      <input type="radio" value="size-wise" checked={selectedReportType === 'size-wise'} onChange={(e) => setSelectedReportType(e.target.value)} />
                      <span className="material-symbols-outlined">analytics</span>
                      <div className="radio-info">
                        <strong>Size-Wise</strong>
                        <span>Detailed breakdown</span>
                      </div>
                    </label>
                    <label className={`radio-card-new ${selectedReportType === 'overall' ? 'active' : ''}`}>
                      <input type="radio" value="overall" checked={selectedReportType === 'overall'} onChange={(e) => setSelectedReportType(e.target.value)} />
                      <span className="material-symbols-outlined">summarize</span>
                      <div className="radio-info">
                        <strong>Overall</strong>
                        <span>Consolidated summary</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="export-section-new">
                  <label className="section-label-new">SELECT FORMAT</label>
                  <div className="format-grid-new">
                    {['excel', 'pdf', 'csv'].map(fmt => (
                      <button 
                        key={fmt} 
                        className={`format-tile-new ${selectedFormat === fmt ? 'active' : ''}`}
                        onClick={() => setSelectedFormat(fmt)}
                      >
                        <span className="material-symbols-outlined">
                          {fmt === 'excel' ? 'table_chart' : fmt === 'pdf' ? 'picture_as_pdf' : 'data_table'}
                        </span>
                        <span>{fmt.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel" onClick={closeExportOptions}>Cancel</button>
                <button className="modal-confirm" onClick={handleGenerateExport}>Generate Report</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-body">
                <div className="modal-icon warning">
                  <span className="material-symbols-outlined">delete_forever</span>
                </div>
                <h3 className="modal-title">Delete Target?</h3>
                <p className="modal-desc">Are you sure you want to remove this target? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="modal-confirm delete" onClick={confirmDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {showClearModal && (
          <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-body">
                <div className="modal-icon warning">
                  <span className="material-symbols-outlined">notification_important</span>
                </div>
                <h3 className="modal-title">Clear All Targets?</h3>
                <p className="modal-desc">This will reset <strong>ALL</strong> production targets. This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel" onClick={() => setShowClearModal(false)}>Cancel</button>
                <button className="modal-confirm delete" onClick={confirmClearAll}>Clear All Now</button>
              </div>
            </div>
          </div>
        )}

        {toast.show && (
          <div className={`premium-toast-new ${toast.type}`}>
            <span className="material-symbols-outlined">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductionPlan;