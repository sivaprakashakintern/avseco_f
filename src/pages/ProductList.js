import React, { useState } from "react";
import "./ProductList.css";

// Import local plate images - ONLY 4 PLATES
import plate6Img from "../assets/plate6.png";
import plate8Img from "../assets/plate8.png";
import plate10Img from "../assets/plate10.png";
import plate12Img from "../assets/plate12.png";

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
      name: "Areca 6 Inch Round Plate",
      sku: "ARP-6RND-03",
      size: "6-inch",
      category: "Plates",
      costPrice: 2.80,
      sellPrice: 5.00,
      margin: "44.0%",
      image: plate6Img,
    },
    {
      id: 2,
      name: "Areca 8 Inch Round Plate",
      sku: "ARP-8RND-04",
      size: "8-inch",
      category: "Plates",
      costPrice: 3.50,
      sellPrice: 6.50,
      margin: "46.2%",
      image: plate8Img,
    },
    {
      id: 3,
      name: "Areca 10 Inch Dinner Plate",
      sku: "ARP-10RND-01",
      size: "10-inch",
      category: "Plates",
      costPrice: 4.50,
      sellPrice: 8.00,
      margin: "43.7%",
      image: plate10Img,
    },
    {
      id: 4,
      name: "Areca 12 Inch Party Plate",
      sku: "ARP-12RND-07",
      size: "12-inch",
      category: "Plates",
      costPrice: 5.80,
      sellPrice: 10.50,
      margin: "44.8%",
      image: plate12Img,
    },
  ]);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    size: "10-inch",
    category: "Plates",
    costPrice: "",
    sellPrice: "",
    image: plate10Img,
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

  // Calculate stats - UPDATED: totalProducts = 1 (single product type), activeProducts removed
  const stats = {
    totalProducts: 1,          // one product with four size variants
  };

  // ========== HANDLERS ==========

  // Add Product
  const handleAddProduct = () => {
    setFormData({
      name: "",
      sku: "",
      size: "10-inch",
      category: "Plates",
      costPrice: "",
      sellPrice: "",
      image: plate10Img,
    });
    setShowAddModal(true);
  };

  const confirmAddProduct = () => {
    // Validate form - SKU no longer checked here as it's auto-generated
    if (!formData.name || !formData.costPrice || !formData.sellPrice) {
      setFeedbackMessage("Please fill all required fields");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // Determine image based on size - ONLY 4 PLATES
    let productImage = plate10Img;
    if (formData.size === "6-inch") productImage = plate6Img;
    else if (formData.size === "8-inch") productImage = plate8Img;
    else if (formData.size === "10-inch") productImage = plate10Img;
    else if (formData.size === "12-inch") productImage = plate12Img;

    const cost = parseFloat(formData.costPrice);
    const sell = parseFloat(formData.sellPrice);
    const margin = ((sell - cost) / sell * 100).toFixed(1) + "%";

    // Auto-generate SKU
    const autoSku = `ARP-${formData.size.replace("-inch", "")}RND-${Math.floor(Math.random() * 90 + 10)}`;

    const newProduct = {
      id: products.length + 1,
      name: formData.name,
      sku: autoSku,
      size: formData.size,
      category: "Plates",
      costPrice: cost,
      sellPrice: sell,
      margin: margin,
      image: productImage,
    };

    setProducts([...products, newProduct]);
    setShowAddModal(false);
    setFeedbackMessage("Product added successfully");

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
      image: product.image,
    });
    setShowEditModal(true);
  };

  const confirmEditProduct = () => {
    if (!selectedProduct) return;

    const cost = parseFloat(formData.costPrice);
    const sell = parseFloat(formData.sellPrice);
    const margin = ((sell - cost) / sell * 100).toFixed(1) + "%";

    // Determine image based on size - ONLY 4 PLATES
    let productImage = plate10Img;
    if (formData.size === "6-inch") productImage = plate6Img;
    else if (formData.size === "8-inch") productImage = plate8Img;
    else if (formData.size === "10-inch") productImage = plate10Img;
    else if (formData.size === "12-inch") productImage = plate12Img;

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
          image: productImage,
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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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
            Add Product
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

      {/* ===== SEARCH AND FILTERS (unchanged) ===== */}
      <div className="filters-section">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search products by name or SKU..."
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
            className="filter-select"
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
          >
            {uniqueSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
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
      {(selectedSize !== "All Sizes" || searchTerm) && (
        <div className="filter-badge-container">
          <span className="filter-badge">
            Filtered: {filteredProducts.length} products
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          </span>
        </div>
      )}

      {/* ===== LIST VIEW (unchanged) ===== */}
      {viewMode === "list" && (
        <div className="table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Cost</th>
                <th>Sell</th>
                <th>Margin</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-info">
                        <div
                          className="product-image"
                          style={{
                            backgroundImage: `url(${product.image})`,
                          }}
                        ></div>
                        <div>
                          <p className="product-name">{product.name}</p>
                          <p className="product-sku">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td>{product.size}</td>
                    <td>{formatCurrency(product.costPrice)}</td>
                    <td>{formatCurrency(product.sellPrice)}</td>
                    <td className="product-margin">{product.margin}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEditProduct(product)}
                          title="Edit Product"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteProduct(product)}
                          title="Delete Product"
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
                        category
                      </span>
                      <h4>No products found</h4>
                      <p>Try adjusting your filters or add a new product</p>
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

      {/* ===== GRID VIEW (unchanged) ===== */}
      {viewMode === "grid" && (
        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div
                  className="product-card-image"
                  style={{ backgroundImage: `url(${product.image})` }}
                >
                  {/* Status badge removed */}
                </div>

                <div className="product-card-content">
                  <h3 className="product-card-title">{product.name}</h3>
                  <p className="product-card-sku">{product.sku}</p>
                  <div className="product-card-details">
                    <span className="product-card-size">{product.size}</span>
                    <span className="product-card-price">{formatCurrency(product.sellPrice)}</span>
                  </div>
                  <div className="product-card-footer">
                    <div className="product-card-actions">
                      <button
                        className="icon-btn edit"
                        onClick={() => handleEditProduct(product)}
                        title="Edit"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => handleDeleteProduct(product)}
                        title="Delete"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-grid">
              <span className="material-symbols-outlined empty-icon">category</span>
              <h4>No products found</h4>
              <p>Try adjusting your filters or add a new product</p>
              <button className="primary-btn" onClick={handleAddProduct}>
                Add Product
              </button>
            </div>
          )}
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
                <label>Size *</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="modal-select"
                >
                  <option>6-inch</option>
                  <option>8-inch</option>
                  <option>10-inch</option>
                  <option>12-inch</option>
                </select>
              </div>
              <div className="modal-row">
                <div className="modal-form-group">
                  <label>Cost Price (₹) *</label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
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
                    placeholder="0.00"
                    step="0.01"
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
                  <label>Size *</label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="modal-select"
                  >
                    <option>6-inch</option>
                    <option>8-inch</option>
                    <option>10-inch</option>
                    <option>12-inch</option>
                  </select>
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