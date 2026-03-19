import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
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

const availableSizes = ['6-inch', '8-inch', '10-inch', '12-inch'];

const Production = () => {
  // ========== HELPER FUNCTIONS ==========
  const formatDate = (date) => {
    if (!date) return '';
    return date.format('DD-MM-YYYY');
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    return dayjs(dateStr, 'DD-MM-YYYY');
  };

  const isWithinLast2Days = (dateStr) => {
    if (!dateStr) return false;
    const date = parseDate(dateStr);
    if (!date || !date.isValid()) return false;
    const today = dayjs().startOf('day');
    const diffDays = today.diff(date.startOf('day'), 'day');
    return diffDays <= 2;
  };

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

  // Mobile card expand state
  const [expandedProdId, setExpandedProdId] = useState(null);
  const toggleProdCard = (id) => setExpandedProdId(prev => prev === id ? null : id);

  // ========== STATE MANAGEMENT ==========
  // Notification State
  const [historySearch, setHistorySearch] = useState('');
  const [historySizeFilter, setHistorySizeFilter] = useState('all');
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);

  // Summary view state
  const [summaryView, setSummaryView] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [summaryDate, setSummaryDate] = useState(dayjs());
  const [showSummaryDatePicker, setShowSummaryDatePicker] = useState(false);

  // Delete/Notification State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productionToDelete, setProductionToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  const showNotificationMessage = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };


  const { 
    productionHistory, 
    productionTargets, 
    addProduction,
    deleteProduction, 
    products: dbProducts, 
    employees, 
    productionStats 
  } = useAppContext();

  const { 
    today: todayCount, 
    week, 
    month, 
    stock, 
    todayBySize, 
    weekBySize, 
    monthBySize, 
    availableSizes: sizesList 
  } = productionStats || {};

  // Production Entry Form State
  const [productionDate, setProductionDate] = useState(dayjs());
  const [showProductionDatePicker, setShowProductionDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    size: "",
    quantity: "",
    grade: "B",
    operator: ""
  });

  // DYNAMIC OPERATORS FROM EMPLOYEES
  const operators = React.useMemo(() => {
    return (employees || [])
      .filter(e => e.department === "Operator" || e.department === "Machine operator" || e.department === "Others")
      .map(e => e.name);
  }, [employees]);

  // DERIVE DYNAMIC PRODUCTS FROM DATABASE
  const productOptions = React.useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];
    const unique = {};
    dbProducts.forEach(p => {
      if (!unique[p.name]) unique[p.name] = { name: p.name, sizes: [] };
      if (!unique[p.name].sizes.includes(p.size)) unique[p.name].sizes.push(p.size);
    });
    return Object.values(unique);
  }, [dbProducts]);

  // Initial form defaults
  useEffect(() => {
    if (operators.length > 0 && !formData.operator) {
      setFormData(prev => ({ ...prev, operator: operators[0] }));
    }
  }, [operators, formData.operator]);

  useEffect(() => {
    if (productOptions.length > 0 && !formData.product) {
      const firstProd = productOptions[0];
      setFormData(prev => ({ 
        ...prev, 
        product: firstProd.name,
        size: firstProd.sizes[0] || ""
      }));
    }
  }, [productOptions, formData.product]);

  // ========== GET SUMMARY DATA BY SIZE FOR SELECTED VIEW ==========
  const getSummaryData = () => {
    let filteredData = [];

    switch (summaryView) {
      case 'daily':
        filteredData = productionHistory.filter(item => item.date === formatDate(summaryDate));
        break;

      case 'weekly':
        const weekStart = summaryDate.startOf('week');
        const weekEnd = summaryDate.endOf('week');
        filteredData = productionHistory.filter(item => {
          const itemDate = parseDate(item.date);
          return itemDate && itemDate >= weekStart && itemDate <= weekEnd;
        });
        break;

      case 'monthly':
        const monthNum = summaryDate.month() + 1;
        const yearNum = summaryDate.year();
        filteredData = productionHistory.filter(item => {
          const parts = item.date.split('-');
          return parseInt(parts[1]) === monthNum && parseInt(parts[2]) === yearNum;
        });
        break;
      default:
        break;
    }

    const bySize = {};
    let total = 0;
    availableSizes.forEach(size => {
      const sizeTotal = filteredData
        .filter(item => item.size === size)
        .reduce((sum, item) => sum + item.quantity, 0);
      bySize[size] = sizeTotal;
      total += sizeTotal;
    });

    return { total, bySize };
  };

  const handleSummaryDateSelect = (date) => {
    setSummaryDate(date);
    setShowSummaryDatePicker(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduction = async () => {
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      showNotificationMessage("Please enter valid quantity", 'error');
      return;
    }

    const quantity = parseInt(formData.quantity);
    const timeString = dayjs().format('hh:mm A');

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

    try {
      await addProduction(newProduction);
      setFormData(prev => ({ ...prev, quantity: "" }));
      showNotificationMessage(`✅ Production added! 📦 +${quantity} plates`, 'success');
    } catch (err) {
      showNotificationMessage("Failed to add production", "error");
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
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const summaryData = getSummaryData();






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
      const dateTimeA = dayjs(`${a.date} ${a.time === 'TARGET' ? '00:01 AM' : a.time}`, 'DD-MM-YYYY hh:mm A');
      const dateTimeB = dayjs(`${b.date} ${b.time === 'TARGET' ? '00:01 AM' : b.time}`, 'DD-MM-YYYY hh:mm A');
      return dateTimeB.unix() - dateTimeA.unix();
    });
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



  const filteredHistory = getFilteredHistory();


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
            <button className="notification-close" onClick={() => setShowNotification(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="notification-progress"></div>
        </div>
      )}



      <div className="page-header premium-header">
        <div className="header-left">
          <h1 className="page-title">Daily Production</h1>
        </div>
        <div className="header-actions">
          {/* Export button removed */}
        </div>
      </div>

      {/* --- DASHBOARD SECTION --- */}
      <div className="dashboard-content-main" style={{ display: showHistoryOnly ? 'none' : 'block' }}>
        
        {/* Stats Grid - Premium Version */}
        <div className="premium-stats-grid">
          <div className="premium-stat-card today">
            <div className="p-stat-info">
              <span className="p-stat-label">Today's Production</span>
              <div className="p-stat-value">{(todayCount || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {(sizesList || []).map(size => (
                  <span key={size} className="breakdown-tag">{size.split('-')[0]}: {todayBySize?.[size] || 0}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="premium-stat-card week">
            <div className="p-stat-info">
              <span className="p-stat-label">Last 7 Days</span>
              <div className="p-stat-value">{(week || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {(sizesList || []).map(size => (
                  <span key={size} className="breakdown-tag">{size.split('-')[0]}: {weekBySize?.[size] || 0}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="premium-stat-card month">
            <div className="p-stat-info">
              <span className="p-stat-label">This Month</span>
              <div className="p-stat-value">{(month || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {(sizesList || []).map(size => (
                  <span key={size} className="breakdown-tag">{size.split('-')[0]}: {monthBySize?.[size] || 0}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="premium-stat-card stock">
            <div className="p-stat-info">
              <span className="p-stat-label">Total Produced</span>
              <div className="p-stat-value">{(stock || 0).toLocaleString()}</div>
              <span className="p-stat-tag">All time</span>
            </div>
          </div>
        </div>

        <div className="production-main-grid">
          
          {/* New Production Entry Form - Premium Version */}
          <div className="production-form-section">
            <div className="premium-entry-card">
              <div className="card-header entry-header">
                <h3>
                  <span className="material-symbols-outlined">add_circle</span>
                  New Production Entry
                </h3>
              </div>
              <div className="card-body">
                <div className="entry-form-premium">
                  <div className="form-group-premium">
                    <label>Production Date</label>
                    <div className="date-picker-container">
                      <button className="premium-input-btn" onClick={(e) => { e.stopPropagation(); setShowProductionDatePicker(!showProductionDatePicker); }}>
                        <span className="material-symbols-outlined">event</span>
                        {formatDate(productionDate)}
                      </button>
                      {showProductionDatePicker && (
                        <div className="date-dropdown mui-calendar-dropdown">
                          <CalendarPicker selectedDate={productionDate} onDateChange={(date) => { setProductionDate(date); setShowProductionDatePicker(false); }} onClose={() => setShowProductionDatePicker(false)} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-row-premium">
                    <div className="form-group-premium">
                      <label>Product</label>
                      <select name="product" value={formData.product} onChange={handleInputChange} className="premium-select">
                        {productOptions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group-premium">
                      <label>Size</label>
                      <select name="size" value={formData.size} onChange={handleInputChange} className="premium-select">
                        {getSizesForProduct().map(size => <option key={size} value={size}>{size}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group-premium">
                    <label>Quantity (pcs)</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="Enter quantity..." className="premium-input" />
                  </div>

                  <div className="form-row-premium">
                    <div className="form-group-premium">
                      <label>Grade</label>
                      <select name="grade" value={formData.grade} onChange={handleInputChange} className="premium-select">
                        <option value="A">Grade A</option>
                        <option value="B">Grade B</option>
                        <option value="C">Grade C</option>
                      </select>
                    </div>
                    <div className="form-group-premium">
                      <label>Operator</label>
                      <select name="operator" value={formData.operator} onChange={handleInputChange} className="premium-select">
                        {operators.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <button className="btn-premium-submit" onClick={handleAddProduction}>
                    <span className="material-symbols-outlined">rocket_launch</span>
                    SUBMIT PRODUCTION
                  </button>
                </div>
              </div>
            </div>
            
            <button className="mobile-view-history-btn mobile-only-flex" onClick={() => setShowHistoryOnly(true)}>
              <span className="material-symbols-outlined">history</span>
              View Production History
            </button>
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
                    <button className="date-summary-btn" onClick={(e) => { e.stopPropagation(); setShowSummaryDatePicker(!showSummaryDatePicker); }}>
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
                  <span className="value">{(summaryData.total || 0).toLocaleString()} pcs</span>
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
      </div>

      

      {/* --- HISTORY SECTION --- */}
      <div className={`history-full-view ${showHistoryOnly ? 'show' : ''}`}>
        <div className="history-view-header mobile-only-flex">
          <button className="btn-back-to-dashboard" onClick={() => setShowHistoryOnly(false)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </button>
          <h2>Today Production</h2>
        </div>

        <div className="history-section">
          <div className="premium-card">
            <div className="card-header table-header">
              <h3>
                <span className="material-symbols-outlined">history</span>
                Today Production
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
                          {(item.quantity || 0).toLocaleString()}
                          {item.type === 'target' && <span className="target-indicator"> (Plan)</span>}
                        </td>
                        <td><span className={`grade-badge ${item.grade.toLowerCase()}`}>{item.grade}</span></td>
                        <td>{item.operator}</td>
                        <td>
                          {item.type === 'record' ? (
                            isWithinLast2Days(item.date) ? (
                              <button className="btn-delete" onClick={() => handleDeleteProduction(item.id)}>
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Locked</span>
                            )
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
                      <span className="prod-card-qty">{(item.quantity || 0).toLocaleString()} pcs</span>
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
                        {isWithinLast2Days(item.date) && (
                          <button
                            className="prod-card-delete-btn"
                            onClick={() => handleDeleteProduction(item.id)}
                          >
                            <span className="material-symbols-outlined">delete</span>
                            Delete Record
                          </button>
                        )}
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