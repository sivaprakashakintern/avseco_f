import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
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
  // Mobile card expand state
  const [expandedProdId, setExpandedProdId] = useState(null);
  const toggleProdCard = (id) => setExpandedProdId(prev => prev === id ? null : id);

  // ========== STATE MANAGEMENT ==========
  // Notification State
  const [historySearch, setHistorySearch] = useState('');
  const [historySizeFilter, setHistorySizeFilter] = useState('all');
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);

  const { productionHistory, productionTargets, deleteProduction } = useAppContext();





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


      <div className="page-header premium-header">
        <div className="header-left">
          <h1 className="page-title">Daily Production</h1>
        </div>
        <div className="header-actions">
          {/* Export button removed */}
        </div>
      </div>

      {/* --- DASHBOARD SECTION --- */}
      {/* --- PREMIUM DASHBOARD SECTION --- */}
      

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