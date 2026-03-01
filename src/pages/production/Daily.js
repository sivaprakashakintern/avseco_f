import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import './Daily.css';

const AVAILABLE_SIZES = ['6-inch', '8-inch', '10-inch', '12-inch'];

const Production = () => {
  const navigate = useNavigate();

  // ========== STATE MANAGEMENT ==========
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportPeriod, setExportPeriod] = useState('daily');

  // Date range states for export
  const [exportStartDate, setExportStartDate] = useState(null);
  const [exportEndDate, setExportEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Notification State
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  // Search and Filter States for Production History
  const [historySearch, setHistorySearch] = useState('');
  const [historySizeFilter, setHistorySizeFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Summary view state
  const [summaryView, setSummaryView] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [summaryDate, setSummaryDate] = useState(dayjs());
  const [showSummaryDatePicker, setShowSummaryDatePicker] = useState(false);

  // Date selection for adding production
  const [productionDate, setProductionDate] = useState(dayjs());
  const [showProductionDatePicker, setShowProductionDatePicker] = useState(false);

  // Form state for production entry
  const [formData, setFormData] = useState({
    product: "Areca Leaf Plate",
    size: "6-inch",
    quantity: "",
    grade: "A",
    operator: "Rajesh"
  });

  // Production history - Start with empty array
  const [productionHistory, setProductionHistory] = useState([]);

  // Stats state - Initialize with zeros
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    stock: 0,
    todayBySize: {},
    weekBySize: {},
    monthBySize: {}
  });

  // ========== HELPER FUNCTIONS ==========
  const formatDate = (date) => {
    if (!date) return '';
    return date.format('DD-MM-YYYY');
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    return dayjs(dateStr, 'DD-MM-YYYY');
  };

  // ========== CALCULATE STATS FUNCTION ==========
  const calculateStats = useCallback((data) => {
    const today = formatDate(dayjs());

    // Today's totals by size
    const todayData = data.filter(item => item.date === today);
    const todayTotal = todayData.reduce((sum, item) => sum + item.quantity, 0);

    const todayBySize = {};
    AVAILABLE_SIZES.forEach(size => {
      todayBySize[size] = todayData
        .filter(item => item.size === size)
        .reduce((sum, item) => sum + item.quantity, 0);
    });

    // Calculate current week (last 7 days)
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, 'day');
      last7Days.push(formatDate(date));
    }

    const weekData = data.filter(item => last7Days.includes(item.date));
    const weekTotal = weekData.reduce((sum, item) => sum + item.quantity, 0);

    const weekBySize = {};
    AVAILABLE_SIZES.forEach(size => {
      weekBySize[size] = weekData
        .filter(item => item.size === size)
        .reduce((sum, item) => sum + item.quantity, 0);
    });

    // Calculate current month
    const currentMonth = dayjs().month() + 1;
    const currentYear = dayjs().year();
    const monthData = data.filter(item => {
      const [, month, year] = item.date.split('-').map(Number);
      return month === currentMonth && year === currentYear;
    });

    const monthTotal = monthData.reduce((sum, item) => sum + item.quantity, 0);

    const monthBySize = {};
    AVAILABLE_SIZES.forEach(size => {
      monthBySize[size] = monthData
        .filter(item => item.size === size)
        .reduce((sum, item) => sum + item.quantity, 0);
    });

    // Calculate total stock (all time production)
    const stockTotal = data.reduce((sum, item) => sum + item.quantity, 0);

    setStats({
      today: todayTotal,
      week: weekTotal,
      month: monthTotal,
      stock: stockTotal,
      todayBySize,
      weekBySize,
      monthBySize
    });
  }, [AVAILABLE_SIZES]);

  // ========== LOAD DATA FROM LOCALSTORAGE ON INITIAL RENDER ==========
  useEffect(() => {
    const savedData = localStorage.getItem('productionHistory');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setProductionHistory(parsedData);

      // Calculate stats from loaded data
      calculateStats(parsedData);
    }
  }, [calculateStats]);

  // ========== SAVE TO LOCALSTORAGE WHENEVER PRODUCTION HISTORY CHANGES ==========
  useEffect(() => {
    if (productionHistory.length > 0) {
      localStorage.setItem('productionHistory', JSON.stringify(productionHistory));
    } else {
      localStorage.removeItem('productionHistory');
    }
  }, [productionHistory]);

  // ========== GET SUMMARY DATA BY SIZE FOR SELECTED VIEW ==========
  const getSummaryData = () => {
    let filteredData = [];

    switch (summaryView) {
      case 'daily':
        filteredData = productionHistory.filter(item => item.date === formatDate(summaryDate));
        break;

      case 'weekly':
        if (!summaryDate) return { data: [], total: 0, bySize: {} };

        const weekStart = summaryDate.startOf('week');
        const weekEnd = summaryDate.endOf('week');

        filteredData = productionHistory.filter(item => {
          const itemDate = parseDate(item.date);
          return itemDate && itemDate >= weekStart && itemDate <= weekEnd;
        });
        break;

      case 'monthly':
        if (!summaryDate) return { data: [], total: 0, bySize: {} };

        const month = summaryDate.month() + 1;
        const year = summaryDate.year();

        filteredData = productionHistory.filter(item => {
          const [, itemMonth, itemYear] = item.date.split('-').map(Number);
          return itemMonth === month && itemYear === year;
        });
        break;

      default:
        return { data: [], total: 0, bySize: {} };
    }

    // Calculate totals by size
    const bySize = {};
    let total = 0;

    AVAILABLE_SIZES.forEach(size => {
      const sizeTotal = filteredData
        .filter(item => item.size === size)
        .reduce((sum, item) => sum + item.quantity, 0);
      bySize[size] = sizeTotal;
      total += sizeTotal;
    });

    // Group by date for weekly/monthly view
    const groupedByDate = {};
    filteredData.forEach(item => {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = {
          date: item.date,
          total: 0,
          bySize: {}
        };
      }
      groupedByDate[item.date].total += item.quantity;
      groupedByDate[item.date].bySize[item.size] = (groupedByDate[item.date].bySize[item.size] || 0) + item.quantity;
    });

    const dailyBreakdown = Object.values(groupedByDate).sort((a, b) =>
      parseDate(b.date) - parseDate(a.date)
    );

    return {
      data: dailyBreakdown,
      rawData: filteredData,
      total,
      bySize
    };
  };

  // ========== PRODUCT OPTIONS ===== =====
  const products = [
    { name: "Areca Leaf Plate", sizes: ['6-inch', '8-inch', '10-inch', '12-inch'] },
  ];

  const operators = ['Rajesh', 'Priya', 'Suresh', 'Anitha', 'Kumar'];
  const grades = ['A', 'B', 'C'];

  // ========== NOTIFICATION FUNCTIONS ==========
  const showNotificationMessage = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const hideNotification = () => {
    setShowNotification(false);
  };

  // ========== FILTER FUNCTIONS FOR PRODUCTION HISTORY ==========
  const getFilteredHistory = () => {
    return productionHistory.filter(item => {
      const matchesSearch = !historySearch.trim() ||
        item.product.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.operator.toLowerCase().includes(historySearch.toLowerCase());

      const matchesSize = historySizeFilter === 'all' || item.size === historySizeFilter;
      const matchesDate = !selectedDate || item.date === formatDate(selectedDate);

      return matchesSearch && matchesSize && matchesDate;
    });
  };

  const getUniqueHistorySizes = () => {
    const sizes = productionHistory.map(item => item.size);
    return ['all', ...new Set(sizes)];
  };

  // ========== EXPORT MODAL FUNCTIONS ==========
  const openExportModal = () => {
    // Set default dates
    const today = dayjs();
    setExportStartDate(today);
    setExportEndDate(today);
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportFormat('excel');
    setExportPeriod('daily');
    setExportStartDate(null);
    setExportEndDate(null);
    setExportYear(new Date().getFullYear().toString());
  };

  const handleExportDateSelect = (type, date) => {
    if (type === 'start') {
      setExportStartDate(date);
      setShowStartDatePicker(false);
    } else if (type === 'end') {
      setExportEndDate(date);
      setShowEndDatePicker(false);
    }
  };

  const handleYearSelect = (year) => {
    setExportYear(year);
    setShowYearPicker(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleProductionDateSelect = (date) => {
    setProductionDate(date);
    setShowProductionDatePicker(false);
  };

  const handleSummaryDateSelect = (date) => {
    setSummaryDate(date);
    setShowSummaryDatePicker(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const getFilteredDataForExport = () => {
    switch (exportPeriod) {
      case 'daily':
        return productionHistory.filter(item => item.date === formatDate(exportStartDate));

      case 'weekly':
        if (!exportStartDate || !exportEndDate) return [];

        return productionHistory.filter(item => {
          const itemDate = parseDate(item.date);
          return itemDate >= exportStartDate && itemDate <= exportEndDate;
        });

      case 'monthly':
        if (!exportStartDate || !exportEndDate) return [];

        return productionHistory.filter(item => {
          const [, month, year] = item.date.split('-').map(Number);
          const itemYearMonth = year * 100 + month;
          const startYearMonth = exportStartDate.year() * 100 + (exportStartDate.month() + 1);
          const endYearMonth = exportEndDate.year() * 100 + (exportEndDate.month() + 1);
          return itemYearMonth >= startYearMonth && itemYearMonth <= endYearMonth;
        });

      case 'yearly':
        return productionHistory.filter(item => {
          const [, , year] = item.date.split('-').map(Number);
          return year.toString() === exportYear;
        });

      case 'overall':
      default:
        return productionHistory;
    }
  };

  const getReportTitle = () => {
    const today = formatDate(dayjs());

    switch (exportPeriod) {
      case 'daily':
        return `Daily_Production_Report_${formatDate(exportStartDate)}`;
      case 'weekly':
        return `Weekly_Production_Report_${formatDate(exportStartDate)}_to_${formatDate(exportEndDate)}`;
      case 'monthly':
        return `Monthly_Production_Report_${formatDate(exportStartDate)}_to_${formatDate(exportEndDate)}`;
      case 'yearly':
        return `Yearly_Production_Report_${exportYear}`;
      case 'overall':
        return `Complete_Production_History_${today}`;
      default:
        return `Production_Report_${today}`;
    }
  };

  const handleExport = () => {
    const filteredData = getFilteredDataForExport();
    const title = getReportTitle();

    if (filteredData.length === 0) {
      showNotificationMessage('No data found for selected period!', 'error');
      return;
    }

    switch (exportFormat) {
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
        'Time': item.time,
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
        { 'Metric': 'Total Quantity', 'Value': totalQuantity + ' plates' },
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
      const headers = ['Date', 'Time', 'Product', 'Size', 'Quantity', 'Grade', 'Operator', 'Status'];
      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const item of data) {
        const values = [
          item.date,
          item.time,
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
      csvRows.push('SUMMARY,,,,,,,');
      csvRows.push(`Total Records,${data.length},,,,,,`);
      csvRows.push(`Total Quantity,${totalQuantity} plates,,,,,,`);
      csvRows.push(`Generated On,${new Date().toLocaleString()},,,,,,`);

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

      const tableColumn = ['Date', 'Time', 'Product', 'Size', 'Qty', 'Grade', 'Operator'];
      const tableRows = [];

      for (const item of data) {
        const rowData = [
          item.date,
          item.time,
          item.product.substring(0, 12) + (item.product.length > 12 ? '...' : ''),
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
      doc.text(`Total Quantity: ${totalQuantity} plates`, 14, finalY + 14);

      doc.save(`${title}.pdf`);
      showNotificationMessage(`✅ PDF report downloaded: ${title}.pdf`, 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      showNotificationMessage('❌ Error generating PDF file', 'error');
    }
  };

  const handleNavigation = (path) => {
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
    const now = dayjs();
    const timeString = now.format('hh:mm A');

    // Create new production record with unique ID
    const newProduction = {
      id: productionHistory.length > 0 ? Math.max(...productionHistory.map(item => item.id)) + 1 : 1,
      date: formatDate(productionDate),
      product: formData.product,
      size: formData.size,
      quantity: quantity,
      grade: formData.grade,
      operator: formData.operator,
      time: timeString,
      status: "completed"
    };

    // Add to production history
    const updatedHistory = [newProduction, ...productionHistory];
    setProductionHistory(updatedHistory);

    // Recalculate all stats
    calculateStats(updatedHistory);

    // Reset form
    setFormData({
      ...formData,
      quantity: ""
    });

    showNotificationMessage(
      `✅ Production added for ${formatDate(productionDate)}! 📦 +${quantity} plates (${formData.size})`,
      'success'
    );
  };

  // ========== DELETE FUNCTION ==========
  const handleDeleteProduction = (id) => {
    if (window.confirm("Are you sure you want to delete this production record?")) {
      // Remove from production history
      const updatedHistory = productionHistory.filter(item => item.id !== id);
      setProductionHistory(updatedHistory);

      // Recalculate all stats
      calculateStats(updatedHistory);

      showNotificationMessage(`🗑️ Production record deleted successfully`, 'warning');
    }
  };

  const getSizesForProduct = () => {
    const product = products.find(p => p.name === formData.product);
    return product ? product.sizes : [];
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
        setShowProductionDatePicker(false);
        setShowSummaryDatePicker(false);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
        setShowYearPicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const filteredHistory = getFilteredHistory();
  const uniqueHistorySizes = getUniqueHistorySizes();
  const summaryData = getSummaryData();

  // Calendar component wrapper
  const CalendarPicker = ({ selectedDate, onDateChange, onClose }) => (
    <div className="calendar-wrapper">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar
          value={selectedDate}
          onChange={(newDate) => {
            onDateChange(newDate);
            onClose();
          }}
        />
      </LocalizationProvider>
    </div>
  );

  return (
    <div className="daily-production-page">
      {/* Notification Popup */}
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

      {/* ===== PREMIUM ANALYTICS HEADER ===== */}
      <div className="page-header premium-header">
        <div className="header-left">
          <h1 className="page-title">Daily Production</h1>
          <p className="page-subtitle">Track daily production and update stock automatically</p>
        </div>
        <div className="header-actions">
          <button className="btn-transfer-premium" onClick={() => handleNavigation('/production/plan')}>
            <span className="material-symbols-outlined">assignment</span>
            Production Plan
          </button>
          <button className="btn-export-premium" onClick={openExportModal}>
            <span className="material-symbols-outlined">description</span>
            Export
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="export-modal" style={{ maxWidth: '700px' }}>
            <div className="export-modal-header">
              <h2>Export Production Report</h2>
              <button className="modal-close" onClick={closeExportModal}>×</button>
            </div>

            <div className="export-modal-body">
              <div className="export-section">
                <h3>Export Format</h3>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="exportFormat" value="excel" checked={exportFormat === 'excel'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span>Excel File</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportFormat" value="csv" checked={exportFormat === 'csv'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span>CSV File</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportFormat" value="pdf" checked={exportFormat === 'pdf'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span>PDF Report</span>
                  </label>
                </div>
              </div>

              <div className="export-section">
                <h3>Report Period</h3>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="daily" checked={exportPeriod === 'daily'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span>Daily Report (Single Day)</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="weekly" checked={exportPeriod === 'weekly'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span>Weekly Report (Date Range)</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="monthly" checked={exportPeriod === 'monthly'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span>Monthly Report (Month Range)</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="yearly" checked={exportPeriod === 'yearly'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span>Yearly Report</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="exportPeriod" value="overall" checked={exportPeriod === 'overall'} onChange={(e) => setExportPeriod(e.target.value)} />
                    <span>Overall Report (All Time)</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Date Selection based on Period */}
              {exportPeriod === 'daily' && (
                <div className="export-section">
                  <h3>Select Date</h3>
                  <div className="date-picker-container">
                    <button
                      className="date-picker-btn"
                      onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                    >
                      <span className="material-symbols-outlined">calendar_today</span>
                      {exportStartDate ? formatDate(exportStartDate) : 'Select Date'}
                    </button>

                    {showStartDatePicker && (
                      <div className="date-dropdown mui-calendar-dropdown">
                        <CalendarPicker
                          selectedDate={exportStartDate}
                          onDateChange={(date) => handleExportDateSelect('start', date)}
                          onClose={() => setShowStartDatePicker(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {exportPeriod === 'weekly' && (
                <div className="export-section">
                  <h3>Select Date Range</h3>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="date-picker-container" style={{ flex: 1 }}>
                      <button
                        className="date-picker-btn"
                        onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                      >
                        <span className="material-symbols-outlined">calendar_today</span>
                        {exportStartDate ? formatDate(exportStartDate) : 'Start Date'}
                      </button>

                      {showStartDatePicker && (
                        <div className="date-dropdown mui-calendar-dropdown">
                          <CalendarPicker
                            selectedDate={exportStartDate}
                            onDateChange={(date) => handleExportDateSelect('start', date)}
                            onClose={() => setShowStartDatePicker(false)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="date-picker-container" style={{ flex: 1 }}>
                      <button
                        className="date-picker-btn"
                        onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                      >
                        <span className="material-symbols-outlined">calendar_today</span>
                        {exportEndDate ? formatDate(exportEndDate) : 'End Date'}
                      </button>

                      {showEndDatePicker && (
                        <div className="date-dropdown mui-calendar-dropdown">
                          <CalendarPicker
                            selectedDate={exportEndDate}
                            onDateChange={(date) => handleExportDateSelect('end', date)}
                            onClose={() => setShowEndDatePicker(false)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {exportPeriod === 'monthly' && (
                <div className="export-section">
                  <h3>Select Month Range</h3>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="date-picker-container" style={{ flex: 1 }}>
                      <button
                        className="date-picker-btn"
                        onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                      >
                        <span className="material-symbols-outlined">calendar_today</span>
                        {exportStartDate ? formatDate(exportStartDate) : 'Start Month'}
                      </button>

                      {showStartDatePicker && (
                        <div className="date-dropdown mui-calendar-dropdown">
                          <CalendarPicker
                            selectedDate={exportStartDate}
                            onDateChange={(date) => handleExportDateSelect('start', date)}
                            onClose={() => setShowStartDatePicker(false)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="date-picker-container" style={{ flex: 1 }}>
                      <button
                        className="date-picker-btn"
                        onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                      >
                        <span className="material-symbols-outlined">calendar_today</span>
                        {exportEndDate ? formatDate(exportEndDate) : 'End Month'}
                      </button>

                      {showEndDatePicker && (
                        <div className="date-dropdown mui-calendar-dropdown">
                          <CalendarPicker
                            selectedDate={exportEndDate}
                            onDateChange={(date) => handleExportDateSelect('end', date)}
                            onClose={() => setShowEndDatePicker(false)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {exportPeriod === 'yearly' && (
                <div className="export-section">
                  <h3>Select Year</h3>
                  <div className="date-picker-container">
                    <button
                      className="date-picker-btn"
                      onClick={() => setShowYearPicker(!showYearPicker)}
                    >
                      <span className="material-symbols-outlined">calendar_today</span>
                      {exportYear || 'Select Year'}
                    </button>

                    {showYearPicker && (
                      <div className="date-dropdown year-dropdown">
                        <div className="year-list">
                          {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                            <div
                              key={year}
                              className={`year-item ${exportYear === year.toString() ? 'active' : ''}`}
                              onClick={() => handleYearSelect(year.toString())}
                            >
                              {year}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="export-note">
                <span className="material-symbols-outlined">info</span>
                Export production data for the selected period
              </p>
            </div>

            <div className="export-modal-footer">
              <button className="btn-cancel" onClick={closeExportModal}>Cancel</button>
              <button className="btn-export-confirm" onClick={handleExport}>
                <span className="material-symbols-outlined">download</span>
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <span className="material-symbols-outlined">today</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Today's Production</span>
            <span className="stat-value">{stats.today.toLocaleString()} plates</span>
            <span className="stat-trend positive">Today</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">date_range</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">This Week</span>
            <span className="stat-value">{stats.week.toLocaleString()} plates</span>
            <span className="stat-trend positive">Last 7 days</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">This Month</span>
            <span className="stat-value">{stats.month.toLocaleString()} plates</span>
            <span className="stat-trend positive">Current month</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <span className="material-symbols-outlined">inventory</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Stock</span>
            <span className="stat-value">{stats.stock.toLocaleString()} plates</span>
            <span className="stat-trend">All time</span>
          </div>
        </div>
      </div>

      {/* Add Production Form */}
      <div className="form-card">
        <div className="form-header">
          <h3>
            <span className="material-symbols-outlined">add_circle</span>
            Add Production
          </h3>
          <div className="date-selector">
            <div className="date-picker-container">
              <button
                className="date-picker-btn"
                onClick={() => setShowProductionDatePicker(!showProductionDatePicker)}
              >
                <span className="material-symbols-outlined">calendar_today</span>
                {formatDate(productionDate)}
              </button>

              {showProductionDatePicker && (
                <div className="date-dropdown mui-calendar-dropdown">
                  <CalendarPicker
                    selectedDate={productionDate}
                    onDateChange={handleProductionDateSelect}
                    onClose={() => setShowProductionDatePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-item">
            <label>Product:</label>
            <select name="product" value={formData.product} onChange={handleInputChange} className="form-select">
              {products.map(product => (
                <option key={product.name} value={product.name}>{product.name}</option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label>Size:</label>
            <select name="size" value={formData.size} onChange={handleInputChange} className="form-select">
              {getSizesForProduct().map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label>Quantity:</label>
            <div className="quantity-input">
              <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="0" />
              <span className="unit">plates</span>
            </div>
          </div>

          <div className="form-item">
            <label>Grade:</label>
            <div className="grade-options">
              {grades.map(grade => (
                <label key={grade} className="grade-option">
                  <input type="radio" name="grade" value={grade} checked={formData.grade === grade} onChange={handleInputChange} />
                  <span>{grade}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-item">
            <label>Operator:</label>
            <select name="operator" value={formData.operator} onChange={handleInputChange} className="form-select">
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <div className="form-item button-item">
            <button className="btn-add" onClick={handleAddProduction}>
              <span className="material-symbols-outlined">add</span>
              ADD PRODUCTION
            </button>
          </div>
        </div>
      </div>

      {/* Production Summary Section */}
      <div className="summary-section">
        <div className="summary-header">
          <div className="summary-title">
            <h3>
              <span className="material-symbols-outlined">insights</span>
              Production Summary
            </h3>
          </div>
          <div className="summary-controls">
            <div className="view-selector">
              <button
                className={`view-btn ${summaryView === 'daily' ? 'active' : ''}`}
                onClick={() => setSummaryView('daily')}
              >
                Daily
              </button>
              <button
                className={`view-btn ${summaryView === 'weekly' ? 'active' : ''}`}
                onClick={() => setSummaryView('weekly')}
              >
                Weekly
              </button>
              <button
                className={`view-btn ${summaryView === 'monthly' ? 'active' : ''}`}
                onClick={() => setSummaryView('monthly')}
              >
                Monthly
              </button>
            </div>
            <div className="date-picker-container">
              <button
                className="date-picker-btn small"
                onClick={() => setShowSummaryDatePicker(!showSummaryDatePicker)}
              >
                <span className="material-symbols-outlined">calendar_today</span>
                {formatDate(summaryDate)}
              </button>

              {showSummaryDatePicker && (
                <div className="date-dropdown mui-calendar-dropdown">
                  <CalendarPicker
                    selectedDate={summaryDate}
                    onDateChange={handleSummaryDateSelect}
                    onClose={() => setShowSummaryDatePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="summary-content">
          <div className="summary-total-card">
            <div className="total-label">Total Production</div>
            <div className="total-value">{summaryData.total.toLocaleString()} plates</div>
          </div>

          <div className="size-breakdown">
            <h4>Size-wise Breakdown</h4>
            <div className="size-grid">
              {AVAILABLE_SIZES.map(size => (
                <div key={size} className="size-card">
                  <div className="size-name">{size}</div>
                  <div className="size-quantity">{summaryData.bySize[size]?.toLocaleString() || 0} plates</div>
                </div>
              ))}
            </div>
          </div>

          {summaryView !== 'daily' && summaryData.data.length > 0 && (
            <div className="daily-breakdown">
              <h4>Daily Breakdown</h4>
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>6-inch</th>
                    <th>8-inch</th>
                    <th>10-inch</th>
                    <th>12-inch</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.data.map((day, index) => (
                    <tr key={index}>
                      <td>{day.date}</td>
                      <td className="text-right">{day.bySize['6-inch']?.toLocaleString() || 0}</td>
                      <td className="text-right">{day.bySize['8-inch']?.toLocaleString() || 0}</td>
                      <td className="text-right">{day.bySize['10-inch']?.toLocaleString() || 0}</td>
                      <td className="text-right">{day.bySize['12-inch']?.toLocaleString() || 0}</td>
                      <td className="text-right total">{day.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <th className="text-right">{summaryData.bySize['6-inch']?.toLocaleString() || 0}</th>
                    <th className="text-right">{summaryData.bySize['8-inch']?.toLocaleString() || 0}</th>
                    <th className="text-right">{summaryData.bySize['10-inch']?.toLocaleString() || 0}</th>
                    <th className="text-right">{summaryData.bySize['12-inch']?.toLocaleString() || 0}</th>
                    <th className="text-right total">{summaryData.total.toLocaleString()}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* History Filters */}
      <div className="history-filters">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search by product or operator..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
          />
          {historySearch && (
            <button className="clear-search" onClick={() => setHistorySearch('')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="filter-box">
          <span className="material-symbols-outlined filter-icon">filter_list</span>
          <select
            value={historySizeFilter}
            onChange={(e) => setHistorySizeFilter(e.target.value)}
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
            {selectedDate ? formatDate(selectedDate) : 'Select Date'}
            {selectedDate && (
              <span className="clear-date" onClick={(e) => { e.stopPropagation(); clearDateFilter(); }}>
                ×
              </span>
            )}
          </button>

          {showDatePicker && (
            <div className="date-dropdown mui-calendar-dropdown">
              <CalendarPicker
                selectedDate={selectedDate}
                onDateChange={handleDateSelect}
                onClose={() => setShowDatePicker(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Production History Table - MASTER STORAGE */}
      <div className="table-container">
        <div className="table-header">
          <h3>
            <span className="material-symbols-outlined">history</span>
            Complete Production History
          </h3>
          <span className="records-count">
            Total Records: {productionHistory.length}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>TIME</th>
                <th>PRODUCT</th>
                <th>SIZE</th>
                <th>QUANTITY</th>
                <th>GRADE</th>
                <th>OPERATOR</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                    <td>
                      <div className="product-info">
                        <span className="product-icon material-symbols-outlined">production_quantity_limits</span>
                        <span>{item.product}</span>
                      </div>
                    </td>
                    <td>{item.size}</td>
                    <td className="text-right">{item.quantity.toLocaleString()} plates</td>
                    <td>
                      <span className={`grade-badge grade-${item.grade.toLowerCase()}`}>
                        Grade {item.grade}
                      </span>
                    </td>
                    <td>{item.operator}</td>
                    <td>
                      <span className="status-badge completed">
                        ✓ Completed
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteProduction(item.id)}
                        title="Delete Record"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-records">
                    No production records found. Add your first production entry!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {filteredHistory.length} of {productionHistory.length} production records</span>
          {selectedDate && (
            <div className="active-filter">
              Filtering by: <strong>{formatDate(selectedDate)}</strong>
              <button onClick={clearDateFilter} className="clear-filter">Clear</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Production;