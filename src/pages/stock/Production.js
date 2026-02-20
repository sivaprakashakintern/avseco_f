import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Stock.css';  // Make sure this points to your CSS file

const Production = () => {
  const navigate = useNavigate();
  
  // ========== STATE MANAGEMENT ==========
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportPeriod, setExportPeriod] = useState('daily');
  
  // Notification State
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // success, error, warning, info
  
  // Search and Filter States for Today's Production
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');
  
  // Search and Filter States for Production History
  const [historySearch, setHistorySearch] = useState('');
  const [historySizeFilter, setHistorySizeFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Form state for production entry
  const [formData, setFormData] = useState({
    product: "Areca Leaf Plate",
    size: "10\" Round",
    quantity: "",
    grade: "A",
    operator: "Rajesh"
  });

  // Today's production list
  const [todayProduction, setTodayProduction] = useState([
    { id: 1, product: "Areca Leaf Plate", size: '10" Round', quantity: 2500, grade: "A", operator: "Rajesh", time: "09:30 AM" },
    { id: 2, product: "Areca Leaf Plate", size: '8" Round', quantity: 1800, grade: "A", operator: "Priya", time: "10:15 AM" },
    { id: 3, product: "Areca Leaf Bowl", size: '6"', quantity: 1200, grade: "B", operator: "Suresh", time: "11:00 AM" },
    { id: 4, product: "Areca Leaf Plate", size: 'Square', quantity: 900, grade: "A", operator: "Rajesh", time: "02:30 PM" },
    { id: 5, product: "Areca Leaf Plate", size: '10" Round', quantity: 1500, grade: "A", operator: "Anitha", time: "03:45 PM" },
    { id: 6, product: "Areca Leaf Bowl", size: '6"', quantity: 800, grade: "B", operator: "Kumar", time: "04:20 PM" },
  ]);

  // Production history
  const [productionHistory, setProductionHistory] = useState([
    { date: "13-02-2026", product: "Areca Leaf Plate", size: '10" Round', quantity: 2500, grade: "A", operator: "Rajesh", status: "completed" },
    { date: "13-02-2026", product: "Areca Leaf Plate", size: '8" Round', quantity: 1800, grade: "A", operator: "Priya", status: "completed" },
    { date: "12-02-2026", product: "Areca Leaf Bowl", size: '6"', quantity: 1500, grade: "A", operator: "Suresh", status: "completed" },
    { date: "12-02-2026", product: "Areca Leaf Plate", size: '10" Round', quantity: 2200, grade: "B", operator: "Rajesh", status: "completed" },
    { date: "11-02-2026", product: "Areca Leaf Plate", size: 'Square', quantity: 1000, grade: "A", operator: "Priya", status: "completed" },
    { date: "10-02-2026", product: "Areca Leaf Bowl", size: '6"', quantity: 800, grade: "A", operator: "Suresh", status: "completed" },
    { date: "09-02-2026", product: "Areca Leaf Plate", size: '10" Round', quantity: 2100, grade: "A", operator: "Rajesh", status: "completed" },
    { date: "08-02-2026", product: "Areca Leaf Plate", size: 'Square', quantity: 950, grade: "C", operator: "Priya", status: "completed" },
    { date: "07-02-2026", product: "Areca Leaf Bowl", size: '6"', quantity: 1100, grade: "A", operator: "Suresh", status: "completed" },
    { date: "06-02-2026", product: "Areca Leaf Plate", size: '10" Round', quantity: 1900, grade: "B", operator: "Rajesh", status: "completed" },
    { date: "05-02-2026", product: "Areca Leaf Plate", size: '8" Round', quantity: 1700, grade: "A", operator: "Priya", status: "completed" },
    { date: "04-02-2026", product: "Areca Leaf Bowl", size: '6"', quantity: 1300, grade: "A", operator: "Kumar", status: "completed" },
  ]);

  // Stats state
  const [stats, setStats] = useState({
    today: 6400,
    week: 38200,
    month: 168000,
    stock: 45800
  });

  // ========== PRODUCT OPTIONS ==========
  const products = [
    { name: "Areca Leaf Plate", sizes: ['10" Round', '8" Round', 'Square'] },
    { name: "Areca Leaf Bowl", sizes: ['6"'] }
  ];

  const operators = ['Rajesh', 'Priya', 'Suresh', 'Anitha', 'Kumar'];
  const grades = ['A', 'B', 'C'];

  // ========== WEEKLY DATA ==========
  const weeklyData = [
    { week: "Week 1 (1-7)", quantity: 42500, percentage: 75 },
    { week: "Week 2 (8-14)", quantity: 45800, percentage: 82 },
    { week: "Week 3 (15-21)", quantity: 38200, percentage: 68 },
    { week: "Week 4 (22-28)", quantity: 41500, percentage: 74 },
  ];

  // ========== NOTIFICATION FUNCTIONS ==========
  const showNotificationMessage = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const hideNotification = () => {
    setShowNotification(false);
  };

  // ========== FILTER FUNCTIONS FOR TODAY'S PRODUCTION ==========
  const getFilteredProduction = () => {
    return todayProduction.filter(item => {
      const matchesEmployee = !employeeSearch.trim() || 
        item.operator.toLowerCase().includes(employeeSearch.toLowerCase());
      const matchesSize = sizeFilter === 'all' || item.size === sizeFilter;
      return matchesEmployee && matchesSize;
    });
  };

  const getUniqueSizes = () => {
    const sizes = todayProduction.map(item => item.size);
    return ['all', ...new Set(sizes)];
  };

  const getFilteredTotal = () => {
    return getFilteredProduction().reduce((sum, item) => sum + item.quantity, 0);
  };

  // ========== FILTER FUNCTIONS FOR PRODUCTION HISTORY ==========
  const getFilteredHistory = () => {
    return productionHistory.filter(item => {
      const matchesSearch = !historySearch.trim() || 
        item.product.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.operator.toLowerCase().includes(historySearch.toLowerCase());
      
      const matchesSize = historySizeFilter === 'all' || item.size === historySizeFilter;
      
      const matchesDate = !selectedDate || item.date === selectedDate;
      
      return matchesSearch && matchesSize && matchesDate;
    });
  };

  const getUniqueHistorySizes = () => {
    const sizes = productionHistory.map(item => item.size);
    return ['all', ...new Set(sizes)];
  };

  const getUniqueDates = () => {
    const dates = productionHistory.map(item => item.date);
    return [...new Set(dates)].sort().reverse();
  };

  // ========== EXPORT MODAL FUNCTIONS ==========
  const openExportModal = () => {
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportFormat('excel');
    setExportPeriod('daily');
  };

  const getFilteredData = () => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    
    switch(exportPeriod) {
      case 'daily':
        return productionHistory.filter(item => item.date === todayStr);
      case 'weekly':
        const last7Days = [];
        for(let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
          last7Days.push(dateStr);
        }
        return productionHistory.filter(item => last7Days.includes(item.date));
      case 'monthly':
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        return productionHistory.filter(item => {
          const [day, month, year] = item.date.split('-').map(Number);
          return month === currentMonth && year === currentYear;
        });
      case 'overall':
      default:
        return productionHistory;
    }
  };

  const getReportTitle = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    
    switch(exportPeriod) {
      case 'daily':
        return `Daily_Production_Report_${dateStr}`;
      case 'weekly':
        const weekNum = getWeekNumber(today);
        return `Weekly_Production_Report_Week_${weekNum}_${today.getFullYear()}`;
      case 'monthly':
        const monthName = today.toLocaleString('default', { month: 'long' });
        return `Monthly_Production_Report_${monthName}_${today.getFullYear()}`;
      case 'overall':
        return `Complete_Production_History_${dateStr}`;
      default:
        return `Production_Report_${dateStr}`;
    }
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handleExport = () => {
    const filteredData = getFilteredData();
    const title = getReportTitle();

    if (filteredData.length === 0) {
      showNotificationMessage('No data found for selected period!', 'error');
      return;
    }

    switch(exportFormat) {
      case 'excel':
        exportToExcel(filteredData, title);
        break;
      case 'csv':
        exportToCSV(filteredData, title);
        break;
      case 'pdf':
        exportToPDF(filteredData, title);
        break;
      default:
        exportToExcel(filteredData, title);
    }

    closeExportModal();
  };

  const exportToExcel = (data, title) => {
    try {
      const wb = XLSX.utils.book_new();
      const exportData = data.map(item => ({
        'Date': item.date,
        'Product': item.product,
        'Size': item.size,
        'Quantity': item.quantity,
        'Grade': item.grade,
        'Operator': item.operator,
        'Status': item.status
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Production Data');
      
      const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
      const summaryData = [
        { 'Metric': 'Total Records', 'Value': data.length },
        { 'Metric': 'Total Quantity', 'Value': totalQuantity + ' pcs' },
        { 'Metric': 'Report Type', 'Value': title.replace(/_/g, ' ') },
        { 'Metric': 'Generated On', 'Value': new Date().toLocaleString() }
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      const filename = `${title}.xlsx`;
      XLSX.writeFile(wb, filename);
      showNotificationMessage(`✅ Excel file downloaded: ${filename}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotificationMessage('❌ Error generating Excel file', 'error');
    }
  };

  const exportToCSV = (data, title) => {
    try {
      const headers = ['Date', 'Product', 'Size', 'Quantity', 'Grade', 'Operator', 'Status'];
      const csvRows = [];
      csvRows.push(headers.join(','));
      
      for (const item of data) {
        const values = [
          item.date,
          `"${item.product}"`,
          `"${item.size}"`,
          item.quantity,
          item.grade,
          item.operator,
          item.status
        ];
        csvRows.push(values.join(','));
      }
      
      const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
      csvRows.push('');
      csvRows.push('SUMMARY,,,,,,');
      csvRows.push(`Total Records,${data.length},,,,,`);
      csvRows.push(`Total Quantity,${totalQuantity},,,,,`);
      csvRows.push(`Generated On,${new Date().toLocaleString()},,,,,`);
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showNotificationMessage(`✅ CSV file downloaded: ${title}.csv`, 'success');
    } catch (error) {
      console.error('CSV export error:', error);
      showNotificationMessage('❌ Error generating CSV file', 'error');
    }
  };

  const exportToPDF = (data, title) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(0, 106, 78);
      doc.text(title.replace(/_/g, ' '), 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Records: ${data.length}`, 14, 28);
      
      const tableColumn = ['Date', 'Product', 'Size', 'Qty', 'Grade', 'Operator'];
      const tableRows = [];
      
      for (const item of data) {
        const rowData = [
          item.date,
          item.product.substring(0, 15) + (item.product.length > 15 ? '...' : ''),
          item.size,
          item.quantity.toString(),
          item.grade,
          item.operator
        ];
        tableRows.push(rowData);
      }
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 106, 78], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 248, 245] }
      });
      
      const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
      const finalY = doc.lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 106, 78);
      doc.text('Summary', 14, finalY);
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text(`Total Records: ${data.length}`, 14, finalY + 7);
      doc.text(`Total Quantity: ${totalQuantity} pcs`, 14, finalY + 14);
      
      doc.save(`${title}.pdf`);
      showNotificationMessage(`✅ PDF report downloaded: ${title}.pdf`, 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      showNotificationMessage('❌ Error generating PDF file', 'error');
    }
  };

  const handleNavigation = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddProduction = () => {
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      showNotificationMessage("Please enter valid quantity", 'error');
      return;
    }

    const quantity = parseInt(formData.quantity);
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newProduction = {
      id: todayProduction.length + 1,
      product: formData.product,
      size: formData.size,
      quantity: quantity,
      grade: formData.grade,
      operator: formData.operator,
      time: timeString
    };

    setTodayProduction([...todayProduction, newProduction]);

    const today = now.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).replace(/\//g, '-');

    const historyEntry = {
      date: today,
      product: formData.product,
      size: formData.size,
      quantity: quantity,
      grade: formData.grade,
      operator: formData.operator,
      status: "completed"
    };

    setProductionHistory([historyEntry, ...productionHistory]);

    setStats({
      today: stats.today + quantity,
      week: stats.week + quantity,
      month: stats.month + quantity,
      stock: stats.stock + quantity
    });

    setFormData({
      ...formData,
      quantity: ""
    });

    showNotificationMessage(
      `✅ Production added successfully!\n📦 Stock updated: +${quantity} pcs`, 
      'success'
    );
  };

  const handleRemoveProduction = (id, quantity) => {
    if (window.confirm("Remove this item from today's production?")) {
      setTodayProduction(todayProduction.filter(item => item.id !== id));
      setStats({
        ...stats,
        today: stats.today - quantity,
        week: stats.week - quantity,
        month: stats.month - quantity,
        stock: stats.stock - quantity
      });
      
      showNotificationMessage(`🗑️ Production removed: -${quantity} pcs`, 'warning');
    }
  };

  const getSizesForProduct = () => {
    const product = products.find(p => p.name === formData.product);
    return product ? product.sizes : [];
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const clearDateFilter = () => {
    setSelectedDate('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
      if (!event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const filteredProduction = getFilteredProduction();
  const filteredTotal = getFilteredTotal();
  const filteredHistory = getFilteredHistory();
  const uniqueHistorySizes = getUniqueHistorySizes();
  const uniqueDates = getUniqueDates();

  return (
    <div className="stock-page">
      {/* ===== CUSTOM NOTIFICATION POPUP ===== */}
      {showNotification && (
        <div className={`notification-popup ${notificationType}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {notificationType === 'success' && <span className="material-symbols-outlined">check_circle</span>}
              {notificationType === 'error' && <span className="material-symbols-outlined">error</span>}
              {notificationType === 'warning' && <span className="material-symbols-outlined">warning</span>}
              {notificationType === 'info' && <span className="material-symbols-outlined">info</span>}
            </div>
            <div className="notification-message">{notificationMessage}</div>
            <button className="notification-close" onClick={hideNotification}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="notification-progress"></div>
        </div>
      )}

      {/* ===== PAGE HEADER ===== */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Production Management</h1>
          <p className="page-subtitle">Track daily production and update stock automatically</p>
        </div>
        <div className="header-actions">
          <div className="dropdown-container">
            <button className="btn-outline dropdown-toggle" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span className="material-symbols-outlined">menu</span>
              View 
              <span className="material-symbols-outlined dropdown-arrow">
                {isDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => handleNavigation('/stock')}>
                  <span className="material-symbols-outlined">inventory</span>
                  <span>Stock Overview</span>
                </button>
                <button className="dropdown-item" onClick={() => handleNavigation('/stock/transfer')}>
                  <span className="material-symbols-outlined">swap_horiz</span>
                  <span>Stock Transfer</span>
                </button>
                <button className="dropdown-item" onClick={() => handleNavigation('/stock/production')}>
                  <span className="material-symbols-outlined">factory</span>
                  <span>Production</span>
                </button>
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={openExportModal}>
            <span className="material-symbols-outlined">description</span>
            Export
          </button>
        </div>
      </div>

      {/* ===== EXPORT MODAL ===== */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="export-modal">
            <div className="export-modal-header">
              <h2>Export Production Report</h2>
              <button className="modal-close" onClick={closeExportModal}>×</button>
            </div>
            
            <div className="export-modal-body">
              <p className="export-subtitle">Choose Export Format</p>
              
              <div className="export-section">
                <h3>Export Format</h3>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="exportFormat" value="excel" checked={exportFormat === 'excel'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span className="radio-custom"></span>
                    Excel File
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportFormat" value="csv" checked={exportFormat === 'csv'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span className="radio-custom"></span>
                    CSV File
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportFormat" value="pdf" checked={exportFormat === 'pdf'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span className="radio-custom"></span>
                    PDF Report
                  </label>
                </div>
              </div>
              
              <div className="export-section">
                <h3>Report Period</h3>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="daily" checked={exportPeriod === 'daily'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span className="radio-custom"></span>
                    Daily Report
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="weekly" checked={exportPeriod === 'weekly'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span className="radio-custom"></span>
                    Weekly Report
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="monthly" checked={exportPeriod === 'monthly'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span className="radio-custom"></span>
                    Monthly Report
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="overall" checked={exportPeriod === 'overall'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span className="radio-custom"></span>
                    Overall Report
                  </label>
                </div>
              </div>
              
              <p className="export-note">
                <span className="material-symbols-outlined">info</span>
                Export all production transactions with current data
              </p>
            </div>
            
            <div className="export-modal-footer">
              <button className="btn-outline" onClick={closeExportModal}>Cancel</button>
              <button className="btn-primary" onClick={handleExport}>
                <span className="material-symbols-outlined">download</span>
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCTION STATS CARDS ===== */}
      <div className="production-stats">
        <div className="production-stat-card">
          <div className="production-stat-icon green">
            <span className="material-symbols-outlined">today</span>
          </div>
          <div className="production-stat-info">
            <span className="production-stat-label">Today's Production</span>
            <span className="production-stat-value">{stats.today.toLocaleString()} pcs</span>
            <span className="production-stat-trend positive">▲ +12%</span>
          </div>
        </div>
        <div className="production-stat-card">
          <div className="production-stat-icon blue">
            <span className="material-symbols-outlined">date_range</span>
          </div>
          <div className="production-stat-info">
            <span className="production-stat-label">This Week</span>
            <span className="production-stat-value">{stats.week.toLocaleString()} pcs</span>
            <span className="production-stat-trend positive">▲ +8%</span>
          </div>
        </div>
        <div className="production-stat-card">
          <div className="production-stat-icon orange">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <div className="production-stat-info">
            <span className="production-stat-label">This Month</span>
            <span className="production-stat-value">{stats.month.toLocaleString()} pcs</span>
            <span className="production-stat-trend positive">▲ +15%</span>
          </div>
        </div>
        <div className="production-stat-card">
          <div className="production-stat-icon purple">
            <span className="material-symbols-outlined">inventory</span>
          </div>
          <div className="production-stat-info">
            <span className="production-stat-label">In Stock</span>
            <span className="production-stat-value">{stats.stock.toLocaleString()} pcs</span>
            <span className="production-stat-trend positive">In Stock</span>
          </div>
        </div>
      </div>

      {/* ===== ADD PRODUCTION FORM ===== */}
      <div className="stock-table-container production-form-card">
        <div className="table-header">
          <h3>
            <span className="material-symbols-outlined">add_circle</span>
            Add Today's Production
          </h3>
          <span className="production-date">
            📅 {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>
        
        <div className="production-form-container">
          <div className="production-form-item">
            <span className="production-form-label">Product:</span>
            <select name="product" value={formData.product} onChange={handleInputChange} className="production-select">
              {products.map(product => (
                <option key={product.name} value={product.name}>{product.name}</option>
              ))}
            </select>
          </div>

          <div className="production-form-item">
            <span className="production-form-label">Size:</span>
            <select name="size" value={formData.size} onChange={handleInputChange} className="production-select">
              {getSizesForProduct().map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="production-form-item">
            <span className="production-form-label">Quantity:</span>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="0" className="production-input" />
            <span className="production-unit">pcs</span>
          </div>

          <div className="production-form-item">
            <span className="production-form-label">Grade:</span>
            <div className="grade-options">
              {grades.map(grade => (
                <label key={grade} className="grade-option">
                  <input type="radio" name="grade" value={grade} checked={formData.grade === grade} onChange={handleInputChange} />
                  <span>{grade}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="production-form-item">
            <span className="production-form-label">Operator:</span>
            <select name="operator" value={formData.operator} onChange={handleInputChange} className="production-select">
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <button className="btn-primary production-add-btn" onClick={handleAddProduction}>
            <span className="material-symbols-outlined">add</span>
            ADD PRODUCTION
          </button>
        </div>
      </div>

      {/* ===== GLOBAL SEARCH AND FILTER SECTION FOR TODAY'S PRODUCTION ===== */}
      <div className="global-filters">
        <div className="filters-wrapper">
          <div className="global-search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search by employee name..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="global-search-input"
            />
            {employeeSearch && (
              <button className="global-clear-search" onClick={() => setEmployeeSearch('')}>
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          <div className="global-filter-select">
            <span className="material-symbols-outlined filter-icon">filter_list</span>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="global-select"
            >
              {getUniqueSizes().map(size => (
                <option key={size} value={size}>
                  {size === 'all' ? 'All Sizes' : size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== TODAY'S PRODUCTION LIST WITH TABLE HEADERS ===== */}
      <div className="stock-table-container">
        <div className="table-header">
          <h3>
            <span className="material-symbols-outlined">today</span>
            Today's Production ({new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })})
          </h3>
          <span className="records-count">
            Showing {filteredProduction.length} of {todayProduction.length} records
          </span>  
        </div>

        {/* Table Headers */}
        <div className="production-table-headers">
          <div className="header-cell time">TIME</div>
          <div className="header-cell product">PRODUCT</div>
          <div className="header-cell size">SIZE</div>
          <div className="header-cell quantity">QUANTITY</div>
          <div className="header-cell grade">GRADE</div>
          <div className="header-cell operator">OPERATOR</div>
          <div className="header-cell action">ACTION</div>
        </div>

        <div className="today-production-list">
          {filteredProduction.length > 0 ? (
            filteredProduction.map((item) => (
              <div key={item.id} className="production-row">
                <div className="row-cell time">{item.time}</div>
                <div className="row-cell product">{item.product}</div>
                <div className="row-cell size">{item.size}</div>
                <div className="row-cell quantity">{item.quantity.toLocaleString()} pcs</div>
                <div className="row-cell grade">
                  <span className={`grade-badge grade-${item.grade.toLowerCase()}`}>
                    Grade {item.grade}
                  </span>
                </div>
                <div className="row-cell operator">{item.operator}</div>
                <div className="row-cell action">
                  <button 
                    className="delete-btn"
                    onClick={() => handleRemoveProduction(item.id, item.quantity)}
                    title="Delete Record"
                  >
                    <span className="material-symbols-outlined">delete</span>
                    <span className="delete-text">Delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-records">
              No records found matching your filters
            </div>
          )}

          <div className="production-total">
            <span className="total-label">
              <span className="material-symbols-outlined">summarize</span>
              {employeeSearch ? `TOTAL FOR ${employeeSearch.toUpperCase()}:` : 'TOTAL PRODUCTION:'}
            </span>
            <span className="total-value">
              {filteredTotal.toLocaleString()} pcs
            </span>
          </div>
        </div>
      </div>

      {/* ===== MONTHLY SUMMARY ===== */}
      <div className="stock-table-container">
        <div className="table-header">
          <h3>
            <span className="material-symbols-outlined">calendar_month</span>
            February 2026 - Production Summary
          </h3>
          <span className="target">Target: 1,60,000 pcs</span>
        </div>

        <div className="monthly-summary">
          {weeklyData.map((week, index) => (
            <div key={index} className="week-item">
              <span className="week-label">{week.week}</span>
              <span className="week-value">{week.quantity.toLocaleString()} pcs</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${week.percentage}%` }}></div>
              </div>
              <span className="week-percentage">{week.percentage}%</span>
            </div>
          ))}

          <div className="month-total">
            <span className="month-total-label">
              <span className="material-symbols-outlined">bar_chart</span>
              MONTH TOTAL:
            </span>
            <div className="month-total-value">
              <span>{stats.month.toLocaleString()} pcs</span>
              <span className="achieved-badge"></span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== HISTORY FILTERS SECTION (OUTSIDE CONTAINER) ===== */}
      <div className="history-filters-section">
        <div className="history-filters-wrapper">
          <div className="history-search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search by product or operator..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="history-search-input"
            />
            {historySearch && (
              <button className="history-clear-search" onClick={() => setHistorySearch('')}>
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          <div className="history-filter-select">
            <span className="material-symbols-outlined filter-icon">filter_list</span>
            <select
              value={historySizeFilter}
              onChange={(e) => setHistorySizeFilter(e.target.value)}
              className="history-select"
            >
              {uniqueHistorySizes.map(size => (
                <option key={size} value={size}>
                  {size === 'all' ? 'All Sizes' : size}
                </option>
              ))}
            </select>
          </div>

          <div className="date-picker-container">
            <button 
              className="date-picker-btn"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <span className="material-symbols-outlined">calendar_today</span>
              {selectedDate ? selectedDate : 'Select Date'}
              {selectedDate && (
                <span className="clear-date" onClick={(e) => { e.stopPropagation(); clearDateFilter(); }}>
                  ×
                </span>
              )}
            </button>
            
            {showDatePicker && (
              <div className="date-dropdown">
                <div className="date-dropdown-header">
                  <span>Select Date</span>
                  <button onClick={() => setShowDatePicker(false)}>×</button>
                </div>
                <div className="date-list">
                  <div 
                    className={`date-item ${!selectedDate ? 'active' : ''}`}
                    onClick={() => handleDateSelect('')}
                  >
                    All Dates
                  </div>
                  {uniqueDates.map(date => (
                    <div 
                      key={date}
                      className={`date-item ${selectedDate === date ? 'active' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      {date}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== PRODUCTION HISTORY TABLE ===== */}
      <div className="stock-table-container production-table-container">
        <div className="table-header">
          <h3>
            <span className="material-symbols-outlined">history</span>
            Production History
          </h3>
        </div>

        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>PRODUCT</th>
                <th>SIZE</th>
                <th>QUANTITY</th>
                <th>GRADE</th>
                <th>OPERATOR</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td>
                      <div className="product-info">
                        <div className="product-icon">
                          <span className="material-symbols-outlined">production_quantity_limits</span>
                        </div>
                        <span className="product-name">{item.product}</span>
                      </div>
                    </td>
                    <td>{item.size}</td>
                    <td className="quantity-cell">{item.quantity.toLocaleString()} pcs</td>
                    <td>
                      <span className={`production-item-badge grade-${item.grade.toLowerCase()}`}>
                        Grade {item.grade}
                      </span>
                    </td>
                    <td>{item.operator}</td>
                    <td>
                      <span className="production-badge completed">
                        ✓ Completed
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-records">
                    No records found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="table-footer">
          <div className="pagination-info">
            Showing {filteredHistory.length} of {productionHistory.length} production records
          </div>
          {selectedDate && (
            <div className="active-filter">
              Filtering by: <strong>{selectedDate}</strong>
              <button onClick={clearDateFilter} className="clear-filter">Clear</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Production;