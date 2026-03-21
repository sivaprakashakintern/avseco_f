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

  const isTodayOnly = (dateStr) => {
    if (!dateStr) return false;
    const date = parseDate(dateStr);
    if (!date || !date.isValid()) return false;
    const today = dayjs().startOf('day');
    const diffDays = today.diff(date.startOf('day'), 'day');
    return diffDays === 0;
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
    addProduction,
    deleteProduction,
    clearAllProduction,
    products: dbProducts, 
    employees
  } = useAppContext();



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
        .filter(item => (item.size || "").toLowerCase() === size.toLowerCase())
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
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
    const hist = productionHistory.filter(item => {
      const matchesSearch = !historySearch.trim() ||
        (item.product?.toLowerCase() || "").includes(historySearch.toLowerCase()) ||
        (item.operator?.toLowerCase() || "").includes(historySearch.toLowerCase());

      const matchesSize = historySizeFilter === 'all' || item.size === historySizeFilter;

      return matchesSearch && matchesSize;
    });

    return [...hist].sort((a, b) => {
       const dtA = dayjs(`${a.date} ${a.time}`, 'DD-MM-YYYY hh:mm A').unix();
       const dtB = dayjs(`${b.date} ${b.time}`, 'DD-MM-YYYY hh:mm A').unix();
       return dtB - dtA;
    });
  };

  const [editingProduction, setEditingProduction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditProduction = (record) => {
    setEditingProduction(record);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduction = (record) => {
    setProductionToDelete([record.id || record._id]);
    setShowDeleteConfirm(true);
  };




  const handleDeleteProductionGroup = (group) => {
    setProductionToDelete(group.allIds);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduction = async () => {
    if (productionToDelete && productionToDelete.length > 0) {
      for (const id of productionToDelete) {
         await deleteProduction(id);
      }
      showNotificationMessage(`🗑️ Production record(s) deleted successfully`, 'warning');
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
          <button 
            className="clear-all-btn-premium" 
            onClick={async () => {
              if (window.confirm("Are you sure you want to clear ALL production history records from the database? This cannot be undone.")) {
                try {
                  await clearAllProduction();
                  showNotificationMessage("✅ All production history has been cleared.");
                } catch (err) {
                  showNotificationMessage("❌ Failed to clear history.", "error");
                }
              }
            }}
          >
            <span className="material-symbols-outlined">delete_sweep</span>
            Clear All History
          </button>
        </div>
      </div>

      {/* --- DASHBOARD SECTION --- */}
      <div className="dashboard-content-main" style={{ display: showHistoryOnly ? 'none' : 'block' }}>
        


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
                        {productOptions.length === 0 ? (
                          <option value="">Please add a product first</option>
                        ) : (
                          productOptions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
                        )}
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
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input type="text" placeholder="Search operator..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="daily-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>S.NO</th>
                    <th style={{ textAlign: 'center', minWidth: '100px' }}>DATE</th>
                    <th style={{ textAlign: 'center' }}>TIME</th>
                    <th style={{ textAlign: 'center' }}>OPERATOR</th>
                    <th style={{ textAlign: 'center' }}>PRODUCT NAME</th>
                    <th style={{ textAlign: 'center', width: '350px' }}>SIZES (QTY)</th>
                    <th style={{ textAlign: 'center' }}>GRADE</th>
                    <th style={{ textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((record, idx) => (
                      <tr key={record.id || record._id || idx} style={{ textAlign: 'center' }}>
                        <td className="bold" style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td className="bold" style={{ textAlign: 'center' }}>{record.date}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`time-badge`}>
                            {record.time}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{record.operator}</td>
                        <td style={{ textAlign: 'center' }}><span className="bold">{record.product}</span></td>
                        <td style={{ textAlign: 'center' }}>
                           <span className="size-badge">
                              {record.size}: <span style={{ color: '#059669' }}>{Number(record.quantity).toLocaleString()}</span>
                           </span>
                        </td>
                        <td style={{ textAlign: 'center' }}><span className={`grade-badge grade-${record.grade?.toLowerCase()}`}>{record.grade}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                             <button className="btn-edit-premium" onClick={() => handleEditProduction(record)}>
                               <span className="material-symbols-outlined">edit</span>
                             </button>
                             <button className="btn-delete" onClick={() => handleDeleteProduction(record)}>
                               <span className="material-symbols-outlined">delete</span>
                             </button>
                          </div>
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
                filteredHistory.map((record, index) => (
                  <div
                    key={record.id || record._id || index}
                    className={`mobile-prod-card-item ${expandedProdId === (record.id || record._id) ? 'expanded' : ''}`}
                  >
                    <div className="prod-card-main" onClick={() => toggleProdCard(record.id || record._id)}>
                      <span className="prod-card-sno">#{index + 1}</span>
                      <div className="prod-card-size-wrap" style={{ flex: 1 }}>
                        <span className="prod-card-size-label" style={{ fontWeight: '800', color: '#0f172a' }}>{record.operator}</span>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{record.product}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '10px' }}>
                        <span className={`grade-badge grade-${record.grade?.toLowerCase()}`} style={{ scale: '0.8', transformOrigin: 'right' }}>{record.grade}</span>
                      </div>
                      <span className="material-symbols-outlined prod-card-expand-icon">
                        {expandedProdId === (record.id || record._id) ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>

                    {expandedProdId === (record.id || record._id) && (
                      <div className="prod-card-details">
                        <div className="prod-card-info-grid">
                          <div className="prod-info-row">
                            <span className="prod-info-label">Date & Time</span>
                            <span className="prod-info-value">{record.date} • {record.time}</span>
                          </div>
                          
                          <div className="prod-info-row" style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                <span className="prod-info-label">Produced Size & Quantity:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                   <span style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>
                                      {record.size}: <span style={{ color: '#059669' }}>{Number(record.quantity).toLocaleString()}</span>
                                   </span>
                                </div>
                             </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                           <button
                             className="prod-card-edit-btn"
                             onClick={() => handleEditProduction(record)}
                             style={{ flex: 1 }}
                           >
                             <span className="material-symbols-outlined">edit</span>
                             Edit
                           </button>
                           <button
                             className="prod-card-delete-btn"
                             onClick={() => handleDeleteProduction(record)}
                             style={{ flex: 1 }}
                           >
                             <span className="material-symbols-outlined">delete</span>
                             Delete
                           </button>
                        </div>
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
            <p style={{ color: '#64748b', marginBottom: '32px' }}>Are you sure you want to delete this production record? This will also update your stock levels and production plan.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#f44336' }} onClick={confirmDeleteProduction}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingProduction && (
        <div className="modal-overlay">
          <div className="export-modal" style={{ maxWidth: '500px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', color: '#1e293b' }}>Edit Production Record</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group-premium">
                <label>Quantity (pcs)</label>
                <input 
                  type="number" 
                  value={editingProduction.quantity} 
                  onChange={(e) => setEditingProduction({...editingProduction, quantity: e.target.value})}
                  className="premium-input"
                />
              </div>

              <div className="form-row-premium">
                 <div className="form-group-premium">
                   <label>Grade</label>
                   <select 
                      value={editingProduction.grade} 
                      onChange={(e) => setEditingProduction({...editingProduction, grade: e.target.value})}
                      className="premium-select"
                   >
                     <option value="A">Grade A</option>
                     <option value="B">Grade B</option>
                     <option value="C">Grade C</option>
                   </select>
                 </div>
                 <div className="form-group-premium">
                    <label>Operator</label>
                    <select 
                       value={editingProduction.operator} 
                       onChange={(e) => setEditingProduction({...editingProduction, operator: e.target.value})}
                       className="premium-select"
                    >
                      {operators.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button className="btn-outline" style={{ flex: 1 }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button className="btn-premium-submit" style={{ flex: 1, margin: 0 }} onClick={async () => {
                  try {
                    const { updateProduction } = useAppContext();
                    await updateProduction(editingProduction.id || editingProduction._id, editingProduction);
                    showNotificationMessage("✅ Record updated successfully");
                    setIsEditModalOpen(false);
                  } catch (err) {
                    showNotificationMessage("❌ Failed to update record", "error");
                  }
                }}>Update Record</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;