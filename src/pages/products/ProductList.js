import React, { useState } from "react";
import "./ProductList.css";
import { useAppContext } from "../../context/AppContext.js";

// Removed image imports as per user request


const ProductList = () => {
  const { products, fetchData, addProduct, updateProduct, deleteProduct } = useAppContext();
  // Simplified states - removed unused filters
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGroupDeleteModal, setShowGroupDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const fetchProducts = async () => {
    try {
      await fetchData();
    } catch (err) {
      console.error("Error fetching products:", err);
      setFeedbackMessage("Error connecting to server");
    }
  };

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

  const stats = {
    totalProducts: [...new Set(products.map(p => p.name))].length,
    totalSizes: [...new Set(products.map(p => p.size).filter(s => !!s))].length,
  };

  // State for detail view
  const [viewingProductName, setViewingProductName] = useState(null);
  const [newCustomSize, setNewCustomSize] = useState("");

  const handleCloseViewingModal = () => {
    setViewingProductName(null);
    setNewCustomSize("");
  };
  const productGroups = products.reduce((acc, product) => {
    const name = product.name || "Unknown Product";
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(product);
    return acc;
  }, {});

  const uniqueProductNames = Object.keys(productGroups);

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

  const confirmAddProduct = async () => {
    // Validate form
    if (!formData.name || formData.selectedSizes.length === 0) {
      setFeedbackMessage("Please enter name and select at least one size");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const existingSizes = (productGroups[formData.name] || []).map(p => p.size.toLowerCase());
    const duplicates = formData.selectedSizes.filter(s => existingSizes.includes(s.toLowerCase()));
    
    if (duplicates.length > 0) {
      setFeedbackMessage(`Product already exists in sizes: ${duplicates.join(', ')}`);
      setTimeout(() => setFeedbackMessage(""), 4000);
      return;
    }

    const newEntries = formData.selectedSizes.map((size) => {
      const namePart = formData.name.split(' ')[0].substring(0, 3).toUpperCase();
      const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const ts = Date.now().toString().slice(-4);
      const autoSku = `ARECA-${namePart}-${size.split('-')[0]}-${ts}${randomSuffix}`;

      return {
        name: formData.name.trim(),
        sku: autoSku,
        size: size,
        category: "Plates",
        costPrice: 0,
        sellPrice: 0,
        margin: "0.0%",
      };
    });

    try {
      // Add each size variant one by one to ensure compatibility with all backend versions
      for (const entry of newEntries) {
        await addProduct(entry);
      }
      
      await fetchProducts();
      setShowAddModal(false);
      setFeedbackMessage(`${newEntries.length} product(s) added successfully`);
    } catch (err) {
      console.error("Error adding products:", err);
      // Detailed logging for debugging
      if (err.response?.data) {
        console.log("SERVER ERROR DETAILS:", err.response.data);
      }
      
      const serverMsg = err.response?.data?.message || err.message;
      setFeedbackMessage(`Error: ${serverMsg}`);
    }

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  const handleAddSizeToProduct = async () => {
    if (!newCustomSize.trim() || !viewingProductName) {
      setFeedbackMessage("Please enter a valid size (e.g., 14-inch)");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // Check if size already exists for this product
    const existingVariants = productGroups[viewingProductName] || [];
    const sizeExists = existingVariants.some(v => v.size.trim().toLowerCase() === newCustomSize.trim().toLowerCase());
    
    if (sizeExists) {
      setFeedbackMessage(`Product with size ${newCustomSize} already exists!`);
      setTimeout(() => setFeedbackMessage(""), 4000);
      return;
    }

    const namePart = viewingProductName.split(' ')[0].substring(0, 3).toUpperCase();
    const sizeStr = newCustomSize.trim().toUpperCase();
    const sizePart = sizeStr.includes('-') ? sizeStr.split('-')[0] : sizeStr.substring(0, 2);
    const randomSuffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const ts = Date.now().toString().slice(-4);
    const autoSku = `ARECA-${namePart}-${sizePart}-${ts}${randomSuffix}`;

    const newEntry = {
      name: viewingProductName.trim(),
      sku: autoSku,
      size: newCustomSize.trim(),
      category: "Plates",
      costPrice: 0,
      sellPrice: 0,
      margin: "0.0%",
    };

    try {
      await addProduct(newEntry);
      // await fetchProducts(); // context update is enough now
      setNewCustomSize("");
      setFeedbackMessage(`New size added successfully!`);
    } catch (err) {
      console.error("Error adding variant:", err);
      setFeedbackMessage(`Error: failed to add size`);
    }
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

  const confirmEditProduct = async () => {
    if (!selectedProduct) return;

    const cost = parseFloat(formData.costPrice) || 0;
    const sell = parseFloat(formData.sellPrice) || 0;

    const updateData = {
      name: formData.name,
      sku: formData.sku,
      size: formData.size,
      category: "Plates",
      costPrice: cost,
      sellPrice: sell,
      margin: sell > 0 ? ((sell - cost) / sell * 100).toFixed(1) + "%" : "0.0%",
    };

    try {
      await updateProduct(selectedProduct._id, updateData);
      // await fetchProducts(); // context update is enough
      setShowEditModal(false);
      setSelectedProduct(null);
      setFeedbackMessage("Product updated successfully");
    } catch (err) {
      console.error("Error updating product:", err);
      setFeedbackMessage("Error updating product");
    }

    setTimeout(() => setFeedbackMessage(""), 3000);
  };


  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await deleteProduct(selectedProduct._id);
      // await fetchProducts(); // context update is enough now
      setShowDeleteModal(false);
      setSelectedProduct(null);
      setFeedbackMessage("Product deleted successfully");
    } catch (err) {
      console.error("Error deleting product:", err);
      setFeedbackMessage("Error deleting product");
    }

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  const confirmGroupDelete = async () => {
    if (!groupToDelete) return;

    try {
      const variants = productGroups[groupToDelete] || [];
      await Promise.all(variants.map(v => deleteProduct(v._id)));
      // await fetchProducts(); // context update is enough now
      setShowGroupDeleteModal(false);
      
      if (viewingProductName === groupToDelete) {
         handleCloseViewingModal();
      }
      
      setGroupToDelete(null);
      setFeedbackMessage(`Product group deleted`);
    } catch (err) {
      console.error("Error deleting group:", err);
      setFeedbackMessage("Error deleting product group");
    }

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
        <div className="stat-card centered-stat">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">inventory</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats.totalProducts}</span>
          </div>
        </div>
        <div className="stat-card centered-stat">
          <div className="stat-icon orange">
            <span className="material-symbols-outlined">straighten</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Sizes</span>
            <span className="stat-value">{stats.totalSizes || 0}</span>
          </div>
        </div>
      </div>

      {/* Removed Search, View Toggles and Filter Badges as per user request */}

      {/* ===== GRID VIEW (Default) ===== */}
      <div className="product-grid">
          {uniqueProductNames.length > 0 ? (
            uniqueProductNames.map((name) => (
              <div key={name} className="product-card" onClick={() => setViewingProductName(name)} style={{ cursor: "pointer" }}>
                <div className="product-card-text-container">
                  <span className="product-card-text-badge">{getAbbr(name)}</span>
                </div>

                <div className="product-card-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="product-card-title">{name}</h3>
                    <button 
                      className="action-btn delete" 
                      style={{ padding: '4px', height: '32px', width: '32px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupToDelete(name);
                        setShowGroupDeleteModal(true);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                  <div className="product-card-details">
                    <span className="product-card-size">{productGroups[name]?.length || 0} Sizes</span>
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

      {/* ===== PRODUCT DETAILS MODAL (Inner View) ===== */}
      {viewingProductName && (
        <div className="modal-overlay" onClick={handleCloseViewingModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header centered-modal-header">
              <div className="header-info">
                <h3 className="centered-text">{viewingProductName}</h3>
                <div className="manage-sizes-subtitle">
                   <p>Manage sizes and pricing</p>
                </div>
              </div>
              <button className="modal-close" onClick={handleCloseViewingModal}>
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
                      <th>Cost (₹)</th>
                      <th>Price (₹)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(productGroups[viewingProductName] || []).map(variant => (
                      <tr key={variant.id}>
                        <td><strong>{variant.size}</strong></td>
                        <td>{variant.sku}</td>
                        <td>{formatCurrency(variant.costPrice)}</td>
                        <td>{formatCurrency(variant.sellPrice)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditProduct(variant)}
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => {
                                setSelectedProduct(variant);
                                setShowDeleteModal(true);
                              }}
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Add Custom New Size Row */}
                    <tr style={{ background: '#f8fafc', borderTop: '2px dashed #cbd5e1' }}>
                      <td colSpan="2" style={{ padding: '12px' }}>
                        <input 
                          type="text" 
                          placeholder="Enter new size (e.g., 14-inch)" 
                          value={newCustomSize} 
                          onChange={(e) => setNewCustomSize(e.target.value)} 
                          className="modal-input" 
                          style={{ margin: 0, width: '100%', padding: '10px 14px', borderRadius: '6px' }}
                        />
                      </td>
                      <td colSpan="2" style={{ verticalAlign: 'middle', color: '#64748b', fontSize: '13px' }}>
                        *SKU & Pricing auto-generated. Edit anytime.
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <button 
                          style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                          onClick={handleAddSizeToProduct}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                          Add Details
                        </button>
                      </td>
                    </tr>
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
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="modal-input"
                    placeholder="Enter product name"
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

      {/* Delete Group Confirmation Modal */}
      {showGroupDeleteModal && groupToDelete && (
        <div className="modal-overlay" onClick={() => setShowGroupDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Product Group</h3>
              <button className="modal-close" onClick={() => setShowGroupDeleteModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon warning">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <p className="modal-title">Are you sure?</p>
              <p className="modal-desc">
                You are about to delete <strong>all sizes</strong> of <strong>{groupToDelete}</strong>. 
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowGroupDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="modal-confirm delete" onClick={confirmGroupDelete}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;