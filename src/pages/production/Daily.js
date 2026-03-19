import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import './Daily.css';


// Colour mapping for sizes
const SIZE_COLOR = {
  '6-inch': '#10b981',
  '8-inch': '#3b82f6',
  '10-inch': '#f59e0b',
  '12-inch': '#8b5cf6',
};

const grades = ['A', 'B', 'C'];

const Production = () => {
  // Mobile card expand state
  const [expandedProdId, setExpandedProdId] = useState(null);
  const toggleProdCard = (id) => setExpandedProdId(prev => prev === id ? null : id);

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

  // Notification State
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  const [historySearch, setHistorySearch] = useState('');
  const [historySizeFilter, setHistorySizeFilter] = useState('all');
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);

  // Summary view state
  const [summaryView, setSummaryView] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [summaryDate, setSummaryDate] = useState(dayjs());

  // Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productionToDelete, setProductionToDelete] = useState(null);
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

  // Production history from context
  const { productionHistory, productionTargets, addProduction, deleteProduction, products: dbProducts, fetchData, loading, employees } = useAppContext();

  // DYNAMIC OPERATORS FROM EMPLOYEES
  const operators = React.useMemo(() => {
    return employees
      .filter(e => e.department === "Operator" || e.department === "Machine operator")
      .map(e => e.name);
  }, [employees]);

  // Fallback if no operators found
  const operatorList = operators.length > 0 ? operators : ["No Operators Found"];

  // DERIVE DYNAMIC PRODUCTS FROM DATABASE
  const productOptions = React.useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];
    
    const uniqueProducts = dbProducts.reduce((acc, p) => {
      if (!acc[p.name]) {
        acc[p.name] = { name: p.name, sizes: [] };
      }
      if (!acc[p.name].sizes.includes(p.size)) {
        acc[p.name].sizes.push(p.size);
      }
      return acc;
    }, {});
    
    return Object.values(uniqueProducts);
  }, [dbProducts]);

  // Update default product if database has products
  useEffect(() => {
    if (productOptions.length > 0) {
      setFormData(prev => ({
        ...prev,
        product: productOptions[0].name,
        size: productOptions[0].sizes[0] || "",
        operator: operatorList[0]
      }));
    }
  }, [productOptions, operatorList]);

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

  // ========== CALCULATE STATS FUNCTION (DEFINED BEFORE USE) ==========
  const calculateStats = useCallback((history, targets) => {
    const today = formatDate(dayjs());
    const data = history || [];
    const targetList = targets || [];

    // Helpers for dates
    const currentMonth = dayjs().month() + 1;
    const currentYear = dayjs().year();
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, 'day');
      last7Days.push(formatDate(date));
    }

    // Today's totals by size
    const todayHistory = data.filter(item => item.date === today);

    // 1. Temporal Stats from History Logs ONLY (prevents double counting)
    const todayTotal = todayHistory.reduce((sum, item) => sum + item.quantity, 0);
    
    const todayBySize = {};
    availableSizes.forEach(size => {
      todayBySize[size] = todayHistory.filter(item => item.size === size).reduce((sum, item) => sum + item.quantity, 0);
    });

    const weekHistory = data.filter(item => last7Days.includes(item.date));
    const weekTotal = weekHistory.reduce((sum, item) => sum + item.quantity, 0);

    const weekBySize = {};
    availableSizes.forEach(size => {
      weekBySize[size] = weekHistory.filter(item => item.size === size).reduce((sum, item) => sum + item.quantity, 0);
    });

    const monthHistory = data.filter(item => {
      const parts = item.date.split('-');
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      return month === currentMonth && year === currentYear;
    });
    const monthTotal = monthHistory.reduce((sum, item) => sum + item.quantity, 0);

    const monthBySize = {};
    availableSizes.forEach(size => {
      monthBySize[size] = monthHistory.filter(item => item.size === size).reduce((sum, item) => sum + item.quantity, 0);
    });

    // 2. STOCK: Sum of all matches in targets + any records that didn't match a target
    const stockTotal = targetList.reduce((sum, item) => sum + (item.producedQty || 0), 0);

    setStats({
      today: todayTotal,
      week: weekTotal,
      month: monthTotal,
      stock: stockTotal,
      todayBySize,
      weekBySize,
      monthBySize
    });
  }, []);

  // ========== INITIAL STATS CALCULATION ==========
  useEffect(() => {
    calculateStats(productionHistory, productionTargets);
  }, [productionHistory, productionTargets, calculateStats]);

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
          const parts = item.date.split('-');
          const itemMonth = parseInt(parts[1]);
          const itemYear = parseInt(parts[2]);
          return itemMonth === month && itemYear === year;
        });
        break;

      default:
        return { data: [], total: 0, bySize: {} };
    }

    // Calculate totals by size
    const bySize = {};
    let total = 0;

    availableSizes.forEach(size => {
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
    // Current Records
    const hist = productionHistory.map(item => ({ ...item, type: 'record' }));

    // Targets with actual production as "Virtual Records"
    const targetVirtuals = (productionTargets || [])
      .filter(t => (t.producedQty || 0) > 0)
      .map(t => ({
        id: `target-${t._id || t.id}`,
        date: formatDate(dayjs(t.createdAt || t.date)),
        time: 'TARGET',
        size: t.productSize,
        quantity: t.producedQty,
        grade: 'A',
        operator: t.operator || 'N/A',
        product: t.productName,
        type: 'target'
      }));

    const combined = [...hist, ...targetVirtuals];

    return combined.filter(item => {
      const matchesSearch = !historySearch.trim() ||
        (item.product && item.product.toLowerCase().includes(historySearch.toLowerCase())) ||
        (item.operator && item.operator.toLowerCase().includes(historySearch.toLowerCase()));

      const matchesSize = historySizeFilter === 'all' || item.size === historySizeFilter;

      return matchesSearch && matchesSize;
    }).sort((a, b) => {
      const dateA = dayjs(a.date, 'DD-MM-YYYY');
      const dateB = dayjs(b.date, 'DD-MM-YYYY');
      return dateB.isBefore(dateA) ? -1 : 1;
    });
  };


  // ========== EXPORT MODAL FUNCTIONS ==========
  const openExportModal = () => {
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



  const handleProductionDateSelect = (date) => {
    setProductionDate(date);
    setShowProductionDatePicker(false);
  };

  const handleSummaryDateSelect = (date) => {
    setSummaryDate(date);
    setShowSummaryDatePicker(false);
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
          const parts = item.date.split('-');
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          const itemYearMonth = year * 100 + month;
          const startYearMonth = exportStartDate.year() * 100 + (exportStartDate.month() + 1);
          const endYearMonth = exportEndDate.year() * 100 + (exportEndDate.month() + 1);
          return itemYearMonth >= startYearMonth && itemYearMonth <= endYearMonth;
        });

      case 'yearly':
        return productionHistory.filter(item => {
          const parts = item.date.split('-');
          const year = parts[2];
          return year === exportYear;
        });

      case 'overall':
      default:
        return productionHistory;
    }
  };

  const getReportTitle = () => {
    const todayStr = formatDate(dayjs());

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
        return `Complete_Production_History_${todayStr}`;
      default:
        return `Production_Report_${todayStr}`;
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

    const newProduction = {
      date: formatDate(productionDate),
      product: formData.product,
      size: formData.size,
      quantity: quantity,
      grade: formData.grade,
      operator: formData.operator,
      time: timeString,
      status: "completed"
    };

    addProduction(newProduction);

    setFormData({
      ...formData,
      quantity: ""
    });

    showNotificationMessage(
      `✅ Production added for ${formatDate(productionDate)}! 📦 +${quantity} plates (${formData.size})`,
      'success'
    );
  };

  const handleDeleteProduction = (id) => {
    setProductionToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduction = () => {
    if (productionToDelete) {
      deleteProduction(productionToDelete);
      showNotificationMessage(`🗑️ Production record deleted successfully`, 'warning');
      setShowDeleteConfirm(false);
      setProductionToDelete(null);
    }
  };

  const getSizesForProduct = () => {
    const product = productOptions.find(p => p.name === formData.product);
    return product ? product.sizes : [];
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-picker-container')) {
        setShowProductionDatePicker(false);
        setShowSummaryDatePicker(false);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const filteredHistory = getFilteredHistory();
  const summaryData = getSummaryData();

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
    <div className={`daily-production-page ${showHistoryOnly ? 'mobile-history-active' : ''}`}>
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

      <div className="page-header premium-header">
        <div className="header-left">
          <h1 className="page-title">Daily Production</h1>
          <p className="page-subtitle">Track daily production and update stock automatically</p>
        </div>
        <div className="header-actions">
          <button className="btn-export-premium" onClick={openExportModal}>
            <span className="material-symbols-outlined">description</span>
            Export
          </button>
        </div>
      </div>

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

              {exportPeriod === 'daily' && (
                <div className="export-section">
                  <h3>Select Date</h3>
                  <div className="date-picker-container">
                    <button className="date-picker-btn" onClick={() => setShowStartDatePicker(!showStartDatePicker)}>
                      <span className="material-symbols-outlined">calendar_today</span>
                      {exportStartDate ? formatDate(exportStartDate) : 'Select Date'}
                    </button>
                    {showStartDatePicker && (
                      <div className="date-dropdown mui-calendar-dropdown">
                        <CalendarPicker selectedDate={exportStartDate} onDateChange={(date) => handleExportDateSelect('start', date)} onClose={() => setShowStartDatePicker(false)} />
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
                      <button className="date-picker-btn" onClick={() => setShowStartDatePicker(!showStartDatePicker)}>
                        <span className="material-symbols-outlined">calendar_today</span>
                        {exportStartDate ? formatDate(exportStartDate) : 'Start Date'}
                      </button>
                      {showStartDatePicker && (
                        <div className="date-dropdown mui-calendar-dropdown">
                          <CalendarPicker selectedDate={exportStartDate} onDateChange={(date) => handleExportDateSelect('start', date)} onClose={() => setShowStartDatePicker(false)} />
                        </div>
                      )}
                    </div>
                    <div className="date-picker-container" style={{ flex: 1 }}>
                      <button className="date-picker-btn" onClick={() => setShowEndDatePicker(!showEndDatePicker)}>
                        <span className="material-symbols-outlined">calendar_today</span>
                        {exportEndDate ? formatDate(exportEndDate) : 'End Date'}
                      </button>
                      {showEndDatePicker && (
                        <div className="date-dropdown mui-calendar-dropdown">
                          <CalendarPicker selectedDate={exportEndDate} onDateChange={(date) => handleExportDateSelect('end', date)} onClose={() => setShowEndDatePicker(false)} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="export-modal-footer">
              <button className="btn-outline" onClick={closeExportModal}>Cancel</button>
              <button className="btn-primary" onClick={handleExport}>
                <span className="material-symbols-outlined">download</span>
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DASHBOARD SECTION --- */}
      <div className="dashboard-content-main">
        <div className="production-stats-grid">
          <div className="stat-card today">
            <div className="stat-icon">
              <span className="material-symbols-outlined">today</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">Today's Production</span>
              <span className="stat-value">{stats.today.toLocaleString()}</span>
              <div className="stat-breakdown">
                {availableSizes.map(size => (
                  <span key={size}>{size.split('-')[0]}: {stats.todayBySize[size] || 0}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-card week">
            <div className="stat-icon">
              <span className="material-symbols-outlined">date_range</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">Last 7 Days</span>
              <span className="stat-value">{stats.week.toLocaleString()}</span>
              <div className="stat-breakdown">
                {availableSizes.map(size => (
                  <span key={size}>{size.split('-')[0]}: {stats.weekBySize[size] || 0}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-card month">
            <div className="stat-icon">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">This Month</span>
              <span className="stat-value">{stats.month.toLocaleString()}</span>
              <div className="stat-breakdown">
                {availableSizes.map(size => (
                  <span key={size}>{size.split('-')[0]}: {stats.monthBySize[size] || 0}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-card stock">
            <div className="stat-icon">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Produced</span>
              <span className="stat-value">{stats.stock.toLocaleString()}</span>
              <span className="stat-tag">All time</span>
            </div>
          </div>
        </div>

        <div className="production-main-grid">
          <div className="production-form-section">
            <div className="premium-card">
              <div className="card-header">
                <h3>
                  <span className="material-symbols-outlined">add_circle</span>
                  New Production Entry
                </h3>
              </div>
              <div className="card-body">
                <div className="entry-form">
                  <div className="form-group">
                    <label>Production Date</label>
                    <div className="date-picker-container">
                      <button className="date-btn-large" onClick={() => setShowProductionDatePicker(!showProductionDatePicker)}>
                        <span className="material-symbols-outlined">event</span>
                        {formatDate(productionDate)}
                      </button>
                      {showProductionDatePicker && (
                        <div className="date-dropdown mui-calendar-dropdown">
                          <CalendarPicker selectedDate={productionDate} onDateChange={(date) => handleProductionDateSelect(date)} onClose={() => setShowProductionDatePicker(false)} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Product</label>
                      <select name="product" value={formData.product} onChange={handleInputChange}>
                        {productOptions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Size</label>
                      <select name="size" value={formData.size} onChange={handleInputChange}>
                        {getSizesForProduct().map(size => <option key={size} value={size}>{size}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Quantity (pcs)</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="Enter quantity..." />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Grade</label>
                      <select name="grade" value={formData.grade} onChange={handleInputChange}>
                        {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Operator</label>
                      <select name="operator" value={formData.operator} onChange={handleInputChange}>
                        {operatorList.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <button className="btn-add-production" onClick={handleAddProduction}>
                    <span className="material-symbols-outlined">rocket_launch</span>
                    SUBMIT PRODUCTION
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="production-summary-section">
            <div className="premium-card">
              <div className="card-header summary-header">
                <h3>
                  <span className="material-symbols-outlined">analytics</span>
                  Production Analytics
                </h3>
                <div className="summary-controls">
                  <select value={summaryView} onChange={(e) => setSummaryView(e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <div className="date-picker-container">
                    <button className="date-summary-btn" onClick={() => setShowSummaryDatePicker(!showSummaryDatePicker)}>
                      <span className="material-symbols-outlined">calendar_month</span>
                      {summaryView === 'daily' ? formatDate(summaryDate) :
                        summaryView === 'weekly' ? `Week of ${summaryDate.startOf('week').format('DD MMM')}` :
                          summaryDate.format('MMMM YYYY')}
                    </button>
                    {showSummaryDatePicker && (
                      <div className="date-dropdown mui-calendar-dropdown right">
                        <CalendarPicker selectedDate={summaryDate} onDateChange={(date) => handleSummaryDateSelect(date)} onClose={() => setShowSummaryDatePicker(false)} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="summary-total-banner">
                  <span className="label">PERIOD TOTAL</span>
                  <span className="value">{summaryData.total.toLocaleString()} pcs</span>
                </div>

                <div className="summary-grid">
                  {availableSizes.map(size => (
                    <div key={size} className="summary-item">
                      <div className="item-label">{size}</div>
                      <div className="item-value">{summaryData.bySize[size] || 0}</div>
                      <div className="item-progress">
                        <div
                          className="progress-fill"
                          style={{ width: `${summaryData.total > 0 ? (summaryData.bySize[size] / summaryData.total * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="view-history-button-wrapper mobile-only-flex">
          <button className="btn-view-history-compact" onClick={() => setShowHistoryOnly(true)}>
            <span className="material-symbols-outlined">history</span>
            View Transaction History
          </button>
        </div>
      </div>

      {/* --- HISTORY SECTION --- */}
      <div className={`history-full-view ${showHistoryOnly ? 'show' : ''}`}>
        <div className="history-view-header mobile-only-flex">
          <button className="btn-back-to-dashboard" onClick={() => setShowHistoryOnly(false)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </button>
          <h2>Transaction History</h2>
        </div>

        <div className="history-section">
          <div className="premium-card">
            <div className="card-header table-header">
              <h3>
                <span className="material-symbols-outlined">history</span>
                Transaction History
              </h3>
              <div className="table-actions">
                <select value={historySizeFilter} onChange={(e) => setHistorySizeFilter(e.target.value)}>
                  <option value="all">All Sizes</option>
                  {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="search-box">
                  <span className="material-symbols-outlined">search</span>
                  <input type="text" placeholder="Search operator..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>TIME</th>
                    <th>SIZE</th>
                    <th>QTY</th>
                    <th>GRADE</th>
                    <th>OPERATOR</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className={item.type === 'target' ? 'row-target-sync' : ''}>
                        <td className="bold">{item.date}</td>
                        <td>
                          <span className={`time-badge ${item.type}`}>
                            {item.time}
                          </span>
                        </td>
                        <td><span className="size-badge">{item.size}</span></td>
                        <td className="bold highlight">
                          {item.quantity.toLocaleString()}
                          {item.type === 'target' && <span className="target-indicator"> (Plan)</span>}
                        </td>
                        <td><span className={`grade-badge ${item.grade.toLowerCase()}`}>{item.grade}</span></td>
                        <td>{item.operator}</td>
                        <td>
                          {item.type === 'record' ? (
                            <button className="btn-delete" onClick={() => handleDeleteProduction(item.id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          ) : (
                            <span className="sync-badge">Auto Sync</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="empty">No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="mobile-production-cards">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, index) => (
                  <div
                    key={item.id}
                    className={`mobile-prod-card-item ${expandedProdId === item.id ? 'expanded' : ''}`}
                  >
                    <div className="prod-card-main" onClick={() => toggleProdCard(item.id)}>
                      <span className="prod-card-sno">#{index + 1}</span>
                      <div className="prod-card-size-wrap">
                        <span
                          className="prod-size-dot"
                          style={{ backgroundColor: SIZE_COLOR[item.size] || '#10b981' }}
                        />
                        <span className="prod-card-size-label">{item.size}</span>
                      </div>
                      <span className="prod-card-qty">{item.quantity.toLocaleString()} pcs</span>
                      <span className="material-symbols-outlined prod-card-expand-icon">
                        {expandedProdId === item.id ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>

                    {expandedProdId === item.id && (
                      <div className="prod-card-details">
                        <div className="prod-card-info-grid">
                          <div className="prod-info-row">
                            <span className="prod-info-label">Date</span>
                            <span className="prod-info-value">{item.date}</span>
                          </div>
                          <div className="prod-info-row">
                            <span className="prod-info-label">Time</span>
                            <span className="prod-info-value">{item.time}</span>
                          </div>
                          <div className="prod-info-row">
                            <span className="prod-info-label">Grade</span>
                            <span className="prod-info-value">
                              <span className={`grade-badge grade-${item.grade.toLowerCase()}`}>{item.grade}</span>
                            </span>
                          </div>
                          <div className="prod-info-row">
                            <span className="prod-info-label">Operator</span>
                            <span className="prod-info-value">{item.operator}</span>
                          </div>
                        </div>
                        <button
                          className="prod-card-delete-btn"
                          onClick={() => handleDeleteProduction(item.id)}
                        >
                          <span className="material-symbols-outlined">delete</span>
                          Delete Record
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-prod-mobile">
                  <span className="material-symbols-outlined">inventory_2</span>
                  <p>No production records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="export-modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <div className="modal-icon warning" style={{ background: '#fff9e6', color: '#f59e0b', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>warning</span>
            </div>
            <h2 style={{ marginBottom: '16px', color: '#1e293b' }}>Confirm Deletion</h2>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>Are you sure you want to delete this production record? This will also update your stock levels.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#f44336' }} onClick={confirmDeleteProduction}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;