import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Stock.css";

const StockOverview = () => {
  const navigate = useNavigate();

  // ========== STATE MANAGEMENT ==========
  const [stockItems, setStockItems] = useState([
    {
      id: 1,
      name: "Areca Leaf Plate",
      sku: "FG-PL-006",
      category: "Finished Goods",
      quantity: 6000,
      unit: "pcs",
      price: 6.50,
      totalValue: 39000,
      status: "normal",
      size: "6 inch",
      perPlateRate: 6.50
    },
    {
      id: 2,
      name: "Areca Leaf Plate",
      sku: "FG-PL-008",
      category: "Finished Goods",
      quantity: 5000,
      unit: "pcs",
      price: 8.50,
      totalValue: 42500,
      status: "normal",
      size: "8 inch",
      perPlateRate: 8.50
    },
    {
      id: 3,
      name: "Areca Leaf Plate",
      sku: "FG-PL-010",
      category: "Finished Goods",
      quantity: 3200,
      unit: "pcs",
      price: 12.00,
      totalValue: 38400,
      status: "normal",
      size: "10 inch",
      perPlateRate: 12.00
    },
    {
      id: 4,
      name: "Areca Leaf Plate",
      sku: "FG-PL-012",
      category: "Finished Goods",
      quantity: 2500,
      unit: "pcs",
      price: 15.00,
      totalValue: 37500,
      status: "normal",
      size: "12 inch",
      perPlateRate: 15.00
    }
  ]);

  // Stats state
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    lowStockDetails: [],
    totalStock: 0,
    plateTypes: 4,
  });

  // Selected product and view state
  const [selectedProduct, setSelectedProduct] = useState("Areca Leaf Plate");
  const [viewMode, setViewMode] = useState("product"); // "product" or "size"

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Form states for edit
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Raw Material",
    quantity: "",
    unit: "kg",
    price: "",
    threshold: 100,
    size: "",
    perPlateRate: "",
  });

  // ========== GET UNIQUE PRODUCTS ==========
  const uniqueProducts = [...new Set(stockItems.map(item => item.name))];

  // ========== FILTER ITEMS BASED ON SELECTION ==========
  const getFilteredItems = () => {
    return stockItems;
  };

  const filteredItems = getFilteredItems();

  useEffect(() => {
    // Force total products to 1 as requested
    const totalProducts = 1;

    // Tally total stock from filtered items to ensure they match
    const totalStockValue = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

    // Identify low stock items (e.g., threshold < 3000)
    const lowStockItems = filteredItems.filter(item => item.quantity < 3000);
    const lowStockSizes = lowStockItems.map(item => item.size);

    setStats({
      totalProducts: 1,
      lowStock: lowStockItems.length,
      lowStockDetails: lowStockSizes,
      totalStock: totalStockValue,
      plateTypes: 4,
    });
  }, [filteredItems]);

  // ========== NAVIGATION HANDLERS ==========


  // ========== HANDLERS ==========







  // Export Handler
  const handleExport = () => {
    setShowExportModal(true);
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

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case "critical":
        return "status-badge critical";
      case "low":
        return "status-badge low";
      default:
        return "status-badge normal";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "critical":
        return "Critical";
      case "low":
        return "Low Stock";
      default:
        return "Normal";
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format quantity with unit
  const formatQuantity = (quantity, unit) => {
    return `${quantity.toLocaleString("en-IN")} ${unit}`;
  };

  return (
    <div className="stock-page">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="feedback-toast">
          <span className="material-symbols-outlined">
            {feedbackMessage.includes("deleted")
              ? "delete"
              : feedbackMessage.includes("updated")
                ? "edit"
                : "check_circle"}
          </span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Export Success Toast */}
      {exportSuccess && (
        <div className="feedback-toast success">
          <span className="material-symbols-outlined">download_done</span>
          <span>Export completed successfully</span>
        </div>
      )}

      {/* ===== PREMIUM ANALYTICS HEADER ===== */}
      <div className="page-header premium-header">
        <div>
          <h1 className="page-title">Stock Overview</h1>
          <p className="page-subtitle">Real-time inventory management and tracking</p>
        </div>
        <div className="header-actions">

          <button className="btn-export-premium" onClick={handleExport}>
            <span className="material-symbols-outlined">
              {exportLoading ? "hourglass_empty" : "download"}
            </span>
            {exportLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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

        <div
          className="stat-card clickable"
          onClick={() => {/* You can add low stock filter logic here if needed */ }}
        >
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

      {/* Product Selection Removed */}

      {/* Selection Summary Section removed as requested */}

      {/* Stock Table View */}
      <div className="stock-table-container">
        <div className="table-header">
          <h2 className="section-title">
            Stock Details
          </h2>
        </div>
        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Product & SKU</th>
                <th>Size</th>
                <th>Pieces</th>
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
                    <td>{item.size && item.size !== "-" ? <span className="size-badge">{item.size}</span> : "-"}</td>
                    <td className="quantity-cell">{item.quantity.toLocaleString("en-IN")} Pieces</td>
                    <td className="per-plate-cell">{item.perPlateRate > 0 ? formatCurrency(item.perPlateRate) : "-"}</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data-cell">
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
      </div>

      {/* Results Summary Removed */}





      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Stock Report</h3>
              <button
                className="modal-close"
                onClick={() => setShowExportModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon info">
                <span className="material-symbols-outlined">download</span>
              </div>
              <p className="modal-title">Choose Export Format</p>
              <p className="modal-desc">
                Export all stock items with current quantities and values
              </p>
              <div className="export-options">
                <button
                  className="export-option-btn"
                  onClick={() => confirmExport("CSV")}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span>CSV File</span>
                </button>
                <button
                  className="export-option-btn"
                  onClick={() => confirmExport("PDF")}
                >
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                  <span>PDF Report</span>
                </button>
                <button
                  className="export-option-btn"
                  onClick={() => confirmExport("Excel")}
                >
                  <span className="material-symbols-outlined">grid_on</span>
                  <span>Excel File</span>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowExportModal(false)}
              >
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