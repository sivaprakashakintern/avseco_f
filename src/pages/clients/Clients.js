import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Clients.css";

const Clients = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("list");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Clients Data with State
  const [clients, setClients] = useState([
    {
      id: 1,
      companyName: "Eco Products Ltd",
      contactPerson: "Rahul Sharma",
      email: "rahul@ecoproducts.com",
      phone: "+91 98765 43210",
      status: "Active",
      totalOrders: 45,
      totalSpent: "₹12,45,000",
      lastOrder: "2026-02-10",
      address: "123 Green Street, Mumbai - 400001",
      gst: "27ABCDE1234F1Z5",
    },
    {
      id: 2,
      companyName: "Green Earth Solutions",
      contactPerson: "Priya Patel",
      email: "priya@greenearth.com",
      phone: "+91 87654 32109",
      status: "Active",
      totalOrders: 38,
      totalSpent: "₹8,90,500",
      lastOrder: "2026-02-08",
      address: "456 Eco Park, Delhi - 110001",
      gst: "07FGHIJ5678K2L6",
    },
    {
      id: 3,
      companyName: "Sustainable Living Store",
      contactPerson: "Amit Kumar",
      email: "amit@sustainable.com",
      phone: "+91 76543 21098",
      status: "Active",
      totalOrders: 22,
      totalSpent: "₹5,67,800",
      lastOrder: "2026-02-05",
      address: "789 Green Avenue, Bangalore - 560001",
      gst: "29KLMNO9012P3M7",
    },
    {
      id: 4,
      companyName: "Nature's Basket",
      contactPerson: "Sneha Reddy",
      email: "sneha@naturesbasket.com",
      phone: "+91 65432 10987",
      status: "Pending",
      totalOrders: 5,
      totalSpent: "₹85,200",
      lastOrder: "2026-01-28",
      address: "321 Organic Road, Chennai - 600001",
      gst: "33PQRST3456R4N8",
    },
    {
      id: 5,
      companyName: "Eco Friendly Mart",
      contactPerson: "Vikram Singh",
      email: "vikram@ecofriendly.com",
      phone: "+91 54321 09876",
      status: "Inactive",
      totalOrders: 12,
      totalSpent: "₹2,34,600",
      lastOrder: "2026-01-15",
      address: "654 Zero Waste, Pune - 411001",
      gst: "27UVWXY6789S5P9",
    },
    {
      id: 6,
      companyName: "Green Hospitality",
      contactPerson: "Anjali Mehta",
      email: "anjali@greenhospitality.com",
      phone: "+91 43210 98765",
      status: "Active",
      totalOrders: 28,
      totalSpent: "₹7,89,300",
      lastOrder: "2026-02-12",
      address: "987 Sustainable St, Hyderabad - 500001",
      gst: "36ZABCD1234T6Q1",
    },
    {
      id: 7,
      companyName: "Organic Retail Chain",
      contactPerson: "Karthik Rajan",
      email: "karthik@organicretail.com",
      phone: "+91 32109 87654",
      status: "Pending",
      totalOrders: 3,
      totalSpent: "₹45,000",
      lastOrder: "2026-01-20",
      address: "147 Natural Way, Ahmedabad - 380001",
      gst: "24EFGHI5678U7R2",
    },
    {
      id: 8,
      companyName: "Eco Packaging Solutions",
      contactPerson: "Lakshmi Nair",
      email: "lakshmi@ecopackaging.com",
      phone: "+91 21098 76543",
      status: "Active",
      totalOrders: 52,
      totalSpent: "₹18,45,600",
      lastOrder: "2026-02-11",
      address: "258 Green Circle, Kochi - 682001",
      gst: "32JKLMN9012V8S3",
    },
  ]);

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
  const stats = {
    totalClients: clients.length,
    totalRevenue: clients.reduce((sum, c) => {
      const amount = parseFloat(c.totalSpent.replace(/[^0-9.-]+/g, ""));
      return sum + amount;
    }, 0),
  };

  // Filter clients
  const filteredClients = clients.filter((client) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm);

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

    // Validate form
    if (!formData.companyName || !formData.contactPerson || !formData.email) {
      setFeedbackMessage("Please fill all required fields");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const newClient = {
      id: clients.length + 1,
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone || "+91 00000 00000",
      status: formData.status,
      totalOrders: 0,
      totalSpent: "₹0",
      lastOrder: "N/A",
      address: formData.address || "Not provided",
      gst: formData.gst || "Not provided",
    };

    setClients([...clients, newClient]);
    setShowAddModal(false);
    setFeedbackMessage("Client added successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
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
    if (!selectedClient) return;

    const updatedClients = clients.map((c) =>
      c.id === selectedClient.id
        ? {
          ...c,
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          gst: formData.gst,
        }
        : c
    );

    setClients(updatedClients);
    setShowEditModal(false);
    setSelectedClient(null);
    setFeedbackMessage("Client updated successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Delete Client
  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const confirmDeleteClient = () => {
    if (!selectedClient) return;

    const filteredClients = clients.filter((c) => c.id !== selectedClient.id);
    setClients(filteredClients);
    setShowDeleteModal(false);
    setSelectedClient(null);
    setFeedbackMessage("Client deleted successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
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
      setFeedbackMessage(`Client list exported as ${format}`);

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

      setTimeout(() => setFeedbackMessage(""), 3000);
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
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="feedback-toast">
          <span className="material-symbols-outlined">
            {feedbackMessage.includes("deleted")
              ? "delete"
              : feedbackMessage.includes("updated")
                ? "edit"
                : feedbackMessage.includes("added")
                  ? "add"
                  : "check_circle"}
          </span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ===== PAGE HEADER ===== */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your client relationships</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleAddClient}>
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
            <span className="stat-value">{stats.totalClients}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <span className="material-symbols-outlined">currency_rupee</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Revenue</span>
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* ===== BREADCRUMBS & VIEW TOGGLE ===== */}
      <div className="subheader">
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={() => navigate("/")}>
            Home
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Clients</span>
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

        <div className="filter-actions">
          <button className="export-btn" onClick={handleExport}>
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
      {viewMode === "list" && (
        <div className="table-container">
          <div className="table-responsive">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Company Name</th>
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
                  paginatedClients.map((client) => (
                    <tr key={client.id} className="client-row">
                      <td>
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
                            className="action-btn view"
                            onClick={() => handleViewClient(client)}
                            title="View Details"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditClient(client)}
                            title="Edit Client"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteClient(client)}
                            title="Delete Client"
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
                          groups_off
                        </span>
                        <h4>No clients found</h4>
                        <p>Try adjusting your filters or add a new client</p>
                        <button className="btn-primary" onClick={handleAddClient}>
                          Add Client
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredClients.length > 0 && (
            <div className="pagination">
              <p className="pagination-info">
                Showing <span>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClients.length)}</span> of{" "}
                <span>{filteredClients.length}</span> clients
              </p>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
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
                  className="pagination-btn"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== GRID VIEW ===== */}
      {viewMode === "grid" && (
        <div className="clients-grid">
          {paginatedClients.length > 0 ? (
            paginatedClients.map((client) => (
              <div key={client.id} className="client-card">
                <div className="client-card-header">
                  <div className="client-card-avatar">
                    <span className="material-symbols-outlined">business</span>
                  </div>
                </div>
                <div className="client-card-content">
                  <h3 className="client-card-name">{client.companyName}</h3>
                  <p className="client-card-contact">{client.contactPerson}</p>

                  <div className="client-card-details">
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{client.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{client.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Orders:</span>
                      <span className="detail-value">{client.totalOrders}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Spent:</span>
                      <span className="detail-value">{client.totalSpent}</span>
                    </div>
                  </div>

                  <div className="client-card-footer">
                    <div className="client-card-actions">
                      <button
                        className="card-view-btn"
                        onClick={() => handleViewClient(client)}
                      >
                        View
                      </button>
                      <button
                        className="card-edit-btn"
                        onClick={() => handleEditClient(client)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-grid">
              <span className="material-symbols-outlined empty-icon">groups_off</span>
              <h4>No clients found</h4>
              <p>Try adjusting your filters or add a new client</p>
              <button className="btn-primary" onClick={handleAddClient}>
                Add Client
              </button>
            </div>
          )}
        </div>
      )}

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
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    className="modal-input"
                    required
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
                      placeholder="Enter contact person"
                      className="modal-input"
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="modal-select"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
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
                  <label>GST Number</label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    placeholder="Enter GST number"
                    className="modal-input"
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
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="modal-input"
                    required
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
                  <div className="modal-form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="modal-select"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
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
                  <label>GST Number</label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    className="modal-input"
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
                  <span
                    className={`status-badge ${selectedClient.status.toLowerCase()}`}
                  >
                    {selectedClient.status}
                  </span>
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
                  <span className="detail-label">GST Number</span>
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
                  <span className="detail-value">{selectedClient.lastOrder}</span>
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

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Client</h3>
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
                You are about to delete <strong>{selectedClient.companyName}</strong> from
                your client records. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="modal-confirm delete" onClick={confirmDeleteClient}>
                Delete Client
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