import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext.js";
import ConfirmModal from "../../components/ConfirmModal.js";
import "./Stock.css";

const StockOverview = () => {
  const { stockData, resetAllStockData } = useAppContext();
  const [resetLoading, setResetLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null
  });

  // Group stock data by name and sort by size numerically
  const groupedProducts = stockData.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = {
        name: item.name,
        variants: [],
        totalQuantity: 0,
        totalValue: 0
      };
    }
    // calculate value for this variant
    const calcValue = (item.quantity * item.perPlateRate) || item.totalValue || 0;
    
    acc[item.name].variants.push({
      ...item,
      calculatedValue: calcValue
    });
    
    // Sort variants by size numerically (e.g., 6-inch, 8-inch, 10-inch, 12-inch)
    acc[item.name].variants.sort((a, b) => {
      const sizeA = parseInt(a.size) || 0;
      const sizeB = parseInt(b.size) || 0;
      return sizeA - sizeB;
    });

    acc[item.name].totalQuantity += (item.quantity || 0);
    acc[item.name].totalValue += calcValue;
    return acc;
  }, {});

  const groupedItems = Object.values(groupedProducts);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // ========== HANDLERS ==========
  const handleExport = () => setShowExportModal(true);
  
  const handleResetAll = () => {
    setConfirmModal({
        isOpen: true,
        title: "Reset Database Stock",
        message: "CRITICAL: This will PERMANENTLY delete all Production history, Sales history, and reset stocks to zero. This cannot be undone.",
        onConfirm: async () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setResetLoading(true);
            try {
                await resetAllStockData();
                setFeedbackMessage("Stock zeroed successfully.");
                setTimeout(() => setFeedbackMessage(""), 4000);
            } catch (error) {
                setFeedbackMessage("Err: Connection issues.");
            } finally {
                setResetLoading(false);
            }
        }
    });
  };
  
  
  const confirmExport = (format) => {
    setExportLoading(true);
    setTimeout(() => {
      setExportLoading(false);
      setShowExportModal(false);
      setExportSuccess(true);
      setFeedbackMessage(`Stock report exported as ${format}`);

      if (format === "CSV") {
        const headers = ["Product Name", "Size", "Per Plate Rate", "SKU", "Category", "Quantity", "Unit Price", "Total Value", "Status"];
        const csvData = stockData.map((item) => [
          item.name,
          item.size || "-",
          item.perPlateRate ? `₹${item.perPlateRate}` : "-",
          item.sku,
          item.category,
          `${item.quantity} ${item.unit}`,
          `₹${item.price}`,
          `₹${item.totalValue}`,
          item.status,
        ]);
        const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
      }

      setTimeout(() => {
        setExportSuccess(false);
        setFeedbackMessage("");
      }, 3000);
    }, 1500);
  };

  // Replaced unused formatCurrency

  return (
    <div className="stock-page">

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="feedback-toast">
          <span className="material-symbols-outlined">
            {feedbackMessage.includes("deleted") ? "delete" : feedbackMessage.includes("updated") ? "edit" : "check_circle"}
          </span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {exportSuccess && (
        <div className="feedback-toast success">
          <span className="material-symbols-outlined">download_done</span>
          <span>Export completed successfully</span>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="page-header premium-header">
        <div>
          <h1 className="page-title">Stock Overview</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn-export-premium" 
            onClick={handleResetAll} 
            disabled={resetLoading}
            style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              borderColor: '#fecaca',
              marginRight: '12px'
            }}
          >
            <span className="material-symbols-outlined">
              {resetLoading ? "hourglass_empty" : "restart_alt"}
            </span>
            {resetLoading ? "Resetting..." : "Reset All Data"}
          </button>

          <button className="btn-export-premium" onClick={handleExport}>
            <span className="material-symbols-outlined">
              {exportLoading ? "hourglass_empty" : "file_download"}
            </span>
            {exportLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Stats Cards removed as per user request */}

      {/* ===== STOCK DETAILS ===== */}
      <div className="stock-table-container">
        <div className="table-header centered-header">
          <h2 className="section-title">Stock Details</h2>
        </div>

        {/* DESKTOP TABLE */}
        <div className="table-responsive desktop-table-view">
          <table className="stock-table grouped-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Product Name</th>
                <th style={{ textAlign: 'center' }}>Size</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'center' }}>Total Stock</th>
              </tr>
            </thead>
            <tbody>
              {groupedItems.length > 0 ? (
                groupedItems.map((group) => (
                  <React.Fragment key={group.name}>
                    {group.variants.map((v, idx) => (
                      <tr key={v.id || v.sku || idx} className="product-variant-row" style={{ borderBottom: idx === group.variants.length - 1 ? '2px solid #e2e8f0' : '1px solid #f1f5f9' }}>
                        
                        {idx === 0 && (
                          <td className="group-name-cell" rowSpan={group.variants.length} style={{ textAlign: 'center' }}>
                            <div className="product-info-cell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span className="product-name">{group.name}</span>
                              <span className="variant-label-badge">
                                {group.variants.length} Sizes
                              </span>
                            </div>
                          </td>
                        )}

                        <td className="size-cell" style={{ textAlign: 'center' }}>
                          <span className="size-badge-premium">{v.size || "-"}</span>
                        </td>
                        
                        <td className="quantity-cell" style={{ textAlign: 'center' }}>
                          <span className={`stock-level ${v.quantity < 0 ? 'negative' : ''}`}>
                            {v.quantity.toLocaleString("en-IN")} pcs
                          </span>
                        </td>

                        {idx === 0 && (
                          <td className="total-stock-group-cell" rowSpan={group.variants.length} style={{ textAlign: 'center' }}>
                            {group.totalQuantity.toLocaleString("en-IN")} pcs
                          </td>
                        )}



                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <span className="material-symbols-outlined empty-icon">inventory</span>
                      <h4>No items found</h4>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="mobile-cards-view">
          {groupedItems.length > 0 ? (
            groupedItems.map((group) => (
              <div key={group.name} className="stock-mobile-card premium-mobile-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {/* Card Header */}
                <div className="smc-header" style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="smc-name" style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{group.name}</span>
                    <span className="smc-sku" style={{ 
                      marginTop: '10px', 
                      display: 'inline-block', 
                      background: '#ecfdf5', 
                      padding: '6px 12px', 
                      borderRadius: '30px', 
                      fontWeight: '800', 
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 5px rgba(16, 185, 129, 0.1)'
                    }}>
                      {group.variants.length} Sizes
                    </span>
                  </div>
                </div>
                {/* Card Rows */}
                <div className="smc-body" style={{ padding: '0' }}>
                  {group.variants.map((v, idx) => (
                    <div key={v.sku || idx} style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="size-badge">{v.size || "-"}</span>
                          <span style={{ fontWeight: '700', fontSize: '15px', color: '#334155' }}>{v.quantity.toLocaleString("en-IN")} pcs</span>
                       </div>
                    </div>
                  ))}
                  <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>Total Stock</span>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{group.totalQuantity.toLocaleString("en-IN")} pcs</span>
                     </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <span className="material-symbols-outlined empty-icon">inventory</span>
              <h4>No items found</h4>
            </div>
          )}
        </div>
      </div>

      {/* ===== EXPORT MODAL ===== */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Stock Report</h3>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon info">
                <span className="material-symbols-outlined">download</span>
              </div>
              <p className="modal-title">Choose Export Format</p>
              <p className="modal-desc">Export all stock items with current quantities and values</p>
              <div className="export-options">
                <button className="export-option-btn" onClick={() => confirmExport("CSV")}>
                  <span className="material-symbols-outlined">description</span>
                  <span>CSV File</span>
                </button>
                <button className="export-option-btn" onClick={() => confirmExport("PDF")}>
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                  <span>PDF Report</span>
                </button>
                <button className="export-option-btn" onClick={() => confirmExport("Excel")}>
                  <span className="material-symbols-outlined">grid_on</span>
                  <span>Excel File</span>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowExportModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== CONFIRMATION MODAL ===== */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default StockOverview;