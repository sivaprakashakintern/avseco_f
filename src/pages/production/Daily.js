import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import './Daily.css';

// Sizes will be derived dynamically below

const Production = () => {
  // ========== HELPER FUNCTIONS ==========
  const formatDate = (date) => {
    if (!date) return '';
    return date.format('DD-MM-YYYY');
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
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);

  // ========== STATE MANAGEMENT ==========
  const [historySearch, setHistorySearch] = useState('');
  const [historySizeFilter, setHistorySizeFilter] = useState('all');

  // Master Date State
  const [productionDate, setProductionDate] = useState(dayjs());
  const [showProductionDatePicker, setShowProductionDatePicker] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Delete/Notification State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [productionToDelete, setProductionToDelete] = useState(null);
  const [dateToClear, setDateToClear] = useState('');
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
    updateProduction,
    clearAllProduction,
    products: dbProducts, 
    employees,
    productionTargets,
    fetchTargets
  } = useAppContext();
  const { isAdmin } = useAuth();

  // Production Entry Form State
  const isToday = productionDate.isSame(dayjs(), 'day');
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
    
    return Object.values(unique).map(p => ({
      ...p,
      sizes: p.sizes.sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numA - numB;
      })
    }));
  }, [dbProducts]);

  // DERIVE DYNAMIC SIZES FOR SUMMARY & FILTERS
  const availableSizes = React.useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return ['6-inch', '8-inch', '10-inch', '12-inch'];
    const sizesSet = new Set();
    dbProducts.forEach(p => {
      if (p.size) sizesSet.add(p.size);
    });
    return Array.from(sizesSet).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
  }, [dbProducts]);

  useEffect(() => {
    if (fetchTargets) fetchTargets();
  }, [fetchTargets]);

  const targetInfo = React.useMemo(() => {
    if (!productionTargets || !formData.size || !formData.product) return null;
    let target = productionTargets.find(t => 
      (t.operator === formData.operator) && 
      (t.productName === formData.product || t.product === formData.product) &&
      (t.productSize === formData.size || t.size === formData.size)
    );
    if (!target) {
      target = productionTargets.find(t => 
        (t.productName === formData.product || t.product === formData.product) &&
        (t.productSize === formData.size || t.size === formData.size)
      );
    }
    if (!target) return null;
    
    const quantityTyped = Number(formData.quantity || 0);
    const totalProduced = (target.producedQty || 0) + quantityTyped;
    const remaining = Math.max(0, target.targetQty - totalProduced);
    
    return {
      targetQty: target.targetQty,
      producedQty: totalProduced,
      remaining: remaining,
      currentRemaining: Math.max(0, target.targetQty - (target.producedQty || 0)),
      isCompleted: totalProduced >= target.targetQty,
      operator: target.operator
    };
  }, [productionTargets, formData.operator, formData.size, formData.quantity]);

  const targetsBySize = React.useMemo(() => {
    const map = {};
    (productionTargets || []).forEach(t => {
      const s = (t.productSize || t.size || "").toLowerCase().trim();
      if (!map[s]) map[s] = { target: 0, produced: 0 };
      map[s].target += (t.targetQty || 0);
      map[s].produced += (t.producedQty || 0);
    });
    return map;
  }, [productionTargets]);

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

  const getSummaryData = () => {
    const dailyRecords = (productionHistory || []).filter(item => item.date === formatDate(productionDate));
    const bySize = {};
    availableSizes.forEach(size => {
      bySize[size] = dailyRecords
        .filter(item => (item.size || "").toLowerCase().trim() === size.toLowerCase().trim())
        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    });

    return {
      total: dailyRecords.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      bySize: bySize
    };
  };

  const summaryData = getSummaryData();

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
      
      // Auto-update form for next entry: reset quantity and move to next size if current is complete
      setFormData(prev => {
        const remainingSizes = getSizesForProduct();
        const stillInList = remainingSizes.includes(prev.size);
        return { 
          ...prev, 
          quantity: "", 
          size: stillInList ? prev.size : (remainingSizes[0] || "") 
        };
      });
      showNotificationMessage(`✅ Production added! 📦 +${quantity} plates`, 'success');
    } catch (err) {
      showNotificationMessage("Failed to add production", "error");
    }
  };

  const getSizesForProduct = () => {
    const product = productOptions.find(p => 
      (p.name || "").toLowerCase().trim() === (formData.product || "").toLowerCase().trim()
    );
    return product ? product.sizes : [];
  };

  const getSizeTargetInfo = (size) => {
    if (!productionTargets || !formData.product || !size) return null;
    let target = productionTargets.find(t => 
      (t.operator === formData.operator) && 
      (t.productName === formData.product || t.product === formData.product) &&
      (t.productSize === size || t.size === size)
    );
    if (!target) {
      target = productionTargets.find(t => 
        (t.productName === formData.product || t.product === formData.product) &&
        (t.productSize === size || t.size === size)
      );
    }
    if (!target) return null;
    const remaining = Math.max(0, target.targetQty - (target.producedQty || 0));
    return {
      targetQty: target.targetQty,
      producedQty: target.producedQty || 0,
      remaining: remaining,
      isCompleted: (target.producedQty || 0) >= target.targetQty
    };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-picker-container')) {
        setShowProductionDatePicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getFilteredHistory = () => {
    let list = (productionHistory || []).filter(item => {
      if (item.date !== formatDate(productionDate)) return false;
      const matchesSearch = !historySearch.trim() ||
        (item.product?.toLowerCase() || "").includes(historySearch.toLowerCase()) ||
        (item.operator?.toLowerCase() || "").includes(historySearch.toLowerCase());
      const matchesSize = historySizeFilter === 'all' || item.size === historySizeFilter;
      return matchesSearch && matchesSize;
    });

    return list.sort((a, b) => {
       const dtA = dayjs(`${a.date} ${a.time}`, 'DD-MM-YYYY hh:mm A').unix();
       const dtB = dayjs(`${b.date} ${b.time}`, 'DD-MM-YYYY hh:mm A').unix();
       return dtB - dtA;
    });
  };

  const allFilteredItems = getFilteredHistory();
  const totalPages = Math.ceil(allFilteredItems.length / itemsPerPage);
  const paginatedHistory = allFilteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [productionDate, historySearch, historySizeFilter]);

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

  return (
    <div className={`daily-production-page ${showHistoryOnly ? 'mobile-history-active' : ''}`}>
      {showNotification && (
        <div className="notification-popup success">
          <div className="notification-content">
            <div className="notification-icon">
              {notificationType === 'success' && <span className="material-symbols-outlined">check_circle</span>}
              {notificationType === 'error' && <span className="material-symbols-outlined">error</span>}
            </div>
            <div className="notification-message">{notificationMessage}</div>
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
            className={`clear-all-btn-premium ${!isToday ? 'disabled-btn' : ''}`}
            disabled={!isToday}
            onClick={() => {
              setDateToClear(formatDate(productionDate));
              setShowClearConfirm(true);
            }}
          >
            <span className="material-symbols-outlined">{isToday ? 'delete_sweep' : 'lock'}</span>
            {isToday ? "Clear Today's Records" : "Records Locked"}
          </button>
        </div>
      </div>

      <div className="dashboard-content-main" style={{ display: showHistoryOnly ? 'none' : 'block' }}>
        <div className="production-main-grid">
          <div className="production-form-section">
            <div className="premium-entry-card">
              <div className="card-header entry-header">
                <h3><span className="material-symbols-outlined">add_circle</span> New Entry</h3>
              </div>
              <div className="card-body">
                <div className="entry-form-premium">
                  <div className="form-group-premium" style={{ opacity: isToday ? 1 : 0.6, pointerEvents: isToday ? 'auto' : 'none' }}>
                    <label>Production Date</label>
                    <div className="date-picker-container">
                      <button className="premium-input-btn" disabled={!isToday}>
                        <span className="material-symbols-outlined">event</span>
                        {formatDate(productionDate)}
                      </button>
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
                        {getSizesForProduct().map(s => {
                          const info = getSizeTargetInfo(s);
                          let text = s;
                          if (info) {
                            text = info.remaining <= 0 
                              ? `${s} (Complete)` 
                              : `${s} (Rem: ${info.remaining.toLocaleString()})`;
                          }
                          return <option key={s} value={s}>{text}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="form-row-premium">
                    <div className="form-group-premium">
                      <label>Quantity (pcs)</label>
                      <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="premium-input" placeholder="0" />
                    </div>
                  </div>

                  <div className="form-row-premium">
                    <div className="form-group-premium">
                      <label>Grade</label>
                      <select name="grade" value={formData.grade} onChange={handleInputChange} className="premium-select">
                        <option value="A">Grade A</option>
                        <option value="B">Grade B</option>
                      </select>
                    </div>
                    <div className="form-group-premium">
                      <label>Operator</label>
                      <select name="operator" value={formData.operator} onChange={handleInputChange} className="premium-select">
                        {operators.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>


                  <button 
                    className={`btn-premium-submit ${!isToday ? 'disabled-btn' : ''}`} 
                    onClick={isToday ? handleAddProduction : null}
                    disabled={!isToday}
                  >
                    <span className="material-symbols-outlined">{isToday ? 'rocket_launch' : 'lock'}</span>
                    {isToday ? 'SUBMIT' : 'LOCKED'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="production-summary-section">
            <div className="premium-card">
              <div className="card-header summary-header">
                <h3><span className="material-symbols-outlined">analytics</span> Daily Summary</h3>
                <div className="date-picker-container">
                  <button className="date-summary-btn master-date-btn" onClick={() => setShowProductionDatePicker(!showProductionDatePicker)}>
                    <span className="material-symbols-outlined">calendar_month</span> {formatDate(productionDate)}
                  </button>
                  {showProductionDatePicker && (
                    <div className="date-dropdown mui-calendar-dropdown right">
                      <CalendarPicker selectedDate={productionDate} onDateChange={(date) => { setProductionDate(date); setShowProductionDatePicker(false); }} onClose={() => setShowProductionDatePicker(false)} />
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="summary-total-banner">
                  <span>TOTAL: {(summaryData.total || 0).toLocaleString()} pcs</span>
                </div>
                <div className="summary-grid">
                  {availableSizes.map(size => (
                    <div key={size} className="size-card">
                      <div className="size-name"><span>{size}</span></div>
                      <div className="size-quantity">{summaryData.bySize[size] || 0}</div>
                      <div className="item-progress">
                        <div className="progress-fill" style={{ width: `${Math.min(100, (summaryData.bySize[size] || 0) / 500)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`history-full-view ${showHistoryOnly ? 'show' : ''}`}>
        <div className="history-section">
          <div className="premium-card">
            <div className="card-header table-header">
              <h3><span className="material-symbols-outlined">history</span> {isToday ? "Today" : formatDate(productionDate)} Production</h3>
              <div className="table-actions">
                <select value={historySizeFilter} onChange={(e) => setHistorySizeFilter(e.target.value)}>
                  <option value="all">All Sizes</option>
                  {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="search-box">
                  <input type="text" placeholder="Search..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="daily-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>TIME</th>
                    <th>OPERATOR</th>
                    <th>PRODUCT</th>
                    <th>SIZE (QTY)</th>
                    <th>GRADE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.map((record, idx) => (
                    <tr key={record.id || record._id || idx}>
                      <td>{((currentPage - 1) * itemsPerPage) + idx + 1}</td>
                      <td>{record.time}</td>
                      <td>{record.operator}</td>
                      <td>{record.product}</td>
                      <td>{record.size}: {record.quantity}</td>
                      <td>{record.grade}</td>
                      <td>
                        <div style={{ opacity: isToday ? 1 : 0.4, display: 'flex', gap: '8px' }}>
                          <button onClick={isToday ? () => handleEditProduction(record) : null} disabled={!isToday} className="btn-edit-premium">
                            <span className="material-symbols-outlined">{isToday ? 'edit' : 'lock'}</span>
                          </button>
                          <button onClick={isToday ? () => handleDeleteProduction(record) : null} disabled={!isToday} className="btn-delete">
                            <span className="material-symbols-outlined">{isToday ? 'delete' : 'lock'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="table-pagination-premium">
                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                   <span className="material-symbols-outlined">navigate_before</span>
                   Prev
                </button>
                <div className="page-info">
                  <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                </div>
                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                   Next
                   <span className="material-symbols-outlined">navigate_next</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && productionToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon warning">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <p className="modal-title">Delete this record?</p>
              <p className="modal-desc">
                You are about to delete the entry for <strong>{productionToDelete.size} {productionToDelete.product}</strong>. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="modal-confirm delete" onClick={confirmDeleteProduction}>Delete Record</button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Clear Daily Records</h3>
              <button className="modal-close" onClick={() => setShowClearConfirm(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon warning">
                <span className="material-symbols-outlined">delete_sweep</span>
              </div>
              <p className="modal-title">Clear All Records?</p>
              <p className="modal-desc">
                Are you sure you want to clear <strong>ALL</strong> production records for <strong>{dateToClear}</strong>? 
                This will permanently delete today's progress.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button className="modal-confirm delete" onClick={async () => {
                try {
                  await clearAllProduction(dateToClear);
                  showNotificationMessage(`✅ Production cleared for ${dateToClear}.`);
                  setShowClearConfirm(false);
                } catch (err) {
                  showNotificationMessage("❌ Failed to clear.", "error");
                }
              }}>Clear All</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingProduction && (
        <div className="modal-overlay">
          <div className="export-modal" style={{ padding: '24px' }}>
            <h2>Edit Record</h2>
            <div className="edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input type="number" value={editingProduction.quantity} onChange={(e) => setEditingProduction({...editingProduction, quantity: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button onClick={async () => {
                  try {
                    await updateProduction(editingProduction.id || editingProduction._id, editingProduction);
                    showNotificationMessage("Updated!");
                    setIsEditModalOpen(false);
                  } catch (err) {
                    showNotificationMessage("Error!", "error");
                  }
                }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;