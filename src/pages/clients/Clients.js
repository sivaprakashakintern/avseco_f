import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.js";
import "./Clients.css";
import "./Clients_Invoice.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";


const Clients = () => {
  const { clients, addClient, updateClient, deleteClient, salesHistory } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [lastDeletedClient, setLastDeletedClient] = useState(null);
  const [undoTimer, setUndoTimer] = useState(5);
  const timerRef = React.useRef(null);


  const [clientToDelete, setClientToDelete] = useState(null);
  const [clientForHistory, setClientForHistory] = useState(null);
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
      (client.gst?.toLowerCase() || "").includes(searchLow) ||
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
      const clientBackup = { ...clientToDelete };
      await deleteClient(clientToDelete.id);
      
      setLastDeletedClient(clientBackup);
      setShowDeleteModal(false);
      setClientToDelete(null);
      
      // Trigger Undo Toast
      setShowUndo(true);
      setUndoTimer(5);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setUndoTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setShowUndo(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setFeedbackMessage("❌ Error deleting client");
      setTimeout(() => setFeedbackMessage(""), 2500);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedClient) return;
    try {
      await addClient(lastDeletedClient);
      setShowUndo(false);
      clearInterval(timerRef.current);
      setFeedbackMessage("♻️ Client restored successfully!");
    } catch (err) {
      setFeedbackMessage("❌ Failed to restore client");
    }
    setTimeout(() => setFeedbackMessage(""), 2500);
  };


  const exportPDF = () => {
    setExportLoading(true);
    try {
      const doc = new jsPDF();
      doc.setFillColor(26, 107, 60); 
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("AVSECO INDUSTRIES", 15, 25);
      doc.setFontSize(12);
      doc.text("CLIENT MANAGEMENT REPORT", 15, 35);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 150, 35);

      const tableColumn = ["S.No", "Client Name / Company", "Type", "GSTIN", "Total Orders", "Total Spent"];
      const tableRows = filteredClients.map((client, index) => [
        index + 1,
        client.companyName || client.contactPerson,
        client.clientType,
        client.gst || "N/A",
        client.totalOrders,
        client.totalSpent
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'striped',
        headStyles: { fillColor: [26, 107, 60], fontSize: 10, halign: 'center' },
        columnStyles: { 4: { halign: 'center' }, 5: { halign: 'right' } }
      });

      doc.save("AVSECO_Client_Report.pdf");
      setFeedbackMessage("✅ PDF Report generated successfully");
    } catch (error) {
      console.error("PDF Export Error:", error);
      setFeedbackMessage("❌ Failed to generate PDF");
    } finally {
      setExportLoading(false);
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
  };


  const exportExcel = async () => {
    setExportLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clients Portfolio');

      // 1. Defining Columns
      worksheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Client Name / Contact Person', key: 'name', width: 35 },
        { header: 'Portfolio Type', key: 'type', width: 25 },
        { header: 'Email Address', key: 'email', width: 30 },
        { header: 'Phone Number', key: 'phone', width: 20 },
        { header: 'GSTIN / ID', key: 'gst', width: 20 },
        { header: 'Address', key: 'address', width: 40 },
        { header: 'Total Orders', key: 'orders', width: 15 },
        { header: 'Total Spent', key: 'spent', width: 18 },
      ];

      // 2. Styling Header (Vibrant Green)
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1A6B3C' } // #1a6b3c
        };
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 11
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      headerRow.height = 30;

      // 3. Adding Data
      filteredClients.forEach((client, index) => {
        const row = worksheet.addRow({
          sno: index + 1,
          name: client.companyName || client.contactPerson,
          type: client.clientType === 'Company' ? `Company (${client.companyName})` : client.clientType,
          email: client.email || "N/A",
          phone: client.phone || "N/A",
          gst: client.gst || "N/A",
          address: client.address || "N/A",
          orders: client.totalOrders,
          spent: client.totalSpentValue
        });

        // Alternate row colors for readability
        if (index % 2 !== 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9FAFB' }
            };
          });
        }
      });

      // 4. Finalizing & Downloading
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AVSECO_Clients_Portfolio_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      setFeedbackMessage("✅ Colorful Excel downloaded successfully!");
    } catch (error) {
      console.error("Excel Export Error:", error);
      setFeedbackMessage("❌ Failed to generate Colorful Excel");
    } finally {
      setExportLoading(false);
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
  };



  return (
    <div className="clients-page-enterprise">
      {feedbackMessage && <div className="feedback-toast success"><span>{feedbackMessage}</span></div>}

      {/* UNDO TOAST */}
      {showUndo && (
        <div className="undo-toast-premium">
          <div className="undo-content">
            <span className="material-symbols-outlined icon-undo">delete_sweep</span>
            <div className="undo-text-stack">
              <span className="undo-main">Client Record Removed</span>
              <span className="undo-timer">Expiring in {undoTimer}s...</span>
            </div>
            <button className="undo-action-btn" onClick={handleUndoDelete}>
              <span className="material-symbols-outlined">undo</span>
              UNDO
            </button>
            <button className="undo-close-btn" onClick={() => setShowUndo(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}


      <div className="module-banner-premium">
        <div className="banner-left">
          <h1 className="banner-title">Clients</h1>
        </div>
        <div className="banner-right">
          <button className="banner-btn-outline" onClick={() => setShowExportModal(true)} disabled={exportLoading}>
            <span className="material-symbols-outlined">{exportLoading ? "sync" : "download"}</span>
            {exportLoading ? "Exporting..." : "Export"}
          </button>
          <button className="banner-btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <span className="material-symbols-outlined">person_add</span>
            Add Client
          </button>
        </div>
      </div>

      <div className="enterprise-actions-bar">
        <div className="actions-left-group">
          <div className="enterprise-search">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ===== CLIENT LIST VIEW ===== */}
      <div className="client-list-premium">
        {paginatedClients.map(client => (
          <div key={client.id} className="client-card-enterprise-row">
            <div className="row-column identity-col">
              <div className="client-icon-wrapper">
                <span className="material-symbols-outlined icon-main">
                  {client.clientType === 'Company' ? 'corporate_fare' : 'person'}
                </span>
              </div>
              <div className="client-info-stack">
                <h4 className="client-display-name">{client.companyName || client.contactPerson}</h4>
                <div className="client-meta-tags">
                  <span className={`status-chip ${client.clientType?.toLowerCase() || 'company'}`}>
                    {client.clientType || 'COMPANY'}
                  </span>
                  <span className="id-secondary">{client.gst || 'AV-ID: 104'}</span>
                </div>
              </div>
            </div>

            <div className="row-column contact-col">
              <div className="contact-info-pills">
                <div className="professional-pill">
                  <span className="material-symbols-outlined">person</span>
                  <span className="pill-text">{client.contactPerson}</span>
                </div>
                <div className="professional-pill phone">
                  <span className="material-symbols-outlined">call</span>
                  <span className="pill-text">{client.phone}</span>
                </div>
              </div>
            </div>

            <div className="row-column stats-col">
              <div className="performance-container">
                <div className="perf-label-group">
                  <span className="perf-label">ORDERS</span>
                  <span className="perf-label-val">{client.totalOrders}</span>
                </div>
                <div className="perf-divider"></div>
                <div className="amount-indicator-professional">
                  <span className="currency">₹</span>
                  <span className="val">{client.totalSpentValue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="row-column actions-col">
              <div className="action-row-professional">
                <button className="action-btn-pro edit" onClick={() => {
                  setSelectedClient(client);
                  setFormData({ ...client });
                  setShowEditModal(true);
                }} title="Edit Profile">
                  <span className="material-symbols-outlined">edit_square</span>
                </button>
                <button className="action-btn-pro history" onClick={() => {
                  setClientForHistory(client);
                  setShowHistoryModal(true);
                }} title="Transaction History">
                  <span className="material-symbols-outlined">history</span>
                </button>
                <button className="action-btn-pro delete" onClick={() => {
                  setClientToDelete(client);
                  setShowDeleteModal(true);
                }} title="Remove Client">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="empty-state-card">
            <span className="material-symbols-outlined">search_off</span>
            <p>No clients found matching your search.</p>
          </div>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {filteredClients.length > itemsPerPage && (
        <div className="pagination-premium">
          <button
            className="pag-nav-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="pag-numbers">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`pag-num-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="pag-nav-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {/* MODALS */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showAddModal ? "New Client Portfolio" : "Update Profile"}</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="modal-form-wrapper" onSubmit={showAddModal ? confirmAddClient : confirmEditClient}>
              <div className="modal-body">
                {showAddModal && (
                  <div className="modal-form-group">
                    <label>Client Portfolio Type</label>
                    <div className="client-type-selector">
                      <label className={`type-option ${formData.clientType === 'Company' ? 'active' : ''}`}>
                        <input type="radio" name="clientType" value="Company" checked={formData.clientType === 'Company'} onChange={handleInputChange} />
                        <span className="material-symbols-outlined">business</span>
                        Business / Company
                      </label>
                      <label className={`type-option ${formData.clientType === 'Personal' ? 'active' : ''}`}>
                        <input type="radio" name="clientType" value="Personal" checked={formData.clientType === 'Personal'} onChange={handleInputChange} />
                        <span className="material-symbols-outlined">person</span>
                        Personal 
                      </label>
                    </div>
                  </div>
                )}
                <div className="modal-form-row">
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
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Email Address</label>
                    <input className="modal-input" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="jofra@avseco.in" />
                  </div>
                  <div className="modal-form-group">
                    <label>Phone Number *</label>
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

      {/* TRANSACTION HISTORY MODAL */}
      {showHistoryModal && clientForHistory && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content history-modal-enterprise" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-flex-title">
                <span className="material-symbols-outlined hist-icon-header">receipt_long</span>
                <div className="header-meta-combo">
                  <span className="upper-meta-label">Client History</span>
                  <h2>Sales Records - <span className="highlight-client-name">{clientForHistory.companyName || clientForHistory.contactPerson}</span></h2>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body history-body no-padding">
              <table className="enterprise-history-table">
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>DATE & TIME</th>
                    <th>COMPANY / CUSTOMER</th>
                    <th>PRODUCTS</th>
                    <th>TOTAL AMOUNT</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const items = (salesHistory || []).filter(s =>
                      s.customerPhone === clientForHistory.phone ||
                      s.companyName === clientForHistory.companyName
                    );
                    if (items.length === 0) return <tr><td colSpan="7" className="empty-td">No records found.</td></tr>;
                    return items.map((sale, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="date-cell">
                          <div className="dt-primary">{new Date(sale.createdAt).toLocaleDateString()}</div>
                          <div className="dt-secondary">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="customer-cell">
                          <div className="cust-primary">{sale.companyName || 'Direct Sale'}</div>
                          <div className="cust-secondary">{sale.customerName || clientForHistory.contactPerson}</div>
                        </td>
                        <td className="product-cell">
                          <div className="prod-primary">{sale.items?.[0]?.productName || 'Areca plates'}</div>
                          <div className="prod-secondary">{sale.items?.[0]?.quantity || 0} Pieces</div>
                        </td>
                        <td className="amount-cell">₹{(sale.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`status-pill-small ${sale.paymentStatus?.toLowerCase() || 'paid'}`}>
                            {sale.paymentStatus || 'PAID'}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button className="invoice-btn-pro" onClick={() => { setSelectedSale(sale); setShowInvoiceModal(true); }}>
                            <span className="material-symbols-outlined">description</span>
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {showInvoiceModal && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="bill-modal-content-pro" id="printable-bill" onClick={e => e.stopPropagation()}>
            <div className="ci-header">
              <div className="ci-logo-area">
                <img src="/assets/logo.png" alt="Logo" className="ci-logo-img" />
                <div>
                  <div className="ci-company-name">AVSECO INDUSTRIES</div>
                  <div className="ci-company-addr">Tiruttani - 631210</div>
                </div>
              </div>
              <div className="ci-invoice-title">INVOICE</div>
            </div>
            <div className="ci-billto">
              <div>
                <div className="ci-billto-title">BILL TO:</div>
                <div className="ci-billto-row"><b>Company:</b> {selectedSale.companyName || 'Direct Sale'}</div>
                <div className="ci-billto-row"><b>Customer:</b> {selectedSale.customerName || clientForHistory.contactPerson}</div>
                <div className="ci-billto-row"><b>Phone:</b> {selectedSale.customerPhone || clientForHistory.phone}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div className="ci-billto-row"><b>Date:</b> {new Date(selectedSale.createdAt).toLocaleDateString()}</div>
                <div className="ci-billto-row"><b>ID:</b> AVS-INV-{selectedSale._id?.slice(-6).toUpperCase()}</div>
              </div>
            </div>
            <div className="ci-table-wrap">
              <table className="ci-table">
                <thead className="ci-tbl-head">
                  <tr><th>Item</th><th>Product</th><th>Size</th><th>Qty</th><th>Amount</th></tr>
                </thead>
                <tbody className="ci-tbody">
                  {(selectedSale.items || [{ productName: 'Areca plates', quantity: 5000, size: '6-inch', price: selectedSale.totalAmount }]).map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.productName || item.product}</td>
                      <td>{item.size || '-'}</td>
                      <td>{item.quantity || item.qty}</td>
                      <td>₹{(item.price || item.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ci-summary">
              <div className="ci-summary-box">
                <div className="ci-total-row"><span>TOTAL:</span><span>₹{(selectedSale.totalAmount || 0).toLocaleString()}</span></div>
              </div>
            </div>
            <div className="bill-modal-footer-pro no-print">
              <button className="bill-btn-pro close" onClick={() => setShowInvoiceModal(false)}>Close</button>
              <button className="bill-btn-pro print" onClick={() => window.print()}>Print</button>
              <button className="bill-btn-pro whatsapp" onClick={() => {
                const message = `*INVOICE: AVS-INV-${selectedSale._id?.slice(-6).toUpperCase()}*%0A*Amount:* ₹${(selectedSale.totalAmount || 0).toLocaleString()}`;
                window.open(`https://wa.me/${(selectedSale.customerPhone || clientForHistory.phone).replace(/\D/g, '')}?text=${message}`, '_blank');
              }}>WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL (Refined & Premium) */}
      {showDeleteModal && clientToDelete && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}>
          <div className="modal-content delete-modal-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="delete-title">Delete Client</h2>
              <button className="modal-close" onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body delete-modal-body">
              <div className="delete-warning-icon">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <p className="delete-warning-text">Are you sure you want to delete</p>
              <h4 className="delete-target-name">{clientToDelete.companyName || clientToDelete.contactPerson}</h4>
              <p className="delete-subtext">This action is permanent and cannot be undone.</p>
            </div>
            <div className="modal-footer delete-modal-footer">
              <button className="modal-cancel-pro" onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}>No, Keep it</button>
              <button className="modal-delete-pro" onClick={handleDeleteClient}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}


      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content export-modal-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Export Format</h2>
              <button className="modal-close" onClick={() => setShowExportModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body export-modal-body">
              <div className="export-options-grid">
                <button className="export-option-card pdf" onClick={() => { exportPDF(); setShowExportModal(false); }}>
                  <span className="material-symbols-outlined icon-opt">description</span>
                  <div className="opt-title">Professional PDF</div>
                  <div className="opt-desc">Colorful header & branding</div>
                </button>
                <button className="export-option-card xls" onClick={() => { exportExcel(); setShowExportModal(false); }}>
                  <span className="material-symbols-outlined icon-opt">table_view</span>
                  <div className="opt-title">Excel Spreadsheet</div>
                  <div className="opt-desc">Download as .xlsx</div>
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;