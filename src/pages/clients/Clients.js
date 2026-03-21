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
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    gst: "",
  });

  // Filter & Enrich Clients
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
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
    if (!formData.contactPerson || !formData.email || !formData.gst) {
      setFeedbackMessage("Please fill all required fields (Contact, Email, GST)");
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
      setFeedbackMessage("Client added successfully");
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
      setFeedbackMessage("Client updated successfully");
    } catch (err) {
      setFeedbackMessage("Error updating client");
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
      setFeedbackMessage("CSV Exported successfully");
      setTimeout(() => setFeedbackMessage(""), 2500);
    }, 1200);
  };

  return (
    <div className="clients-container">
      {feedbackMessage && <div className="feedback-toast"><span>{feedbackMessage}</span></div>}

      <div className="premium-header">
        <div>
          <h1 className="page-title">Client Portfolio</h1>
          <p className="subtitle-slim">Manage your business relationships & history</p>
        </div>
        <div className="header-actions">
          <button className="btn-transfer-premium" onClick={() => { resetForm(); setShowAddModal(true); }}>
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
                <th>Company / GST</th>
                <th>Contact</th>
                <th>Communication</th>
                <th>History</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map(client => (
                <tr key={client.id} className="client-row">
                  <td>
                    <div className="company-info">
                      <div className="company-icon"><span className="material-symbols-outlined">business</span></div>
                      <div>
                        <p className="company-name">{client.companyName || "N/A"}</p>
                        <p className="company-gst">GST: {client.gst}</p>
                      </div>
                    </div>
                  </td>
                  <td><p className="contact-person">{client.contactPerson}</p></td>
                  <td>
                    <p className="client-email">{client.email}</p>
                    <p className="client-phone">{client.phone}</p>
                  </td>
                  <td>
                    <div className="history-badges">
                      <span className="order-count">{client.totalOrders} Orders</span>
                      <p className="spent-amount">{client.totalSpent}</p>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => { 
                        setSelectedClient(client);
                        setFormData({
                          companyName: client.companyName,
                          contactPerson: client.contactPerson,
                          email: client.email,
                          phone: client.phone,
                          address: client.address,
                          gst: client.gst
                        });
                        setShowEditModal(true);
                       }}><span className="material-symbols-outlined">edit</span></button>
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
                <div className="company-icon"><span className="material-symbols-outlined">business</span></div>
                <div>
                  <p className="mobile-client-name">{client.companyName || client.contactPerson}</p>
                  <p className="company-gst">{client.gst}</p>
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
                <button className="action-btn" onClick={(e) => { 
                   e.stopPropagation();
                   setSelectedClient(client); 
                   setFormData({...client}); 
                   setShowEditModal(true); 
                }}><span className="material-symbols-outlined">edit</span></button>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="pagination">
          <p className="pagination-info">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length}</p>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Prev</button>
            <button className="pagination-btn active">{currentPage}</button>
            <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>
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
                  <label>Company Name</label>
                  <input className="modal-input" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="e.g. Acme Corp" />
                </div>
                <div className="modal-form-group">
                  <label>Contact Person *</label>
                  <input className="modal-input" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required />
                </div>
                <div className="modal-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="modal-form-group">
                    <label>Email *</label>
                    <input className="modal-input" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="modal-form-group">
                    <label>Phone</label>
                    <input className="modal-input" name="phone" value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>GSTIN *</label>
                  <input className="modal-input" name="gst" value={formData.gst} onChange={handleInputChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Address</label>
                  <textarea className="modal-textarea" name="address" value={formData.address} onChange={handleInputChange} rows="3" />
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

      {showViewModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Client History</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
               <div className="company-icon" style={{ width: '80px', height: '80px', margin: '0 auto 20px', fontSize: '40px', borderRadius: '50%' }}>
                 <span className="material-symbols-outlined">business</span>
               </div>
               <h3 style={{ fontSize: '22px', color: '#0f172a' }}>{selectedClient.companyName || "Private Client"}</h3>
               <p style={{ color: '#64748b', marginBottom: '30px' }}>{selectedClient.contactPerson}</p>
               
               <div className="mobile-client-meta" style={{ gridTemplateColumns: '1fr', textAlign: 'left', gap: '15px' }}>
                  <div className="meta-item"><span className="meta-label">GSTIN</span><span className="meta-value">{selectedClient.gst}</span></div>
                  <div className="meta-item"><span className="meta-label">Total Volume</span><span className="meta-value">{selectedClient.totalOrders} Orders</span></div>
                  <div className="meta-item"><span className="meta-label">Gross Value</span><span className="meta-value">{selectedClient.totalSpent}</span></div>
                  <div className="meta-item"><span className="meta-label">Address</span><span className="meta-value" style={{ fontSize: '12px' }}>{selectedClient.address}</span></div>
               </div>
            </div>
            <div className="modal-footer">
              <button className="modal-confirm" onClick={() => setShowViewModal(false)} style={{ width: '100%' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;