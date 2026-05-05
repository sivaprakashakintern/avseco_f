import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.js";
import "./Clients.css";

const Clients = () => {
  const { clients, addClient, updateClient, deleteClient, salesHistory } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewClient, setViewClient] = useState(null);
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
    phone: "+91 ",
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
      // Always maintain '+91 ' and limit to 10 digits
      if (!value.startsWith("+91 ")) {
        value = "+91 " + value.replace(/^\+91\s*/, "");
      }
      const digits = value.slice(4).replace(/\D/g, "").slice(0, 10);
      value = "+91 " + digits;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      clientType: "Company",
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "+91 ",
      address: "",
      gst: "",
    });
  };

  const confirmAddClient = async (e) => {
    e.preventDefault();
    const isCompany = formData.clientType === "Company";
    if (!formData.contactPerson || !formData.phone || !formData.address) {
      setFeedbackMessage("Please fill required fields (Contact, Phone & Address)");
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
        phone: formData.phone || "+91 00000 00000",
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

      <div className="premium-header-green">
        <div className="header-left-group">
          <h1 className="page-title-white">Client Management</h1>
        </div>
        <div className="header-right-group">
          <button className="btn-add-premium-outline" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <span className="material-symbols-outlined">person_add</span>
            Add Client
          </button>
        </div>
      </div>

      <div className="clients-stats">
        <div className="stat-card">
          <div className="stat-icon blue"><span className="material-symbols-outlined">groups</span></div>
          <div className="stat-info">
            <span className="stat-label">Network Strength</span>
            <span className="stat-value">{filteredClients.length} <small>Partners</small></span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><span className="material-symbols-outlined">currency_rupee</span></div>
          <div className="stat-info">
            <span className="stat-label">Portfolio Revenue</span>
            <span className="stat-value">₹{processedClients.reduce((s, c) => s + c.totalSpentValue, 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search by name, company, or GST..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
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

        {/* MOBILE VIEW */}
        <div className="mobile-client-cards">
          {paginatedClients.map(client => (
            <div key={client.id} className="mobile-client-card">
              <div className="mobile-client-header">
                <div>
                  <p className="mobile-client-name">{client.companyName || client.contactPerson}</p>
                </div>
              </div>
              <div className="mobile-client-meta">
                <div className="meta-item">
                  <span className="meta-label">Orders</span>
                  <span className="meta-value">{client.totalOrders}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Total Spent</span>
                  <span className="meta-value">{client.totalSpent}</span>
                </div>
              </div>
              <div className="mobile-client-actions">
                <button className="action-btn" style={{ color: '#10b981' }} onClick={(e) => { e.stopPropagation(); setViewClient(client); setShowViewModal(true); }}>
                  <span className="material-symbols-outlined">visibility</span>
                </button>
                <button className="action-btn" onClick={(e) => { 
                   e.stopPropagation();
                   setSelectedClient(client); 
                   setFormData({...client}); 
                   setShowEditModal(true); 
                }}><span className="material-symbols-outlined">edit</span></button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => { e.stopPropagation(); setClientToDelete(client); setShowDeleteModal(true); }}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        {filteredClients.length > itemsPerPage && (
          <div className="pagination">
            <p className="pagination-info">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length}</p>
            <div className="pagination-controls">
              <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Prev</button>
              <button className="pagination-btn active">{currentPage}</button>
              <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS (Add/Edit/View) */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showAddModal ? "New Client Portfolio" : "Update Profile"}</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={showAddModal ? confirmAddClient : confirmEditClient}>
              <div className="modal-body">
                <div className="modal-form-group">
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
                      Personal / Individuals
                    </label>
                  </div>
                </div>

                {formData.clientType === 'Company' && (
                  <div className="modal-form-group animation-fade">
                    <label>Company Name *</label>
                    <input className="modal-input" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="e.g. Acme Corp" required />
                  </div>
                )}
                <div className="modal-form-group">
                  <label>Contact Person *</label>
                  <input className="modal-input" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Harsath" required />
                </div>
                <div className="modal-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="modal-form-group">
                    <label>Email</label>
                    <input className="modal-input" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="jofra@avseco.in" />
                  </div>
                  <div className="modal-form-group">
                    <label>Phone *</label>
                    <input className="modal-input" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g. +91 98765 43210" required />
                  </div>
                </div>
                {formData.clientType === 'Company' && (
                  <div className="modal-form-group animation-fade">
                    <label>GSTIN</label>
                    <input className="modal-input" name="gst" value={formData.gst} onChange={handleInputChange} placeholder="e.g. 33AAAAA0000A1Z5" />
                  </div>
                )}
                <div className="modal-form-group">
                  <label>Address *</label>
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

      {/* VIEW CLIENT MODAL - PERFECTED VERSION */}
      {showViewModal && viewClient && (
        <div className="modal-overlay" onClick={() => { setShowViewModal(false); setViewClient(null); }}>
          <div className="modal-content" style={{ maxWidth: '560px', padding: 0, border: 'none', background: '#f8fafc', boxShadow: '0 25px 70px rgba(0,0,0,0.15)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            
            {/* TOP ACTION BAR */}
            <div style={{ padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Client Portfolio</span>
              <button onClick={() => { setShowViewModal(false); setViewClient(null); }} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px 32px 32px' }}>
              {/* PROFILE IDENTITY CARD */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #006A4E 0%, #004D39 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0, 106, 78, 0.2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'white' }}>
                    {viewClient.clientType === 'Personal' ? 'person' : 'apartment'}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {viewClient.companyName || viewClient.contactPerson}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>{viewClient.clientType || 'Corporate'}</span>
                    <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>ID: CL-{viewClient._id?.substring(20).toUpperCase() || 'NEW'}</span>
                  </div>
                </div>
              </div>

              {/* CORE INFO GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Contact Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Contact Person</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', paddingLeft: '38px' }}>{viewClient.contactPerson || '—'}</div>
                </div>

                {/* Phone Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Phone Number</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', paddingLeft: '38px' }}>{viewClient.phone || '—'}</div>
                </div>

                {/* Email Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Email Address</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', paddingLeft: '38px', wordBreak: 'break-all' }}>{viewClient.email || '—'}</div>
                </div>

                {/* GST Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified_user</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>GSTIN Number</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', paddingLeft: '38px' }}>{viewClient.gst || '—'}</div>
                </div>
              </div>

              {/* ADDRESS CARD */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #edf2f7', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Official Billing Address</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#475569', paddingLeft: '38px', lineHeight: '1.6' }}>{viewClient.address || 'No address provided'}</div>
              </div>

              {/* REVENUE & ENGAGEMENT STATS */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #ffffff, #f1f5f9)', borderRadius: '16px', padding: '16px', border: '1px solid #edf2f7', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Orders</div>
                  <div style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a' }}>{viewClient.totalOrders || 0}</div>
                </div>
                <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #ffffff, #f0fdf4)', borderRadius: '16px', padding: '16px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>Total Revenue</div>
                  <div style={{ fontSize: '24px', fontWeight: 950, color: '#006A4E' }}>₹{(viewClient.totalSpentValue || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
            
            {/* FOOTER ACTIONS */}
            <div style={{ padding: '20px 32px', background: 'white', borderTop: '1px solid #edf2f7', display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => { setShowViewModal(false); setViewClient(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
              >
                Close Profile
              </button>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedClient(viewClient);
                  setFormData({
                    clientType: viewClient.clientType || "Company",
                    companyName: viewClient.companyName || "",
                    contactPerson: viewClient.contactPerson || "",
                    email: viewClient.email || "",
                    phone: viewClient.phone || "",
                    address: viewClient.address || "",
                    gst: viewClient.gst || ""
                  });
                  setViewClient(null);
                  setShowEditModal(true);
                }}
                style={{ flex: 1.5, padding: '12px', borderRadius: '12px', border: 'none', background: '#006A4E', fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', boxShadow: '0 4px 12px rgba(0, 106, 78, 0.2)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_note</span>
                Edit Account Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Clients;