import React, { useState } from "react";
import "./ProductList.css";

// Removed image imports as per user request


const ProductList = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [selectedSize, setSelectedSize] = useState("All Sizes");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Product Data with ONLY 4 PLATE images
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Areca Round Plate",
      sku: "ARP-6RND-03",
      size: "6-inch",
      category: "Plates",
      costPrice: 2.80,
      sellPrice: 5.00,
      margin: "44.0%",
    },
    {
      id: 2,
      name: "Areca Round Plate",
      sku: "ARP-8RND-04",
      size: "8-inch",
      category: "Plates",
      costPrice: 3.50,
      sellPrice: 6.50,
      margin: "46.2%",
    },
    {
      id: 3,
      name: "Areca Round Plate",
      sku: "ARP-10RND-01",
      size: "10-inch",
      category: "Plates",
      costPrice: 4.50,
      sellPrice: 8.00,
      margin: "43.7%",
    },
    {
      id: 4,
      name: "Areca Round Plate",
      sku: "ARP-12RND-07",
      size: "12-inch",
      category: "Plates",
      costPrice: 5.80,
      sellPrice: 10.50,
      margin: "44.8%",
    },
  ]);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    size: "10-inch",
    selectedSizes: [], // For multiple size selection in Add modal
    category: "Plates",
    costPrice: "",
    sellPrice: "",
  });

  // Get unique sizes for filter
  const uniqueSizes = ["All Sizes", ...new Set(products.map(p => p.size))].sort();

  // Filter products based on size, category, and search
  const filteredProducts = products.filter((product) => {
    // Size filter
    const matchesSize = selectedSize === "All Sizes" || product.size === selectedSize;

    // Category filter (always true since only Plates)
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;

    // Search filter
    const matchesSearch = searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSize && matchesCategory && matchesSearch;
  });

  const stats = {
    totalProducts: [...new Set(products.map(p => p.name))].length,
  };

  // State for detail view
  const [viewingProductName, setViewingProductName] = useState(null);

  // Grouped products for the main view
  const productGroups = products.reduce((acc, product) => {
    if (!acc[product.name]) {
      acc[product.name] = [];
    }
    acc[product.name].push(product);
    return acc;
  }, {});

  const uniqueProductNames = Object.keys(productGroups).filter(name => {
    const group = productGroups[name];
    return group.some(p => {
      const matchesSize = selectedSize === "All Sizes" || p.size === selectedSize;
      const matchesSearch = searchTerm === "" ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSize && matchesSearch;
    });
  });

  // ========== HANDLERS ==========

  // Add Product
  const handleAddProduct = () => {
    setFormData({
      name: "",
      sku: "",
      size: "10-inch",
      selectedSizes: [],
      category: "Plates",
      costPrice: "",
      sellPrice: "",
    });
    setShowAddModal(true);
  };

  const confirmAddProduct = () => {
    // Validate form
    if (!formData.name || formData.selectedSizes.length === 0) {
      setFeedbackMessage("Please enter name and select at least one size");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const newEntries = formData.selectedSizes.map((size, index) => {


      const cost = 0;
      const sell = 0;
      const margin = "0.0%";

      // Auto-generate SKU
      const autoSku = `ARP-${size.replace("-inch", "")}RND-${Math.floor(Math.random() * 90 + 10)}`;

      return {
        id: products.length + index + 1,
        name: formData.name,
        sku: autoSku,
        size: size,
        category: "Plates",
        costPrice: cost,
        sellPrice: sell,
        margin: margin,
      };
    });

    setProducts([...products, ...newEntries]);
    setShowAddModal(false);
    setFeedbackMessage(`${newEntries.length} product(s) added successfully`);

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Edit Product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      size: product.size,
      category: "Plates",
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
    });
    setShowEditModal(true);
  };

  const confirmEditProduct = () => {
    if (!selectedProduct) return;

    const cost = parseFloat(formData.costPrice);
    const sell = parseFloat(formData.sellPrice);
    const margin = ((sell - cost) / sell * 100).toFixed(1) + "%";

    const updatedProducts = products.map((p) =>
      p.id === selectedProduct.id
        ? {
          ...p,
          name: formData.name,
          sku: formData.sku,
          size: formData.size,
          category: "Plates",
          costPrice: cost,
          sellPrice: sell,
          margin: margin,
        }
        : p
    );

    setProducts(updatedProducts);
    setShowEditModal(false);
    setSelectedProduct(null);
    setFeedbackMessage("Product updated successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Delete Product
  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = () => {
    if (!selectedProduct) return;

    const filteredProducts = products.filter((p) => p.id !== selectedProduct.id);
    setProducts(filteredProducts);
    setShowDeleteModal(false);
    setSelectedProduct(null);
    setFeedbackMessage("Product deleted successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Form input change handler
  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      const currentSizes = [...formData.selectedSizes];
      if (checked) {
        setFormData({
          ...formData,
          selectedSizes: [...currentSizes, value]
        });
      } else {
        setFormData({
          ...formData,
          selectedSizes: currentSizes.filter(s => s !== value)
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedSize("All Sizes");
    setSelectedCategory("all");
    setSearchTerm("");
  };

  // Format currency
  const formatCurrency = (value) => {
    return `₹${value.toFixed(2)}`;
  };

  // Get product abbreviation (first word)
  const getAbbr = (name) => {
    return name ? name.split(" ")[0] : "Product";
  };

  return (
    <div className="product-list-container">

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="feedback-toast">
          <span className="material-symbols-outlined">
            {feedbackMessage.includes("deleted") ? "delete" :
              feedbackMessage.includes("updated") ? "edit" :
                feedbackMessage.includes("added") ? "add" : "check_circle"}
          </span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ===== PREMIUM ANALYTICS HEADER ===== */}
      <div className="page-header premium-header">
        <div>
          <h1 className="page-title">Products List</h1>
          <p className="page-subtitle">Manage and track your areca leaf product catalogue with precision</p>
        </div>

        <div className="header-actions">
          <button className="btn-transfer-premium" onClick={handleAddProduct}>
            <span className="material-symbols-outlined">add</span>
            <span className="btn-text">Add Product</span>
          </button>
        </div>
      </div>

      {/* ===== STATS CARDS (only Total Products and Sizes) ===== */}
      <div className="product-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">inventory</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats.totalProducts}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <span className="material-symbols-outlined">category</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Sizes</span>
            <span className="stat-value">4</span>
          </div>
        </div>
      </div>

      {/* ===== SEARCH AND FILTERS ===== */}
      <div className="filters-section">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search products..."
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

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List View"
          >
            <span className="material-symbols-outlined">view_list</span>
          </button>

          <button
            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </div>
      </div>

      {/* Filter Badge */}
      {(searchTerm) && (
        <div className="filter-badge-container">
          <span className="filter-badge">
            Filtered: {uniqueProductNames.length} products
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          </span>
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {viewMode === "list" && (
        <div className="table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Variations</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {uniqueProductNames.length > 0 ? (
                uniqueProductNames.map((name) => (
                  <tr key={name}>
                    <td>
                      <div className="product-info">
                        <div className="product-text-avatar">
                          {getAbbr(name)}
                        </div>
                        <p className="product-name">{name}</p>
                      </div>
                    </td>
                    <td>{productGroups[name].length} Sizes Available</td>
                    <td>
                      <button
                        className="primary-btn"
                        onClick={() => setViewingProductName(name)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-data">
                    <div className="empty-state">
                      <span className="material-symbols-outlined empty-icon">
                        category
                      </span>
                      <h4>No products found</h4>
                      <button className="primary-btn" onClick={handleAddProduct}>
                        Add Product
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== GRID VIEW ===== */}
      {viewMode === "grid" && (
        <div className="product-grid">
          {uniqueProductNames.length > 0 ? (
            uniqueProductNames.map((name) => (
              <div key={name} className="product-card" onClick={() => setViewingProductName(name)} style={{ cursor: "pointer" }}>
                <div className="product-card-text-container">
                  <span className="product-card-text-badge">{getAbbr(name)}</span>
                </div>

                <div className="product-card-content">
                  <h3 className="product-card-title">{name}</h3>
                  <div className="product-card-details">
                    <span className="product-card-size">{productGroups[name].length} Sizes</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-grid">
              <span className="material-symbols-outlined empty-icon">category</span>
              <h4>No products found</h4>
              <button className="primary-btn" onClick={handleAddProduct}>
                Add Product
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== PRODUCT DETAILS MODAL (Inner View) ===== */}
      {viewingProductName && (
        <div className="modal-overlay" onClick={() => setViewingProductName(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-info">
                <h3>{viewingProductName}</h3>
                <p>Manage sizes and pricing for this product</p>
              </div>
              <button className="modal-close" onClick={() => setViewingProductName(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="nested-table-wrapper">
                <table className="nested-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>SKU</th>
                      <th>Cost Price (₹)</th>
                      <th>Selling Price (₹)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productGroups[viewingProductName].map(variant => (
                      <tr key={variant.id}>
                        <td><strong>{variant.size}</strong></td>
                        <td>{variant.sku}</td>
                        <td>{formatCurrency(variant.costPrice)}</td>
                        <td>{formatCurrency(variant.sellPrice)}</td>
                        <td>
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditProduct(variant)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}
      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Product</h3>
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
              <div className="modal-form-group">
                <label>Sizes *</label>
                <div className="checkbox-group">
                  {["6-inch", "8-inch", "10-inch", "12-inch"].map(size => (
                    <label key={size} className="checkbox-label">
                      <input
                        type="checkbox"
                        name="size"
                        value={size}
                        checked={formData.selectedSizes.includes(size)}
                        onChange={handleInputChange}
                      />
                      <span>{size}</span>
                    </label>
                  ))}
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
              <button className="modal-confirm" onClick={confirmAddProduct}>
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Product</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    disabled
                    className="modal-input disabled"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Size</label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    disabled
                    className="modal-input disabled"
                  />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>Cost Price (₹) *</label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Sell Price (₹) *</label>
                  <input
                    type="number"
                    name="sellPrice"
                    value={formData.sellPrice}
                    onChange={handleInputChange}
                    step="0.01"
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
              <button className="modal-confirm" onClick={confirmEditProduct}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Product</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon warning">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <p className="modal-title">Are you sure?</p>
              <p className="modal-desc">
                You are about to delete <strong>{selectedProduct.name}</strong> from
                your product catalog. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="modal-confirm delete" onClick={confirmDeleteProduct}>
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;