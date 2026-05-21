import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.js";
import "./Clients.css";

const Clients = () => {
  const { clients, addClient, updateClient, deleteClient, salesHistory } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewClient, setViewClient] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth <= 1024 ? 8 : 10);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth <= 1024 ? 8 : 10);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    clientType: "Company",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    gst: "",
  });

  // Filter & Enrich Clients
  const processedClients = clients.map(client => {
    // Robust linking logic: normalize phone and name to ensure match
    const clientPhoneClean = (client.phone || "").replace(/\D/g, "").slice(-10);
    const clientNameClean = (client.companyName || "").toLowerCase().trim();
    const contactNameClean = (client.contactPerson || "").toLowerCase().trim();

    const clientSales = (salesHistory || []).filter(s => {
      const salePhoneClean = (s.customerPhone || "").replace(/\D/g, "").slice(-10);
      const saleNameClean = (s.companyName || "").toLowerCase().trim();
      const saleContactClean = (s.customerName || "").toLowerCase().trim();

      return (
        (clientPhoneClean && salePhoneClean === clientPhoneClean) ||
        (clientNameClean && saleNameClean === clientNameClean) ||
        (contactNameClean && saleContactClean === contactNameClean)
      );
    });

    const totalOrders = clientSales.length;
    const totalSpentValue = clientSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    return {
      ...client,
      totalOrders,
      totalSpentValue
    };
  });

  const filteredClients = processedClients.filter((client) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      (client.companyName?.toLowerCase() || "").includes(searchLow) ||
      (client.contactPerson?.toLowerCase() || "").includes(searchLow) ||
      (client.email?.toLowerCase() || "").includes(searchLow) ||
      (client.phone || "").includes(searchTerm)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

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
      clientType: "Company",
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      gst: "",
    });
  };

  const confirmAddClient = async (e) => {
    e.preventDefault();
    const isCompany = formData.clientType === "Company";
    if (!formData.contactPerson || !formData.address) {
      setFeedbackMessage("Please fill required fields (Contact & Address)");
      setTimeout(() => setFeedbackMessage(""), 2500);
      return;
    }

    if (isCompany && !formData.companyName) {
      setFeedbackMessage("Company name is required for Company clients");
      setTimeout(() => setFeedbackMessage(""), 2500);
      return;
    }

    try {
      await addClient({
        ...formData,
        status: "Active",
        phone: formData.phone?.trim() ? formData.phone : undefined,
        address: formData.address || "Not provided",
      });
      setShowAddModal(false);
      resetForm();
      setFeedbackMessage("Harsath - Client Added Successfully!");
    } catch (err) {
      setFeedbackMessage("Error adding client");
    }
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

  const confirmEditClient = async (e) => {
    e.preventDefault();
    try {
      await updateClient(selectedClient.id, formData);
      setShowEditModal(false);
      setSelectedClient(null);
      resetForm();
      setFeedbackMessage("✅ Client Updated Successfully!");
    } catch (err) {
      setFeedbackMessage("Error updating client");
    }
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      setShowDeleteModal(false);
      setClientToDelete(null);
      setFeedbackMessage("🗑️ Client deleted successfully");
    } catch (err) {
      setFeedbackMessage("❌ Error deleting client");
    }
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

  const handleExport = () => {
    setExportLoading(true);
    setTimeout(() => {
      const headers = ["Company", "Contact", "Email", "Phone", "GST", "Orders", "Spent"];
      const csvContent = [
        headers.join(","),
        ...filteredClients.map(c => [
          c.companyName, c.contactPerson, c.email, c.phone, c.gst, c.totalOrders, c.totalSpentValue
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clients_portfolio_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      setExportLoading(false);
      setFeedbackMessage("Harsath - CSV Exported Successfully!");
      setTimeout(() => setFeedbackMessage(""), 2500);
    }, 1200);
  };

  return (
    <div className="clients-container">
      {feedbackMessage && <div className="feedback-toast"><span>{feedbackMessage}</span></div>}

      <div className="page-header premium-header client-header">
        <div className="header-content">
          <h1 className="page-title client-page-title">Client Details</h1>
          <button
            className="btn-add-circle-premium"
            onClick={() => { resetForm(); setShowAddModal(true); }}
            title="New Client"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>

      <div className="search-filter-area">
        <div className="premium-search-bar">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search by name, company, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-export-premium" onClick={handleExport} disabled={exportLoading}>
          <span className="material-symbols-outlined">{exportLoading ? "sync" : "download"}</span>
          {exportLoading ? "Processing..." : "Export Portfolio"}
        </button>
      </div>

      <div className="table-container">
        {/* DESKTOP VIEW */}
        <div className="desktop-table-view">
          <table className="clients-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>COMPANY / INDIVIDUAL</th>
                <th style={{ textAlign: 'left' }}>Contact</th>
                <th style={{ textAlign: 'left' }}>Phone</th>
                <th style={{ textAlign: 'left' }}>Orders</th>
                <th style={{ textAlign: 'left' }}>Spent Amount</th>
                <th style={{ textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map(client => (
                <tr key={client.id} className="client-row">
                  <td style={{ textAlign: 'left' }}>
                    <div className="company-info-row">
                      <span className="company-name">{client.companyName || client.contactPerson}</span>
                      <span className={`type-badge-mini ${client.clientType?.toLowerCase() || 'company'}`}>
                        {client.clientType === "Personal" ? "I" : "C"}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'left' }}><p className="contact-person">{client.contactPerson}</p></td>
                  <td style={{ textAlign: 'left' }}>
                    <div className="comm-inline-group">
                      <span className="client-phone">{client.phone}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <span className="order-count-badge">{client.totalOrders || 0} Orders</span>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <span className="spent-amount-bold">₹{(client.totalSpentValue || 0).toLocaleString('en-IN')}</span>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div className="action-buttons" style={{ justifyContent: 'flex-start' }}>
                      <button className="action-btn" title="View" onClick={() => { setViewClient(client); setShowViewModal(true); }} style={{ color: '#10b981' }}>
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button className="action-btn" title="Edit" onClick={() => {
                        setSelectedClient(client);
                        setFormData({
                          clientType: client.clientType || "Company",
                          companyName: client.companyName || "",
                          contactPerson: client.contactPerson || "",
                          email: client.email || "",
                          phone: client.phone || "",
                          address: client.address || "",
                          gst: client.gst || ""
                        });
                        setShowEditModal(true);
                      }}><span className="material-symbols-outlined">edit</span></button>
                      <button
                        className="action-btn delete-btn"
                        title="Delete"
                        onClick={() => { setClientToDelete(client); setShowDeleteModal(true); }}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW - Modern Strip Cards */}
        <div className="mobile-client-cards">
          {paginatedClients.length > 0 ? (
            paginatedClients.map((client, index) => (
              <div key={client.id} className="mobile-client-strip-card">
                <div className="card-top">
                  <div className="card-avatar">
                    <span className="material-symbols-outlined">
                      {client.clientType === 'Personal' ? 'person' : 'apartment'}
                    </span>
                  </div>
                  <div className="card-main-info">
                    <div className="name-row">
                      <span className="client-name">{client.companyName || client.contactPerson}</span>
                      <span className={`type-tag ${client.clientType?.toLowerCase()}`}>
                        {client.clientType === "Personal" ? "P" : "C"}
                      </span>
                    </div>
                    <span className="client-meta-info">
                      {client.phone} • {client.totalOrders || 0} Orders
                    </span>
                  </div>

                  {/* Dropdown Action Menu */}
                  <div className="card-action-container">
                    <button
                      className={`btn-more-actions ${activeDropdownId === client.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(activeDropdownId === client.id ? null : client.id);
                      }}
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>

                    {activeDropdownId === client.id && (
                      <div className="mobile-action-dropdown" onClick={e => e.stopPropagation()}>
                        <button className="dropdown-item" onClick={() => { setViewClient(client); setShowViewModal(true); setActiveDropdownId(null); }}>
                          <span className="material-symbols-outlined">visibility</span>
                          View Portfolio
                        </button>
                        <button className="dropdown-item" onClick={() => {
                          setSelectedClient(client);
                          setFormData({
                            clientType: client.clientType || "Company",
                            companyName: client.companyName || "",
                            contactPerson: client.contactPerson || "",
                            email: client.email || "",
                            phone: client.phone || "",
                            address: client.address || "",
                            gst: client.gst || ""
                          });
                          setShowEditModal(true);
                          setActiveDropdownId(null);
                        }}>
                          <span className="material-symbols-outlined">edit_note</span>
                          Edit Details
                        </button>
                        <button className="dropdown-item delete" onClick={() => { setClientToDelete(client); setShowDeleteModal(true); setActiveDropdownId(null); }}>
                          <span className="material-symbols-outlined">delete</span>
                          Delete Client
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-bottom-row">
                  <div className="card-amount-info">
                    <span className="amount-label">Revenue Generated</span>
                    <span className="amount-value">₹{(client.totalSpentValue || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-mobile-state">
              <span className="material-symbols-outlined">group_off</span>
              <p>No clients found matching your search</p>
            </div>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {filteredClients.length > itemsPerPage && (
        <div className="pagination">
          <p className="pagination-info">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length}</p>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
            <button className="pagination-btn active">{currentPage}</button>
            <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>
      )}

      {/* MODALS (Add/Edit/View) */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay view-modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content view-modal-frame" onClick={e => e.stopPropagation()}>
            {/* Modal Drag Handle - Hidden for Full Screen */}
            <div className="modal-drag-handle view-modal-hide-handle"></div>

            <div className="modal-header view-modal-header">
              <div className="header-left-with-back">
                <button className="mobile-back-btn" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2>{showAddModal ? "New Client" : "Edit Profile"}</h2>
              </div>

              {/* Standard Close Button */}
              <button type="button" className="modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={showAddModal ? confirmAddClient : confirmEditClient}>
              <div className="modal-body">
                {/* Client Type Selector */}
                <div className="modal-form-group full-width">
                  <label>Client Portfolio Type</label>
                  <div className="client-type-selector">
                    <label className={`type-option ${formData.clientType === 'Company' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="clientType"
                        value="Company"
                        checked={formData.clientType === 'Company'}
                        onChange={handleInputChange}
                        style={{ position: 'absolute', opacity: 0 }}
                      />
                      <span className="material-symbols-outlined">apartment</span>
                      Business / Company
                    </label>
                    <label className={`type-option ${formData.clientType === 'Personal' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="clientType"
                        value="Personal"
                        checked={formData.clientType === 'Personal'}
                        onChange={handleInputChange}
                        style={{ position: 'absolute', opacity: 0 }}
                      />
                      <span className="material-symbols-outlined">person</span>
                      Personal / Individuals
                    </label>
                  </div>
                </div>

                <div className="modal-row-grid">
                  {formData.clientType === 'Company' ? (
                    <>
                      <div className="modal-form-group">
                        <label>Company Name *</label>
                        <input className="modal-input" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="e.g. Acme Corp" required />
                      </div>
                      <div className="modal-form-group">
                        <label>Contact Person *</label>
                        <input className="modal-input" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Harsath" required />
                      </div>
                    </>
                  ) : (
                    <div className="modal-form-group full-width">
                      <label>Contact Person *</label>
                      <input className="modal-input" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Harsath" required />
                    </div>
                  )}
                </div>

                <div className="modal-row-grid">
                  <div className="modal-form-group">
                    <label>Email Address</label>
                    <input className="modal-input" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="jofra@avseco.in" />
                  </div>
                  <div className="modal-form-group">
                    <label>Phone Number</label>
                    <input className="modal-input" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g. +91 98765 43210" />
                  </div>
                </div>

                {formData.clientType === 'Company' && (
                  <div className="modal-form-group animation-fade">
                    <label>GSTIN (Optional)</label>
                    <input className="modal-input" name="gst" value={formData.gst} onChange={handleInputChange} placeholder="e.g. 33AAAAA0000A1Z5" />
                  </div>
                )}

                <div className="modal-form-group full-width">
                  <label>Full Billing Address *</label>
                  <textarea className="modal-textarea" name="address" value={formData.address} onChange={handleInputChange} rows="3" placeholder="Enter complete office/billing address..." required />
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
      {showDeleteModal && clientToDelete && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: '#dc2626' }}>Delete Client</h2>
              <button className="modal-close" onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#dc2626', display: 'block', marginBottom: '12px' }}>warning</span>
              <p style={{ fontSize: '15px', color: '#374151', marginBottom: '6px' }}>
                Are you sure you want to delete
              </p>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                {clientToDelete.companyName || clientToDelete.contactPerson}?
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}>Cancel</button>
              <button
                className="modal-confirm"
                style={{ background: '#dc2626' }}
                onClick={handleDeleteClient}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '6px' }}>delete</span>
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW CLIENT MODAL */}
      {showViewModal && viewClient && (
        <div className="modal-overlay view-modal-overlay" onClick={() => { setShowViewModal(false); setViewClient(null); }}>
          <div className="modal-content view-modal-frame" onClick={e => e.stopPropagation()}>
            <div className="modal-header view-modal-header centered-header">
              <h2>Client Details</h2>
              <button className="modal-close-circle" onClick={() => { setShowViewModal(false); setViewClient(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-body client-view-body centered-body">
              {/* PROFILE IDENTITY CARD - CENTERED */}
              <div className="view-profile-section-centered">
                <div className="view-avatar-centered">
                  <span className="material-symbols-outlined">
                    {viewClient.clientType === 'Personal' ? 'person' : 'apartment'}
                  </span>
                </div>
                <h3 className="view-name-centered">
                  {viewClient.companyName || viewClient.contactPerson}
                </h3>
                <div className="view-badge-centered">
                  {viewClient.clientType || 'Corporate'}
                </div>
              </div>

              {/* CORE INFO GRID - CARD STYLE */}
              <div className="view-info-grid-cards">
                <div className="view-card-item">
                  <span className="card-label">Contact Person</span>
                  <span className="card-value">{viewClient.contactPerson || '—'}</span>
                </div>

                <div className="view-card-item">
                  <span className="card-label">Email Address</span>
                  <span className="card-value">{viewClient.email || '—'}</span>
                </div>

                <div className="view-card-item">
                  <span className="card-label">Phone Number</span>
                  <span className="card-value">{viewClient.phone || '—'}</span>
                </div>

                <div className="view-card-item">
                  <span className="card-label">GSTIN Number</span>
                  <span className="card-value">{viewClient.gst || '—'}</span>
                </div>
              </div>

              {/* ADDRESS CARD - FULL WIDTH */}
              <div className="view-card-item full-width">
                <span className="card-label">Billing Address</span>
                <span className="card-value-long">{viewClient.address || 'No address provided'}</span>
              </div>

              {/* ORDER SUMMARY */}
              <div className="view-stats-row-compact">
                <div className="stat-pill success">
                  <span className="pill-label">Total Spent:</span>
                  <span className="pill-value">₹{(viewClient.totalSpentValue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="stat-pill neutral">
                  <span className="pill-label">Orders:</span>
                  <span className="pill-value">{viewClient.totalOrders || 0}</span>
                </div>
              </div>

              <button className="btn-view-history-pill-compact" onClick={() => {/* handle history view */ }}>
                <span className="material-symbols-outlined">history</span>
                View Order History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Clients;