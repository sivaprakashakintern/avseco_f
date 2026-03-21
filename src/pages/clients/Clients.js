import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.js";
import { formatDate } from "../../utils/dateUtils.js";
import "./Clients.css";

const Clients = () => {
  const { clients, addClient, updateClient, salesHistory } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth <= 768 ? 15 : 10);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth <= 768 ? 15 : 10);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    gst: "",
  });

  // Calculate stats
  // Filter and Enrich clients with real sales data
  const processedClients = clients.map(client => {
    const clientSales = (salesHistory || []).filter(s => 
      s.customerPhone === client.phone || 
      s.companyName === client.companyName
    );
    const totalOrders = clientSales.length;
    const totalSpentValue = clientSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    
    return {
      ...client,
      totalOrders,
      totalSpentValue,
      totalSpent: `₹${totalSpentValue.toLocaleString('en-IN')}`
    };
  });

  const filteredClients = processedClients.filter((client) => {
    // Search filter
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      (client.companyName?.toLowerCase() || "").includes(searchLow) ||
      (client.contactPerson?.toLowerCase() || "").includes(searchLow) ||
      (client.email?.toLowerCase() || "").includes(searchLow) ||
      (client.phone || "").includes(searchTerm);

    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ========== HANDLERS ==========

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Add Client
  const handleAddClient = () => {
    setFormData({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      gst: "",
    });
    setShowAddModal(true);
  };

  const confirmAddClient = (e) => {
    e.preventDefault();

    // Validate form (Company Name is now optional)
    if (!formData.contactPerson || !formData.email || !formData.gst) {
      setFeedbackMessage("Please fill all required fields (Contact, Email, GST)");
      setTimeout(() => setFeedbackMessage(""), 2000);
      return;
    }

    const newClient = {
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone || "+91 00000 00000",
      status: "Active",
      totalOrders: 0,
      totalSpent: "₹0",
      lastOrder: "N/A",
      address: formData.address || "Not provided",
      gst: formData.gst || "Not provided",
    };

    addClient(newClient);
    setShowAddModal(false);
    setFeedbackMessage("Client added");
    setTimeout(() => setFeedbackMessage(""), 2000);
  };

  // Edit Client
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setFormData({
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      address: client.address,
      gst: client.gst,
    });
    setShowEditModal(true);
  };

  const confirmEditClient = (e) => {
    e.preventDefault();
    if (!formData.contactPerson || !formData.email || !formData.gst) {
      setFeedbackMessage("Please fill all required fields (Contact, Email, GST)");
      setTimeout(() => setFeedbackMessage(""), 2000);
      return;
    }

    updateClient(selectedClient.id, {
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      gst: formData.gst,
    });

    setShowEditModal(false);
    setSelectedClient(null);
    setFeedbackMessage("Client updated");
    setTimeout(() => setFeedbackMessage(""), 2000);
  };

  // Delete Client
  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const confirmDeleteClient = () => {
    if (!selectedClient) return;

    deleteClient(selectedClient.id);
    setShowDeleteModal(false);
    setSelectedClient(null);
    setFeedbackMessage("Client deleted");
    setTimeout(() => setFeedbackMessage(""), 2000);
  };

  // View Client
  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowViewModal(true);
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
    setSearchTerm("");
  };

  // Export Handler
  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = (format) => {
    setExportLoading(true);

    setTimeout(() => {
      setExportLoading(false);
      setShowExportModal(false);

      // Create CSV
      if (format === "CSV") {
        const headers = ["Company Name", "Contact Person", "Email", "Phone", "Status", "Total Orders", "Total Spent", "Last Order"];
        const csvData = filteredClients.map((c) => [
          c.companyName,
          c.contactPerson,
          c.email,
          c.phone,
          c.status,
          c.totalOrders,
          c.totalSpent,
          c.lastOrder,
        ]);

        const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `clients-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
      }

    }, 1500);
  };


  // Pagination Handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="clients-container">
      {feedbackMessage && (
        <div className="feedback-toast">
          <span className="material-symbols-outlined">
            {feedbackMessage.toLowerCase().includes("deleted")
              ? "delete"
              : feedbackMessage.toLowerCase().includes("updated")
                ? "edit"
                : feedbackMessage.toLowerCase().includes("added")
                  ? "add_circle"
                  : "info"}
          </span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ===== PREMIUM ANALYTICS HEADER ===== */}
      <div className="page-header premium-header">
        <div>
          <h1 className="page-title">Client Portfolio</h1>
        </div>
        <div className="header-actions">
          <button className="btn-transfer-premium" onClick={handleAddClient}>
            <span className="material-symbols-outlined">person_add</span>
            Add Client
          </button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="clients-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Clients</span>
            <span className="stat-value">{filteredClients.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <span className="material-symbols-outlined">currency_rupee</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Portfolio Value</span>
            <span className="stat-value">
              ₹{filteredClients.reduce((sum, c) => sum + (c.totalSpentValue || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>



      {/* ===== SEARCH AND FILTERS ===== */}
      <div className="filters-section">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search clients by name, contact, or email..."
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

        <div className="filter-actions desktop-only">
          <button className="btn-export-premium" onClick={handleExport}>
            <span className="material-symbols-outlined">
              {exportLoading ? "hourglass_empty" : "download"}
            </span>
            {exportLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Filter Badge */}
      {searchTerm && (
        <div className="filter-badge-container">
          <span className="filter-badge">
            Filtered: {filteredClients.length} clients
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          </span>
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      <div className="table-container">
          {/* ── Desktop Table (hidden on mobile) ── */}
          <div className="table-responsive desktop-table-view">
            <table className="clients-table">
              <thead>
                <tr>
                  <th className="sticky-col-no">#</th>
                  <th className="sticky-col">Company Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client, index) => (
                    <tr key={client.id} className="client-row">
                      <td className="sticky-col-no">{startIndex + index + 1}</td>
                      <td className="sticky-col">
                        <div className="company-info">
                          <div className="company-icon">
                            <span className="material-symbols-outlined">business</span>
                          </div>
                          <div>
                            <p className="company-name">{client.companyName}</p>
                            <p className="company-gst">GST: {client.gst}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <p className="contact-person">{client.contactPerson}</p>
                        </div>
                      </td>
                      <td>
                        <p className="client-email">{client.email}</p>
                      </td>
                      <td>
                        <p className="client-phone">{client.phone}</p>
                      </td>
                      <td>
                        <span className="order-count">{client.totalOrders}</span>
                      </td>
                      <td>
                        <span className="spent-amount">{client.totalSpent}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditClient(client)}
                            title="Edit Client"
                          >
                            <span className="material-symbols-outlined">edit</span>
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
                          groups_off
                        </span>
                        <h4>No clients found</h4>
                        <p>Try adjusting your filters or add a new client</p>
                        <button className="btn-transfer-premium" onClick={handleAddClient} style={{ marginTop: '20px' }}>
                          <span className="material-symbols-outlined">person_add</span>
                          Add Client
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Client Cards (shown on mobile only) ── */}
          <div className="mobile-client-cards">
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client, index) => (
                <div key={client.id} className="mobile-client-card" onClick={() => handleViewClient(client)}>
                  <span className="mobile-client-sno">#{startIndex + index + 1}</span>
                  <div className="mobile-client-icon">
                    <span className="material-symbols-outlined">business</span>
                  </div>
                  <div className="mobile-client-info">
                    <p className="mobile-client-name">{client.companyName}</p>
                    <span className="mobile-client-contact">{client.contactPerson}</span>
                    <span className="mobile-client-phone">{client.phone}</span>
                  </div>
                  <div className="mobile-client-orders">
                    <span className="mobile-orders-count">{client.totalOrders}</span>
                    <span className="mobile-orders-label">Orders</span>
                  </div>
                  <div className="mobile-client-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="mobile-client-edit" onClick={(e) => { e.stopPropagation(); handleEditClient(client); }}>
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="mobile-client-empty">
                <span className="material-symbols-outlined">groups_off</span>
                <p>No clients found</p>
                <button className="btn-transfer-premium" onClick={handleAddClient}>
                  <span className="material-symbols-outlined">person_add</span> Add Client
                </button>
              </div>
            )}
          </div>
          {filteredClients.length > 0 && (
            <div className="pagination">
              <p className="pagination-info">
                Showing <span>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClients.length)}</span> of{" "}
                <span>{filteredClients.length}</span> clients
              </p>
              <div className="pagination-controls">
                <button
                  className="pagination-btn nav-btn"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="pagination-btn nav-btn"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      {/* ===== ADD CLIENT MODAL ===== */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Client</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={confirmAddClient}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name (Optional)"
                    className="modal-input"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Enter contact person"
                    className="modal-input"
                    required
                  />
                </div>
                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="modal-input"
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="modal-input"
                    />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>GSTIN Number *</label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    placeholder="Enter GSTIN number"
                    className="modal-input"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter complete address"
                    className="modal-textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-confirm">
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT CLIENT MODAL ===== */}
      {showEditModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Client</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={confirmEditClient}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="modal-input"
                  />
                </div>
                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Contact Person *</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="modal-input"
                      required
                    />
                  </div>
                </div>
                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="modal-input"
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="modal-input"
                    />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>GSTIN Number *</label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    className="modal-input"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="modal-textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-confirm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VIEW CLIENT MODAL ===== */}
      {showViewModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Client Details</h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="client-profile-header">
                <div className="client-profile-avatar">
                  <span className="material-symbols-outlined">business</span>
                </div>
                <div className="client-profile-info">
                  <h2>{selectedClient.companyName}</h2>
                  <p className="profile-contact">{selectedClient.contactPerson}</p>
                </div>
              </div>

              <div className="client-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{selectedClient.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value">{selectedClient.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">GSTIN Number</span>
                  <span className="detail-value">{selectedClient.gst}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Orders</span>
                  <span className="detail-value">{selectedClient.totalOrders}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Spent</span>
                  <span className="detail-value">{selectedClient.totalSpent}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Order</span>
                  <span className="detail-value">{formatDate(selectedClient.lastOrder)}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{selectedClient.address}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button
                className="modal-confirm"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClient(selectedClient);
                }}
              >
                Edit Client
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ===== EXPORT MODAL ===== */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Clients</h3>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon info">
                <span className="material-symbols-outlined">download</span>
              </div>
              <p className="modal-title">Choose Export Format</p>
              <p className="modal-desc">
                Export {filteredClients.length} client records
              </p>
              <div className="export-options">
                <button className="export-option-btn" onClick={() => confirmExport("CSV")}>
                  <span className="material-symbols-outlined">description</span>
                  <span>CSV File</span>
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

export default Clients;