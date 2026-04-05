import React, { useState, useEffect } from "react";
import "./ProductList.css";
import { useAppContext } from "../../context/AppContext.js";

// Removed image imports as per user request


const DEFAULT_SIZES = ["4-inch", "6-inch", "8-inch", "10-inch", "12-inch"];

const ProductList = () => {
  const { products, fetchData, addProduct, updateProduct, deleteProduct } = useAppContext();
  // Simplified states - removed unused filters
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGroupDeleteModal, setShowGroupDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    hsn: "",
    category: "Plates",
  });
  
  const [variants, setVariants] = useState([]);
  const [newSize, setNewSize] = useState({ size: "", hsn: "", cost: "", sell: "" });

  // Add Product
  const handleAddProduct = React.useCallback(() => {
    setFormData({
      name: "",
      hsn: "",
      category: "Plates",
    });
    setVariants(DEFAULT_SIZES.map(s => ({
      size: s,
      cost: "",
      sell: "",
      checked: true,
      isNew: true
    })));
    setShowAddModal(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Trigger Shift + N or Shift + S to add product, ignore if in an input/textarea
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
      if (e.shiftKey && (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 's') && !isInput) {
        e.preventDefault();
        handleAddProduct();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddProduct]);

  const fetchProducts = React.useCallback(async () => {
    try {
      await fetchData();
    } catch (err) {
      console.error("Error fetching products:", err);
      setFeedbackMessage("Error connecting to server");
    }
  }, [fetchData]);

  const confirmAddProduct = async () => {
    if (!formData.name.trim()) {
      setFeedbackMessage("Please enter product name");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const activeVariants = variants.filter(v => v.checked && v.size.trim());
    if (activeVariants.length === 0) {
      setFeedbackMessage("Please select at least one size");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    if (productGroups[formData.name.trim()]) {
      setFeedbackMessage(`Product group "${formData.name.trim()}" already exists!`);
      setTimeout(() => setFeedbackMessage(""), 4000);
      return;
    }


    try {
      for (const v of activeVariants) {
        const cost = parseFloat(v.cost) || 0;
        const sell = parseFloat(v.sell) || 0;

        await addProduct({
          name: formData.name.trim(),
          sku: v.hsn ? `${v.hsn.trim()}-${v.size.replace(/\s+/g, '-')}` : `${formData.hsn.trim()}-${v.size.replace(/\s+/g, '-')}`,
          hsnCode: v.hsn ? v.hsn.trim() : formData.hsn.trim(),
          size: v.size,
          category: "Plates",
          costPrice: cost,
          sellPrice: sell,
          margin: sell > 0 ? ((sell - cost) / sell * 100).toFixed(1) + "%" : "0.0%",
        });
      }
      
      await fetchProducts();
      setShowAddModal(false);
      setFeedbackMessage(`${activeVariants.length} sizes added successfully`);
    } catch (err) {
      console.error("Error adding products:", err);
      setFeedbackMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Edit Product
  const handleEditProduct = (name) => {
    const group = productGroups[name] || [];
    if (group.length === 0) return;

    setFormData({
      name: name,
      hsn: group[0]?.sku || "", 
      category: group[0]?.category || "Plates",
    });

    const variantsFromDefault = DEFAULT_SIZES.map(s => {
      const match = group.find(v => v.size === s);
      return match ? 
        { ...match, checked: true, cost: match.costPrice, sell: match.sellPrice, hsn: match.hsnCode || match.sku, isExisting: true } : 
        { size: s, cost: "", sell: "", hsn: group[0]?.hsnCode || group[0]?.sku || "", checked: false, isNew: true };
    });

    const customVariants = group
      .filter(v => !DEFAULT_SIZES.includes(v.size))
      .map(v => ({ ...v, checked: true, cost: v.costPrice, sell: v.sellPrice, hsn: v.sku, isExisting: true }));

    setVariants([...variantsFromDefault, ...customVariants]);
    setShowEditModal(true);
  };

  const confirmEditProduct = async () => {

    try {
      for (const v of variants) {
        if (v.checked && v.isExisting) {
          // Update existing
          const cost = parseFloat(v.cost) || 0;
          const sell = parseFloat(v.sell) || 0;
          await updateProduct(v._id || v.id, {
            ...v,
            sku: v.hsn ? v.hsn.trim() : formData.hsn.trim(), 
            hsnCode: v.hsn ? v.hsn.trim() : formData.hsn.trim(),
            costPrice: cost,
            sellPrice: sell,
            margin: sell > 0 ? ((sell - cost) / sell * 100).toFixed(1) + "%" : "0.0%",
          });
        } else if (v.checked && v.isNew) {
          const cost = parseFloat(v.cost) || 0;
          const sell = parseFloat(v.sell) || 0;

          await addProduct({
            name: formData.name.trim(),
            sku: v.hsn ? `${v.hsn.trim()}-${v.size.replace(/\s+/g, '-')}` : `${formData.hsn.trim()}-${v.size.replace(/\s+/g, '-')}`, 
            hsnCode: v.hsn ? v.hsn.trim() : formData.hsn.trim(),
            size: v.size,
            category: "Plates",
            costPrice: cost,
            sellPrice: sell,
            margin: sell > 0 ? ((sell - cost) / sell * 100).toFixed(1) + "%" : "0.0%",
          });
        }
        // If unchecked and existing, we could delete it, but user didn't explicitly ask for deletion here.
        // Usually better to just leave it or keep it as is.
      }
      
      await fetchProducts();
      setShowEditModal(false);
      setFeedbackMessage("Product updated successfully");
    } catch (err) {
      console.error("Error updating variants:", err);
      setFeedbackMessage("Error updating products");
    }
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleIndividualDelete = (variantId, index, size) => {
    if (!variantId) return;
    setVariantToDelete({ id: variantId, index, size });
  };

  const confirmVariantDelete = async () => {
    if (!variantToDelete) return;
    const { id, index } = variantToDelete;
    try {
      await deleteProduct(id);
      const newVariants = [...variants];
      newVariants.splice(index, 1);
      setVariants(newVariants);
      setVariantToDelete(null);
      setFeedbackMessage("Size variant deleted");
      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting variant:", err);
      setFeedbackMessage("Failed to delete variant");
    }
  };

  const handleAddCustomSize = () => {
    if (!newSize.size.trim()) return;
    const sizeHsn = newSize.hsn ? newSize.hsn.trim() : formData.hsn.trim();
    setVariants([...variants, { ...newSize, hsn: sizeHsn, checked: true, isNew: true }]);
    setNewSize({ size: "", hsn: "", cost: "", sell: "" });
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
      
      
      setGroupToDelete(null);
      setFeedbackMessage(`Product group deleted`);
    } catch (err) {
      console.error("Error deleting group:", err);
      setFeedbackMessage("Error deleting product group");
    }

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleModalKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'add') {
        confirmAddProduct();
      } else {
        confirmEditProduct();
      }
    }
  };

  // Get product abbreviation (first word)
  const getAbbr = (name) => {
    return name ? name.split(" ")[0] : "Product";
  };

  // Define stats and grouping inside render to stay fresh
  const productGroups = products.reduce((acc, product) => {
    const name = product.name || "Unknown Product";
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(product);
    return acc;
  }, {});

  const uniqueProductNames = Object.keys(productGroups).sort();

  const stats = {
    totalProducts: uniqueProductNames.length,
    totalVariants: new Set(products.map(p => p.size)).size
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

      {/* ===== STATS CARDS ===== */}
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
          <div className="stat-icon green">
            <span className="material-symbols-outlined">category</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Sizes</span>
            <span className="stat-value">{stats.totalVariants}</span>
          </div>
        </div>
      </div>

      {/* ===== GRID VIEW ===== */}
      <div className="product-grid">
        {uniqueProductNames.length > 0 ? (
          uniqueProductNames.map((name) => (
            <div key={name} className="product-card" onClick={() => handleEditProduct(name)} style={{ cursor: "pointer" }}>
              <div className="product-card-text-container">
                <span className="product-card-text-badge">{getAbbr(name)}</span>
              </div>

              <div className="product-card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 className="product-card-title">{name}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="product-card-text-badge" style={{ padding: '2px 8px', fontSize: '10px', display: 'block', marginBottom: '4px' }}>{productGroups[name].length} Sizes</span>
                    </div>
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


      {/* ===== MODALS ===== */}
      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Product</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row centered-row">
                <div className="modal-form-group inline-group" style={{ flex: 1 }}>
                  <label className="inline-label">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleModalKeyDown(e, 'add')}
                    placeholder="Enter product name"
                    className="modal-input inline-input"
                  />
                </div>
              </div>

              <div className="variants-header">
                <h4>Manage Sizes & Pricing</h4>
                <p>Tick the sizes you want to add and enter their prices</p>
              </div>

              <div className="variants-list">
                <table className="variant-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Tick</th>
                      <th>Size</th>
                      <th>HSN</th>
                      <th>Cost (₹)</th>
                      <th>Sell (₹)</th>
                      <th style={{ width: '40px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={idx} className={v.checked ? "active-row" : "inactive-row"}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={v.checked} 
                            onChange={(e) => handleVariantChange(idx, 'checked', e.target.checked)} 
                          />
                        </td>
                        <td><strong>{v.size}</strong></td>
                        <td>
                          {v.checked && (
                            <input 
                              type="text" 
                              value={v.hsn || ""} 
                              onChange={(e) => handleVariantChange(idx, 'hsn', e.target.value)}
                              onKeyDown={(e) => handleModalKeyDown(e, 'edit')}
                              placeholder="HSN"
                              className="table-input"
                              style={{ fontSize: '12px' }}
                            />
                          )}
                        </td>
                        <td>
                          {v.checked && (
                            <input 
                              type="number" 
                              value={v.cost} 
                              onChange={(e) => handleVariantChange(idx, 'cost', e.target.value)}
                              onKeyDown={(e) => handleModalKeyDown(e, 'add')}
                              placeholder="0"
                              className="table-input"
                            />
                          )}
                        </td>
                        <td>
                          {v.checked && (
                            <input 
                              type="number" 
                              value={v.sell} 
                              onChange={(e) => handleVariantChange(idx, 'sell', e.target.value)}
                              onKeyDown={(e) => handleModalKeyDown(e, 'add')}
                              placeholder="0"
                              className="table-input"
                            />
                          )}
                        </td>
                        <td>
                          {!DEFAULT_SIZES.includes(v.size) && (
                            <button 
                              className="action-btn delete small" 
                              onClick={() => {
                                const next = [...variants];
                                next.splice(idx, 1);
                                setVariants(next);
                              }}
                              title="Remove custom size"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Add Custom Row */}
                    <tr className="add-custom-row">
                      <td><span className="material-symbols-outlined">add</span></td>
                      <td>
                        <input 
                          type="text" 
                          placeholder="Size (e.g. 14-inch)" 
                          value={newSize.size} 
                          onChange={(e) => setNewSize({...newSize, size: e.target.value})}
                          onKeyDown={(e) => handleModalKeyDown(e, 'add')}
                          className="table-input"
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          placeholder="HSN" 
                          value={newSize.hsn || ""} 
                          onChange={(e) => setNewSize({...newSize, hsn: e.target.value})}
                          className="table-input"
                          style={{ fontSize: '12px' }}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          placeholder="Cost" 
                          value={newSize.cost} 
                          onChange={(e) => setNewSize({...newSize, cost: e.target.value})}
                          onKeyDown={(e) => handleModalKeyDown(e, 'add')}
                          className="table-input"
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input 
                            type="number" 
                            placeholder="Sell" 
                            value={newSize.sell} 
                            onChange={(e) => setNewSize({...newSize, sell: e.target.value})}
                            className="table-input"
                          />
                          <button className="add-row-btn" onClick={handleAddCustomSize}>Add</button>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={confirmAddProduct}>Add Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Product: {formData.name}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row centered-row">
                <div className="modal-form-group inline-group" style={{ flex: 1 }}>
                  <label className="inline-label">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    disabled
                    className="modal-input disabled inline-input"
                  />
                </div>
              </div>

              <div className="variants-header">
                <h4>Manage Sizes & Pricing</h4>
                <p>Update prices for existing sizes or tick new ones to add them</p>
              </div>

              <div className="variants-list">
                <table className="variant-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Tick</th>
                      <th>Size</th>
                      <th>HSN</th>
                      <th>Cost (₹)</th>
                      <th>Sell (₹)</th>
                      <th style={{ width: '40px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={idx} className={v.checked ? "active-row" : "inactive-row"}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={v.checked} 
                            onChange={(e) => handleVariantChange(idx, 'checked', e.target.checked)} 
                            disabled={v.isExisting} 
                          />
                        </td>
                        <td><strong>{v.size}</strong></td>
                        <td>
                          {v.checked && (
                            <input 
                              type="text" 
                              value={v.hsn || ""} 
                              onChange={(e) => handleVariantChange(idx, 'hsn', e.target.value)}
                              onKeyDown={(e) => handleModalKeyDown(e, 'edit')}
                              placeholder="HSN"
                              className="table-input"
                              style={{ fontSize: '12px' }}
                            />
                          )}
                        </td>
                        <td>
                          {v.checked && (
                            <input 
                              type="number" 
                              value={v.cost} 
                              onChange={(e) => handleVariantChange(idx, 'cost', e.target.value)}
                              onKeyDown={(e) => handleModalKeyDown(e, 'edit')}
                              placeholder="0"
                              className="table-input"
                            />
                          )}
                        </td>
                        <td>
                          {v.checked && (
                            <input 
                              type="number" 
                              value={v.sell} 
                              onChange={(e) => handleVariantChange(idx, 'sell', e.target.value)}
                              onKeyDown={(e) => handleModalKeyDown(e, 'edit')}
                              placeholder="0"
                              className="table-input"
                            />
                          )}
                        </td>
                        <td>
                          {v.isExisting && (
                            <button 
                              className="action-btn delete small" 
                              onClick={() => handleIndividualDelete(v._id || v.id, idx, v.size)}
                              title="Delete this size"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Add Custom Row */}
                    <tr className="add-custom-row">
                      <td><span className="material-symbols-outlined">add</span></td>
                      <td>
                        <input 
                          type="text" 
                          placeholder="Custom Size" 
                          value={newSize.size} 
                          onChange={(e) => setNewSize({...newSize, size: e.target.value})}
                          onKeyDown={(e) => handleModalKeyDown(e, 'edit')}
                          className="table-input"
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          placeholder="HSN" 
                          value={newSize.hsn || ""} 
                          onChange={(e) => setNewSize({...newSize, hsn: e.target.value})}
                          className="table-input"
                          style={{ fontSize: '12px' }}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          placeholder="Cost" 
                          value={newSize.cost} 
                          onChange={(e) => setNewSize({...newSize, cost: e.target.value})}
                          className="table-input"
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input 
                            type="number" 
                            placeholder="Sell" 
                            value={newSize.sell} 
                            onChange={(e) => setNewSize({...newSize, sell: e.target.value})}
                            className="table-input"
                          />
                          <button className="add-row-btn" onClick={handleAddCustomSize}>Add</button>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={confirmEditProduct}>Save Changes</button>
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
      {variantToDelete && (
        <div className="modal-overlay variant-modal-overlay" style={{ zIndex: 3000 }} onClick={() => setVariantToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Size Variant</h3>
              <button className="modal-close" onClick={() => setVariantToDelete(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon warning">
                <span className="material-symbols-outlined">delete_forever</span>
              </div>
              <p className="modal-title">Delete {variantToDelete.size} Variant?</p>
              <p className="modal-desc">
                Are you sure you want to delete this specific size for <strong>{formData.name}</strong>? 
                This will permanently remove the variant from your catalog.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setVariantToDelete(null)}
              >
                Cancel
              </button>
              <button className="modal-confirm delete" onClick={confirmVariantDelete}>
                Delete Variant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;