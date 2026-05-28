import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { vendorApi } from "../../utils/api.js";
import "./Vendors.css";

const Vendors = () => {
  const { canEdit } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewVendor, setViewVendor] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth <= 1024 ? 8 : 10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
    const handleResize = () => {
      setItemsPerPage(window.innerWidth <= 1024 ? 8 : 10);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getAll();
      setVendors(data.map(v => ({ ...v, id: v._id })));
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    vendorType: "Other",
    customVendorType: "",
    contactPerson: "",
    phone: "",
    address: "",
    notes: ""
  });

  const filteredVendors = vendors.filter((vendor) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      (vendor.contactPerson?.toLowerCase() || "").includes(searchLow) ||
      (vendor.vendorType?.toLowerCase() || "").includes(searchLow) ||
      (vendor.phone || "").includes(searchTerm)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => setCurrentPage(1), [searchTerm]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") {
      if (!value.trim()) {
        value = "";
      } else {
        if (!value.startsWith("+91 ")) {
          value = "+91 " + value.replace(/^\+91\s*/, "");
        }
        const digits = value.slice(4).replace(/\D/g, "").slice(0, 10);
        value = "+91 " + digits;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      vendorType: "Other",
      customVendorType: "",
      contactPerson: "",
      phone: "",
      address: "",
      notes: ""
    });
  };

  const confirmAddVendor = async (e) => {
    e.preventDefault();
    if (!formData.contactPerson) {
      setFeedbackMessage("Please fill required fields (Contact Person)");
      setTimeout(() => setFeedbackMessage(""), 2500);
      return;
    }

    try {
      const newVendor = await vendorApi.add({
        ...formData,
        vendorType: formData.vendorType === 'Other' && formData.customVendorType?.trim() ? formData.customVendorType : formData.vendorType,
        phone: formData.phone?.trim() ? formData.phone : undefined,
      });
      setVendors(prev => [...prev, { ...newVendor, id: newVendor._id }]);
      setShowAddModal(false);
      resetForm();
      setFeedbackMessage("Vendor Added Successfully!");
    } catch (err) {
      setFeedbackMessage("Error adding vendor");
    }
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

  const confirmEditVendor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        vendorType: formData.vendorType === 'Other' && formData.customVendorType?.trim() ? formData.customVendorType : formData.vendorType
      };
      const updated = await vendorApi.update(selectedVendor.id, payload);
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...updated, id: updated._id } : v));
      setShowEditModal(false);
      setSelectedVendor(null);
      resetForm();
      setFeedbackMessage("✅ Vendor Updated Successfully!");
    } catch (err) {
      setFeedbackMessage("Error updating vendor");
    }
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      await vendorApi.delete(vendorToDelete.id);
      setVendors(prev => prev.filter(v => v.id !== vendorToDelete.id));
      setShowDeleteModal(false);
      setVendorToDelete(null);
      setFeedbackMessage("🗑️ Vendor deleted successfully");
    } catch (err) {
      setFeedbackMessage("❌ Error deleting vendor");
    }
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

  return (
    <div className="vendors-container">
      {feedbackMessage && <div className="feedback-toast"><span>{feedbackMessage}</span></div>}

      <div className="page-header premium-header vendor-header">
        <div className="header-content">
          <h1 className="page-title vendor-page-title">Vendors Details</h1>
          {canEdit && (
            <button
              className="btn-add-circle-premium"
              onClick={() => { resetForm(); setShowAddModal(true); }}
              title="New Vendor"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          )}
        </div>
      </div>

      <div className="search-filter-area">
        <div className="premium-search-bar">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search by name, company, type or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading vendors...</div>
      ) : (
        <div className="table-container">
          {/* DESKTOP VIEW */}
          <div className="desktop-table-view">
            <table className="vendors-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: '8%' }}>S.No</th>
                  <th style={{ textAlign: 'left', width: '30%' }}>VENDOR NAME</th>
                  <th style={{ textAlign: 'left', width: '25%' }}>Vendor Type</th>
                  <th style={{ textAlign: 'left', width: '22%' }}>Phone</th>
                  <th style={{ textAlign: 'right', width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVendors.map((vendor, index) => (
                  <tr key={vendor.id} className="vendor-row">
                    <td style={{ textAlign: 'left', color: '#64748b', fontWeight: '600', verticalAlign: 'middle' }}>
                      {startIndex + index + 1}
                    </td>
                    <td style={{ textAlign: 'left', fontWeight: '500', color: '#111827', verticalAlign: 'middle' }}>
                      {vendor.contactPerson}
                    </td>
                    <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                       <span className={`type-badge-full ${vendor.vendorType.replace(/\s+/g, '-').toLowerCase()}`}>
                         {vendor.vendorType}
                       </span>
                    </td>
                    <td style={{ textAlign: 'left', color: '#4b5563', verticalAlign: 'middle' }}>
                      {vendor.phone || '-'}
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-btn" title="View" onClick={() => { setViewVendor(vendor); setShowViewModal(true); }} style={{ color: '#10b981' }}>
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        {canEdit && (
                          <>
                            <button className="action-btn" title="Edit" onClick={() => {
                              setSelectedVendor(vendor);
                              const predefinedTypes = ['Leaf', 'Machine Maintenance Material', 'Canteen', 'Electrician'];
                              const isPredefined = predefinedTypes.includes(vendor.vendorType);
                              setFormData({
                                vendorType: isPredefined ? vendor.vendorType : 'Other',
                                customVendorType: isPredefined ? '' : (vendor.vendorType || ''),
                                contactPerson: vendor.contactPerson || "",
                                phone: vendor.phone || "",
                                address: vendor.address || "",
                                notes: vendor.notes || ""
                              });
                              setShowEditModal(true);
                            }}><span className="material-symbols-outlined">edit</span></button>
                            <button
                              className="action-btn delete-btn"
                              title="Delete"
                              onClick={() => { setVendorToDelete(vendor); setShowDeleteModal(true); }}
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW */}
          <div className="mobile-vendor-cards">
            {paginatedVendors.length > 0 ? (
              paginatedVendors.map((vendor, index) => (
                <div key={vendor.id} className="mobile-vendor-strip-card">
                  <div className="card-top">
                    <div className="card-avatar">
                      <span className="material-symbols-outlined">
                         store
                      </span>
                    </div>
                    <div className="card-main-info">
                      <div className="name-row">
                        <span className="vendor-name">
                          <span style={{ color: '#94a3b8', marginRight: '6px' }}>#{startIndex + index + 1}</span>
                          {vendor.contactPerson}
                        </span>
                      </div>
                      <span className="vendor-meta-info">
                        {vendor.phone || 'No Phone'} • {vendor.vendorType}
                      </span>
                    </div>

                    {/* Dropdown Action Menu */}
                    <div className="card-action-container">
                      <button
                        className={`btn-more-actions ${activeDropdownId === vendor.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === vendor.id ? null : vendor.id);
                        }}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>

                      {activeDropdownId === vendor.id && (
                        <div className="mobile-action-dropdown" onClick={e => e.stopPropagation()}>
                          <button className="dropdown-item" onClick={() => { setViewVendor(vendor); setShowViewModal(true); setActiveDropdownId(null); }}>
                            <span className="material-symbols-outlined">visibility</span>
                            View Profile
                          </button>
                          {canEdit && (
                            <>
                              <button className="dropdown-item" onClick={() => {
                                setSelectedVendor(vendor);
                                const predefinedTypes = ['Leaf', 'Machine Maintenance Material', 'Canteen', 'Electrician'];
                                const isPredefined = predefinedTypes.includes(vendor.vendorType);
                                setFormData({
                                  vendorType: isPredefined ? vendor.vendorType : 'Other',
                                  customVendorType: isPredefined ? '' : (vendor.vendorType || ''),
                                  contactPerson: vendor.contactPerson || "",
                                  phone: vendor.phone || "",
                                  address: vendor.address || "",
                                  notes: vendor.notes || ""
                                });
                                setShowEditModal(true);
                                setActiveDropdownId(null);
                              }}>
                                <span className="material-symbols-outlined">edit_note</span>
                                Edit Details
                              </button>
                              <button className="dropdown-item delete" onClick={() => { setVendorToDelete(vendor); setShowDeleteModal(true); setActiveDropdownId(null); }}>
                                <span className="material-symbols-outlined">delete</span>
                                Delete Vendor
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-mobile-state">
                <span className="material-symbols-outlined">group_off</span>
                <p>No vendors found matching your search</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGINATION */}
      {filteredVendors.length > itemsPerPage && (
        <div className="pagination">
          <p className="pagination-info">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredVendors.length)} of {filteredVendors.length}</p>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
            <button className="pagination-btn active">{currentPage}</button>
            <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>
      )}

      {/* MODALS (Add/Edit) */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay view-modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content view-modal-frame" onClick={e => e.stopPropagation()}>
            <div className="modal-drag-handle view-modal-hide-handle"></div>
            <div className="modal-header view-modal-header">
              <div className="header-left-with-back">
                <button className="mobile-back-btn" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2>{showAddModal ? "New Vendor" : "Edit Vendor"}</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={showAddModal ? confirmAddVendor : confirmEditVendor}>
              <div className="modal-body">
                
                <div className="modal-form-group full-width">
                  <label>Vendor Category</label>
                  <select className="modal-input" name="vendorType" value={formData.vendorType} onChange={handleInputChange}>
                    <option value="Leaf">Leaf Vendor</option>
                    <option value="Machine Maintenance Material">Machine Maintenance Material</option>
                    <option value="Canteen">Canteen</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.vendorType === 'Other' && (
                  <div className="modal-form-group full-width" style={{ marginTop: '-8px' }}>
                    <label>Specify Category *</label>
                    <input className="modal-input" name="customVendorType" value={formData.customVendorType} onChange={handleInputChange} placeholder="e.g. Plumber, Software..." required />
                  </div>
                )}

                <div className="modal-row-grid">
                  <div className="modal-form-group">
                    <label>Contact Name *</label>
                    <input className="modal-input" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Required" required />
                  </div>
                  <div className="modal-form-group">
                    <label>Phone Number</label>
                    <input className="modal-input" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g. +91 98765 43210" />
                  </div>
                </div>

                <div className="modal-form-group full-width">
                  <label>Full Address</label>
                  <textarea className="modal-textarea" name="address" value={formData.address} onChange={handleInputChange} rows="2" placeholder="Enter complete address..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-cancel" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Discard</button>
                <button type="submit" className="modal-confirm">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteModal && vendorToDelete && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setVendorToDelete(null); }}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: '#dc2626' }}>Delete Vendor</h2>
              <button className="modal-close" onClick={() => { setShowDeleteModal(false); setVendorToDelete(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#dc2626', display: 'block', marginBottom: '12px' }}>warning</span>
              <p style={{ fontSize: '15px', color: '#374151', marginBottom: '6px' }}>
                Are you sure you want to delete
              </p>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                {vendorToDelete.contactPerson}?
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => { setShowDeleteModal(false); setVendorToDelete(null); }}>Cancel</button>
              <button
                className="modal-confirm"
                style={{ background: '#dc2626' }}
                onClick={handleDeleteVendor}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '6px' }}>delete</span>
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW VENDOR MODAL */}
      {showViewModal && viewVendor && (
        <div className="modal-overlay view-modal-overlay" onClick={() => { setShowViewModal(false); setViewVendor(null); }}>
          <div className="modal-content vendor-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="vendor-profile-header">
              <h2>Vendor Profile</h2>
              <button className="modal-close-circle" onClick={() => { setShowViewModal(false); setViewVendor(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-body vendor-profile-body">
              <div className="view-profile-section-centered">
                <div className="view-avatar-centered">
                  <span className="material-symbols-outlined">store</span>
                </div>
                <h3 className="view-name-centered">
                  {viewVendor.contactPerson}
                </h3>
                <div className="view-badge-centered">
                  {viewVendor.vendorType}
                </div>
              </div>

              <div className="vendor-info-cards">
                <div className="vendor-card-item">
                  <span className="card-label">CONTACT NAME</span>
                  <span className="card-value">{viewVendor.contactPerson || '—'}</span>
                </div>
                <div className="vendor-card-item">
                  <span className="card-label">PHONE NUMBER</span>
                  <span className="card-value">{viewVendor.phone || '—'}</span>
                </div>
                <div className="vendor-card-item">
                  <span className="card-label">ADDRESS</span>
                  <span className="card-value-long">{viewVendor.address || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Vendors;
