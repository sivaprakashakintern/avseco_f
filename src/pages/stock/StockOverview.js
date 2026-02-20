import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Stock.css";

const StockOverview = () => {
  const navigate = useNavigate();
  
  // ========== STATE MANAGEMENT ==========
  const [stockItems, setStockItems] = useState([
    {
      id: 1,
      name: "Areca Leaf - Grade A",
      sku: "RM-AL-001",
      category: "Raw Material",
      quantity: 1250,
      unit: "kg",
      price: 45,
      totalValue: 56250,
      status: "normal",
    },
    {
      id: 2,
      name: "Packaging Box - Small",
      sku: "PK-BX-001",
      category: "Packaging",
      quantity: 45,
      unit: "pcs",
      price: 12,
      totalValue: 540,
      status: "low",
    },
    {
      id: 3,
      name: "Areca Leaf - Grade B",
      sku: "RM-AL-002",
      category: "Raw Material",
      quantity: 850,
      unit: "kg",
      price: 38,
      totalValue: 32300,
      status: "normal",
    },
    {
      id: 4,
      name: "Labels - Premium",
      sku: "LB-PR-001",
      category: "Packaging",
      quantity: 280,
      unit: "pcs",
      price: 5,
      totalValue: 1400,
      status: "low",
    },
    {
      id: 5,
      name: "Cleaning Supplies",
      sku: "CS-GN-001",
      category: "Supplies",
      quantity: 15,
      unit: "units",
      price: 85,
      totalValue: 1275,
      status: "critical",
    },
    {
      id: 6,
      name: "Finished Plates - 10 inch",
      sku: "FG-PL-010",
      category: "Finished Goods",
      quantity: 3200,
      unit: "pcs",
      price: 18,
      totalValue: 57600,
      status: "normal",
    },
    {
      id: 7,
      name: "Finished Bowls - 6 inch",
      sku: "FG-BL-006",
      category: "Finished Goods",
      quantity: 1850,
      unit: "pcs",
      price: 12,
      totalValue: 22200,
      status: "normal",
    },
  ]);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    categories: 12,
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states for add/edit
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Raw Material",
    quantity: "",
    unit: "kg",
    price: "",
    threshold: 100,
  });

  // ========== CALCULATE STATS ==========
  useEffect(() => {
    const totalItems = stockItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = stockItems.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStock = stockItems.filter(
      (item) => item.status === "low" || item.status === "critical"
    ).length;

    setStats({
      totalItems,
      totalValue,
      lowStock,
      categories: [...new Set(stockItems.map((item) => item.category))].length,
    });
  }, [stockItems]);

  // ========== FILTERED ITEMS ==========
  const filteredItems = stockItems.filter((item) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    // Status filter
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ========== UNIQUE CATEGORIES FOR FILTER ==========
  const categories = ["all", ...new Set(stockItems.map((item) => item.category))];

  // ========== NAVIGATION HANDLERS ==========
  const handleNavigation = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  // ========== HANDLERS ==========

  // Add Stock
  const handleAddStock = () => {
    setFormData({
      name: "",
      sku: "",
      category: "Raw Material",
      quantity: "",
      unit: "kg",
      price: "",
      threshold: 100,
    });
    setShowAddModal(true);
  };

  const confirmAddStock = () => {
    // Validate form
    if (
      !formData.name ||
      !formData.sku ||
      !formData.quantity ||
      !formData.price
    ) {
      setFeedbackMessage("Please fill all required fields");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const quantity = parseInt(formData.quantity);
    const price = parseInt(formData.price);
    const totalValue = quantity * price;

    // Determine status based on threshold
    let status = "normal";
    if (quantity < formData.threshold * 0.5) {
      status = "critical";
    } else if (quantity < formData.threshold) {
      status = "low";
    }

    const newItem = {
      id: stockItems.length + 1,
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      quantity: quantity,
      unit: formData.unit,
      price: price,
      totalValue: totalValue,
      status: status,
      threshold: formData.threshold,
    };

    setStockItems([...stockItems, newItem]);
    setShowAddModal(false);
    setFeedbackMessage("Stock item added successfully");

    // Reset form
    setFormData({
      name: "",
      sku: "",
      category: "Raw Material",
      quantity: "",
      unit: "kg",
      price: "",
      threshold: 100,
    });

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Edit Stock
  const handleEditStock = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      threshold: item.threshold || 100,
    });
    setShowEditModal(true);
  };

  const confirmEditStock = () => {
    if (!selectedItem) return;

    const quantity = parseInt(formData.quantity);
    const price = parseInt(formData.price);
    const totalValue = quantity * price;

    // Determine status based on threshold
    let status = "normal";
    if (quantity < formData.threshold * 0.5) {
      status = "critical";
    } else if (quantity < formData.threshold) {
      status = "low";
    }

    const updatedItems = stockItems.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            name: formData.name,
            sku: formData.sku,
            category: formData.category,
            quantity: quantity,
            unit: formData.unit,
            price: price,
            totalValue: totalValue,
            status: status,
            threshold: formData.threshold,
          }
        : item
    );

    setStockItems(updatedItems);
    setShowEditModal(false);
    setSelectedItem(null);
    setFeedbackMessage("Stock item updated successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Delete Stock
  const handleDeleteStock = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteStock = () => {
    if (!selectedItem) return;

    const filteredItems = stockItems.filter((item) => item.id !== selectedItem.id);
    setStockItems(filteredItems);
    setShowDeleteModal(false);
    setSelectedItem(null);
    setFeedbackMessage("Stock item deleted successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Export Handler
  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = (format) => {
    setExportLoading(true);

    // Simulate export API call
    setTimeout(() => {
      setExportLoading(false);
      setShowExportModal(false);
      setExportSuccess(true);
      setFeedbackMessage(`Stock report exported as ${format}`);

      // Create CSV data
      if (format === "CSV") {
        const headers = ["Product Name", "SKU", "Category", "Quantity", "Unit Price", "Total Value", "Status"];
        const csvData = stockItems.map((item) => [
          item.name,
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
    return `₹${value.toLocaleString("en-IN")}`;
  };

  // Format quantity with unit
  const formatQuantity = (quantity, unit) => {
    return `${quantity.toLocaleString("en-IN")} ${unit}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
              : feedbackMessage.includes("added")
              ? "add"
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

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Overview</h1>
          <p className="page-subtitle">Real-time inventory management</p>
        </div>
        <div className="header-actions">
          {/* Dropdown Menu */}
          <div className="dropdown-container">
            <button 
              className="btn-outline dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
              View Pages
              <span className="material-symbols-outlined dropdown-arrow">
                {isDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header"></div>
                <button 
                  className="dropdown-item active"
                  onClick={() => handleNavigation('/stock')}
                >
                  <span className="material-symbols-outlined">inventory</span>
                  <span>Stock Overview</span>
                  <span className="material-symbols-outlined check">check</span>
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleNavigation('/stock/transfer')}
                >
                  <span className="material-symbols-outlined">swap_horiz</span>
                  <span>StockTransfer</span>
                </button>
               <button 
  className="dropdown-item"
  onClick={() => handleNavigation('/stock/production')} // <-- use this exact path
>
  <span className="material-symbols-outlined">factory</span>
  <span>Production</span>
</button>

                <div className="dropdown-divider"></div>
                <div className="dropdown-footer">
                 
                </div>
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={handleAddStock}>
            <span className="material-symbols-outlined">add</span>
            Add Stock
          </button>
          <button className="btn-outline" onClick={handleExport}>
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
            <span className="stat-label">Total Items</span>
            <span className="stat-value">{stats.totalItems.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <span className="material-symbols-outlined">currency_rupee</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
          </div>
        </div>
        <div 
          className="stat-card clickable"
          onClick={() => setStatusFilter("low")}
        >
          <div className="stat-icon yellow">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Low Stock</span>
            <span className="stat-value">{stats.lowStock}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Categories</span>
            <span className="stat-value">{stats.categories}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="stock-filters">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="filter-group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="normal">Normal</option>
            <option value="low">Low Stock</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="stock-table-container">
        <div className="table-header">
          <h3>
            Stock Items
            {filteredItems.length < stockItems.length && (
              <span className="filter-badge">
                Filtered: {filteredItems.length} items
              </span>
            )}
          </h3>
          {(categoryFilter !== "all" || statusFilter !== "all" || searchTerm) && (
            <button
              className="clear-filters-btn"
              onClick={() => {
                setCategoryFilter("all");
                setStatusFilter("all");
                setSearchTerm("");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="product-info">
                        <div className="product-icon">
                          <span className="material-symbols-outlined">
                            {item.category === "Raw Material"
                              ? "grass"
                              : item.category === "Packaging"
                              ? "inventory"
                              : item.category === "Finished Goods"
                              ? "shopping_bag"
                              : "category"}
                          </span>
                        </div>
                        <span className="product-name">{item.name}</span>
                      </div>
                    </td>
                    <td className="product-sku">{item.sku}</td>
                    <td>{item.category}</td>
                    <td>{formatQuantity(item.quantity, item.unit)}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td className="product-value">{formatCurrency(item.totalValue)}</td>
                    <td>
                      <span className={getStatusBadge(item.status)}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEditStock(item)}
                          title="Edit"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteStock(item)}
                          title="Delete"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    <div className="empty-state">
                      <span className="material-symbols-outlined empty-icon">
                        inventory
                      </span>
                      <h4>No items found</h4>
                      <p>Try adjusting your filters or add new stock items</p>
                      <button className="btn-primary" onClick={handleAddStock}>
                        Add Stock Item
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-footer">
          <div className="pagination-info">
            Showing {filteredItems.length} of {stockItems.length} items
          </div>
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Stock Item</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className="modal-input"
                />
              </div>
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Enter SKU"
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="modal-select"
                  >
                    <option>Raw Material</option>
                    <option>Packaging</option>
                    <option>Finished Goods</option>
                    <option>Supplies</option>
                  </select>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="modal-select"
                  >
                    <option>kg</option>
                    <option>pcs</option>
                    <option>units</option>
                    <option>boxes</option>
                  </select>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>Unit Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    name="threshold"
                    value={formData.threshold}
                    onChange={handleInputChange}
                    placeholder="100"
                    className="modal-input"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="modal-confirm" onClick={confirmAddStock}>
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Stock Item</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="modal-input"
                />
              </div>
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="modal-select"
                  >
                    <option>Raw Material</option>
                    <option>Packaging</option>
                    <option>Finished Goods</option>
                    <option>Supplies</option>
                  </select>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="modal-select"
                  >
                    <option>kg</option>
                    <option>pcs</option>
                    <option>units</option>
                    <option>boxes</option>
                  </select>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>Unit Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    name="threshold"
                    value={formData.threshold}
                    onChange={handleInputChange}
                    className="modal-input"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button className="modal-confirm" onClick={confirmEditStock}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Stock Item</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon warning">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <p className="modal-title">Are you sure?</p>
              <p className="modal-desc">
                You are about to delete <strong>{selectedItem.name}</strong> from
                your inventory. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="modal-confirm delete" onClick={confirmDeleteStock}>
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

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