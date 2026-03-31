import React, { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext.js";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal.js";
import "./Stock.css";
import plate8 from "../../assets/plate8.png";

const StockOverview = () => {
    const { stockData, productionTargets } = useAppContext();
    const navigate = useNavigate();
  const [filterType, setFilterType] = useState("All"); // All, Low Stock, Out of Stock
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null
  });

  // ========== CALCULATIONS ==========
  
  // Group and sort stock data alphabetically by name and numerically by size
  const groupedProducts = useMemo(() => {
    const grouped = stockData.reduce((acc, item) => {
      const name = item.name || "Unknown";
      if (!acc[name]) {
        acc[name] = {
          name: name,
          category: item.category || "General",
          variants: [],
          totalQuantity: 0
        };
      }
      
      // Sum up ALL targets for this specific product + size combination
      const relevantTargets = (productionTargets || []).filter(t => 
        (t.productName === name || t.product === name) && 
        (t.productSize === item.size || t.size === item.size)
      );
      
      const totalTgt = relevantTargets.reduce((sum, t) => sum + (Number(t.targetQty) || 0), 0);
      const totalDone = relevantTargets.reduce((sum, t) => sum + (Number(t.producedQty) || 0), 0);
      
      const variant = {
        ...item,
        status: item.quantity <= 0 ? "Out of Stock" : (item.quantity < 2000 ? "Low Stock" : "In Stock"),
        productionProgress: totalTgt > 0 ? Math.min(100, (totalDone / totalTgt) * 100) : 0,
        targetQty: totalTgt,
        producedQty: totalDone
      };
      
      acc[name].variants.push(variant);
      acc[name].totalQuantity += (item.quantity || 0);
      
      return acc;
    }, {});

    // Sort products by name and their variants by size
    return Object.values(grouped)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(group => ({
        ...group,
        variants: group.variants.sort((v1, v2) => {
          const s1 = parseInt(v1.size) || 0;
          const s2 = parseInt(v2.size) || 0;
          return s1 - s2;
        })
      }));
  }, [stockData, productionTargets]);

  const groupedItems = groupedProducts;

  // Stats calculation
  const stats = useMemo(() => {
    const total = stockData.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStockCount = stockData.filter(item => item.quantity > 0 && item.quantity < 2000).length;
    const outOfStockCount = stockData.filter(item => item.quantity <= 0).length;
    
    return {
      totalStock: total,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount
    };
  }, [stockData]);

  // Filtering logic
  const filteredGroups = useMemo(() => {
    if (filterType === "All") return groupedItems;
    
    return groupedItems.map(group => {
      const filteredVariants = group.variants.filter(v => {
        if (filterType === "Low Stock") return v.quantity > 0 && v.quantity < 2000;
        if (filterType === "Out of Stock") return v.quantity <= 0;
        return true;
      });
      
      if (filteredVariants.length === 0) return null;
      
      return {
        ...group,
        variants: filteredVariants
      };
    }).filter(Boolean);
  }, [groupedItems, filterType]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [exportFormat, setExportFormat] = useState('excel');
  const [exportType, setExportType] = useState('All'); // All, Low Stock, Out of Stock

  // Handlers
  

  
  const confirmExport = () => {
    setExportLoading(true);
    setShowExportModal(false);

    setTimeout(() => {
      setExportLoading(false);
      setExportSuccess(true);
      setFeedbackMessage(`✅ Stock report exported as ${exportFormat.toUpperCase()}`);

      // Filter data based on exportType
      let dataToExport = stockData;
      if (exportType === "Low Stock") {
        dataToExport = stockData.filter(item => item.quantity > 0 && item.quantity < 2000);
      } else if (exportType === "Out of Stock") {
        dataToExport = stockData.filter(item => item.quantity <= 0);
      }

      const fileName = `Stock_Report_${exportType}_${new Date().toISOString().split("T")[0]}`;

      if (exportFormat === "csv" || exportFormat === "excel") {
        const headers = ["Product Name", "Size", "SKU", "Category", "Quantity", "Status"];
        const csvData = dataToExport.map((item) => [
          item.name,
          item.size || "-",
          item.sku,
          item.category,
          `${item.quantity} pcs`,
          item.quantity <= 0 ? "Out of Stock" : (item.quantity < 2000 ? "Low Stock" : "In Stock")
        ]);
        const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`; 
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === "pdf") {
        const headers = ["Product Name", "Size", "SKU", "Category", "Quantity", "Status"];
        const csvData = dataToExport.map((item) => [
          item.name,
          item.size || "-",
          item.sku,
          item.category,
          item.quantity,
          item.quantity <= 0 ? "Out of Stock" : (item.quantity < 2000 ? "Low Stock" : "In Stock")
        ]);
        const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.csv`; 
        a.click();
      }

      setTimeout(() => {
        setExportSuccess(false);
        setFeedbackMessage("");
      }, 3000);
    }, 1200);
  };

  return (
    <div className="stock-overview-new">

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className={`feedback-toast-new ${exportSuccess ? 'success' : ''}`}>
          <span className="material-symbols-outlined">
            {exportSuccess ? "download_done" : "info"}
          </span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="page-header premium-header">
        <h1 className="page-title">Stock Overview</h1>
      </div>

      {/* ===== UNIFIED HERO STATUS BAR ===== */}
      <div className="stock-unified-hero-row">
        {/* TOTAL STOCK */}
        <div className="hero-stat-item secondary-alert blue-alert">
          <div className="hero-icon-box">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div className="hero-details">
            <span className="hero-label">TOTAL STOCK</span>
            <span className="hero-value">{stats.totalStock.toLocaleString("en-IN")} <small>pcs</small></span>
          </div>
        </div>

        {/* LOW STOCK */}
        <div className="hero-stat-item secondary-alert yellow-alert">
          <div className="hero-icon-box">
            <span className="material-symbols-outlined">report_problem</span>
          </div>
          <div className="hero-details">
            <span className="hero-label">LOW STOCK</span>
            <span className="hero-value">{stats.lowStock} <small>items</small></span>
          </div>
        </div>

        {/* OUT OF STOCK */}
        <div className="hero-stat-item secondary-alert red-alert">
          <div className="hero-icon-box">
            <span className="material-symbols-outlined">dangerous</span>
          </div>
          <div className="hero-details">
            <span className="hero-label">OUT OF STOCK</span>
            <span className="hero-value">{stats.outOfStock} <small>items</small></span>
          </div>
        </div>
      </div>

      {/* ===== FILTER TABS ===== */}
      <div className="filter-tabs-new">
        <button 
          className={`tab-new ${filterType === "All" ? "active" : ""}`}
          onClick={() => setFilterType("All")}
        >
          <span className="dot-new"></span>
          All
        </button>
        <button 
          className={`tab-new ${filterType === "Low Stock" ? "active" : ""}`}
          onClick={() => setFilterType("Low Stock")}
        >
          Low Stock
        </button>
        <button 
          className={`tab-new ${filterType === "Out of Stock" ? "active" : ""}`}
          onClick={() => setFilterType("Out of Stock")}
        >
          Out of Stock
        </button>
      </div>

      {/* ===== PRODUCT SECTIONS ===== */}
      <div className="products-container-new">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => (
            <div key={group.name} className="category-section-new">
              <h2 className="category-title-new">{group.name}</h2>
              <div className="product-grid-new">
                {group.variants.map((v, idx) => (
                  <div key={v._id || idx} className="product-card-new">
                    <div className="card-header-new">
                      <div className="plate-icon-new">
                        <img src={plate8} alt="Plate" />
                      </div>
                      <span className="card-product-name-new">{v.size}</span>
                    </div>

                    <div className={`status-badge-inline-new ${v.quantity <= 0 ? 'red pulse' : (v.quantity < 2000 ? 'yellow' : 'green')}`}>
                      {v.size} 
                      <span className="status-badge-text-new">
                        {v.quantity <= 0 ? 'OUT OF STOCK' : (v.quantity < 2000 ? 'LOW STOCK' : 'IN STOCK')}
                      </span>
                    </div>

                    <div className="main-quantity-new">
                      {v.quantity.toLocaleString("en-IN")} <span className="unit-small-new">plates</span>
                    </div>

                    {/* PRODUCTION PROGRESS BAR */}


                    <div 
                      className={`footer-status-btn-new ${v.quantity < 2000 ? (v.quantity <= 0 ? 'red' : 'yellow') : 'green disabled'}`}
                      style={{ cursor: v.quantity < 2000 ? 'pointer' : 'not-allowed', opacity: v.quantity < 2000 ? 1 : 0.6 }}
                      onClick={() => {
                        if (v.quantity < 2000) {
                          navigate("/production/daily");
                        }
                      }}
                    >
                       <span className="material-symbols-outlined icon-small-new">
                         {v.quantity <= 0 ? 'close' : (v.quantity < 2000 ? 'warning' : 'check_circle')}
                       </span>
                       {v.quantity < 2000 ? 'Manage Item' : 'Stock Full'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-new">
            <span className="material-symbols-outlined">inventory_2</span>
            <p>No products match the current filter.</p>
          </div>
        )}
      </div>

      {/* ===== PREMIUM EXPORT MODAL ===== */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Stock Inventory</h3>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="export-section">
                <h4>Export Format</h4>
                <div className="export-format-options">
                  <label className={`format-option ${exportFormat === 'excel' ? 'active' : ''}`}>
                    <input type="radio" value="excel" checked={exportFormat === 'excel'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span className="material-symbols-outlined">grid_on</span>
                    <span className="format-name">Excel (.xlsx)</span>
                  </label>
                  <label className={`format-option ${exportFormat === 'csv' ? 'active' : ''}`}>
                    <input type="radio" value="csv" checked={exportFormat === 'csv'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span className="material-symbols-outlined">description</span>
                    <span className="format-name">CSV (.csv)</span>
                  </label>
                  <label className={`format-option ${exportFormat === 'pdf' ? 'active' : ''}`}>
                    <input type="radio" value="pdf" checked={exportFormat === 'pdf'} onChange={(e) => setExportFormat(e.target.value)} />
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                    <span className="format-name">PDF (.pdf)</span>
                  </label>
                </div>
              </div>

              <div className="export-section">
                <h4>Stock Filter</h4>
                <div className="export-type-options">
                  <label className={`type-option ${exportType === 'All' ? 'active' : ''}`}>
                    <input type="radio" value="All" checked={exportType === 'All'} onChange={(e) => setExportType(e.target.value)} />
                    <span>All Products</span>
                  </label>
                  <label className={`type-option ${exportType === 'Low Stock' ? 'active' : ''}`}>
                    <input type="radio" value="Low Stock" checked={exportType === 'Low Stock'} onChange={(e) => setExportType(e.target.value)} />
                    <span>Low Stock Only</span>
                  </label>
                  <label className={`type-option ${exportType === 'Out of Stock' ? 'active' : ''}`}>
                    <input type="radio" value="Out of Stock" checked={exportType === 'Out of Stock'} onChange={(e) => setExportType(e.target.value)} />
                    <span>Out of Stock Only</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={confirmExport} disabled={exportLoading}>
                {exportLoading ? 'Processing...' : 'Export Now'}
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