import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext.js";
import "./Stock.css";

const StockOverview = () => {
  const { stockData, totalStockUnits } = useAppContext();

  // Low stock logic (threshold 3000)
  const lowStockItems = stockData.filter(item => item.quantity < 3000);
  const lowStockSizes = lowStockItems.map(item => item.size);

  const stats = {
    totalProducts: [...new Set(stockData.map(p => p.name))].length,
    lowStock: lowStockItems.length,
    lowStockDetails: lowStockSizes,
    totalStock: totalStockUnits,
    plateTypes: stockData.length,
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const filteredItems = stockData;

  // ========== HANDLERS ==========
  const handleExport = () => setShowExportModal(true);

  const confirmExport = (format) => {
    setExportLoading(true);
    setTimeout(() => {
      setExportLoading(false);
      setShowExportModal(false);
      setExportSuccess(true);
      setFeedbackMessage(`Stock report exported as ${format}`);

      if (format === "CSV") {
        const headers = ["Product Name", "Size", "Per Plate Rate", "SKU", "Category", "Quantity", "Unit Price", "Total Value", "Status"];
        const csvData = filteredItems.map((item) => [
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

  const formatCurrency = (value) =>
    `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
          <button className="btn-export-premium" onClick={handleExport}>
            <span className="material-symbols-outlined">
              {exportLoading ? "hourglass_empty" : "file_download"}
            </span>
            {exportLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="stock-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">inventory</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats.totalProducts}</span>
          </div>
        </div>

        <div className="stat-card clickable">
          <div className="stat-icon yellow">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Low Stock</span>
            <div className="stat-value-container">
              <span className="stat-value">{stats.lowStock}</span>
              {stats.lowStockDetails.length > 0 && (
                <span className="stat-detail">({stats.lowStockDetails.join(", ")})</span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <span className="material-symbols-outlined">category</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Stock</span>
            <span className="stat-value">{stats.totalStock.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <span className="material-symbols-outlined">flatware</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Plate Types</span>
            <span className="stat-value">{stats.plateTypes}</span>
          </div>
        </div>
      </div>

      {/* ===== STOCK DETAILS ===== */}
      <div className="stock-table-container">
        <div className="table-header">
          <h2 className="section-title">Stock Details</h2>
        </div>

        {/* DESKTOP TABLE */}
        <div className="table-responsive desktop-table-view">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Product &amp; SKU</th>
                <th>Size</th>
                <th>Stock</th>
                <th>Per Plate Price</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="product-info-cell">
                        <span className="product-name">{item.name}</span>
                        <span className="product-sku">{item.sku}</span>
                      </div>
                    </td>
                    <td>
                      {item.size && item.size !== "-" ? <span className="size-badge">{item.size}</span> : "-"}
                    </td>
                    <td className="quantity-cell">{item.quantity.toLocaleString("en-IN")} Pieces</td>
                    <td className="per-plate-cell">{item.perPlateRate > 0 ? formatCurrency(item.perPlateRate) : "-"}</td>
                  </tr>
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

        {/* MOBILE CARDS — renders natively, no CSS hacks */}
        <div className="mobile-cards-view">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="stock-mobile-card">
                {/* Card Header */}
                <div className="smc-header">
                  <span className="smc-name">{item.name}</span>
                  <span className="smc-sku">{item.sku}</span>
                </div>
                {/* Card Rows */}
                <div className="smc-body">
                  <div className="smc-row">
                    <span className="smc-label">Size</span>
                    <span className="size-badge">{item.size || "-"}</span>
                  </div>
                  <div className="smc-row">
                    <span className="smc-label">Stock</span>
                    <span className="smc-value">{item.quantity.toLocaleString("en-IN")} Pieces</span>
                  </div>
                  <div className="smc-row">
                    <span className="smc-label">Price</span>
                    <span className="smc-price">
                      {item.perPlateRate > 0 ? formatCurrency(item.perPlateRate) : "-"}
                    </span>
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
    </div>
  );
};

export default StockOverview;