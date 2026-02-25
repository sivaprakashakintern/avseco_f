import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/logo.png';
import { useAppContext } from '../context/AppContext.js';
import "./Employees.css";
import "../dashboard/Dashboard.css"; // Reuse dashboard header styles

const Employees = () => {
  const navigate = useNavigate();

  // ── Global shared state (synced with AttendanceLog, Dashboard, etc.) ────────
  const {
    employees,
    addEmployee: ctxAddEmployee,
    updateEmployee: ctxUpdateEmployee,
    deleteEmployee: ctxDeleteEmployee,
    departments,
    totalExpenseAmount,
    expenseByCategory,
    todayStats,
    employeesByDepartment,
  } = useAppContext();

  const [viewMode, setViewMode] = useState("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Custom Dropdown State
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    department: "Operator",
    email: "",
    phone: "",
    joinDate: new Date().toISOString().split("T")[0],
    dob: "",
    aadhar: "",
    pan: "",
    address: "",
    avatar: null
  });

  // Calculate stats - WITH Department Breakdown
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const deptCounts = {};
    employees.forEach(emp => {
      deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
    });

    const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];

    return { totalEmployees, departmentsCount: Object.keys(deptCounts).length, topDept };
  }, [employees]);


  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    // Department filter
    const matchesDepartment =
      selectedDepartment === "All Departments" || employee.department === selectedDepartment;

    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDepartment && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepartment, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDeptDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ========== HANDLERS ==========

  // Get initials
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Add Employee
  const handleAddEmployee = () => {
    setFormData({
      name: "",
      department: "Operator",
      email: "",
      phone: "",
      joinDate: new Date().toISOString().split("T")[0],
      dob: "",
      aadhar: "",
      pan: "",
      address: "",
      avatar: null
    });
    setShowAddModal(true);
  };

  const confirmAddEmployee = (e) => {
    e.preventDefault();

    // Validate form - Email is optional
    if (
      !formData.name ||
      !formData.department ||
      !formData.phone ||
      !formData.joinDate ||
      !formData.dob ||
      !formData.aadhar ||
      !formData.pan ||
      !formData.address
    ) {
      setFeedbackMessage("Please fill all required fields");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const newEmployee = {
      name: formData.name,
      department: formData.department,
      email: formData.email,
      phone: formData.phone,
      joinDate: formData.joinDate,
      avatar: formData.avatar ? URL.createObjectURL(formData.avatar) : "",
      dob: formData.dob,
      aadhar: formData.aadhar,
      pan: formData.pan,
      address: formData.address
    };

    ctxAddEmployee(newEmployee);
    setShowAddModal(false);
    setFeedbackMessage("Employee added successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Edit Employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      department: employee.department,
      email: employee.email,
      phone: employee.phone,
      joinDate: employee.joinDate,
      dob: employee.dob || "",
      aadhar: employee.aadhar || "",
      pan: employee.pan || "",
      address: employee.address || ""
    });
    setShowEditModal(true);
  };

  const confirmEditEmployee = (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    // Validate form - Email is optional
    if (
      !formData.name ||
      !formData.department ||
      !formData.phone ||
      !formData.joinDate ||
      !formData.dob ||
      !formData.aadhar ||
      !formData.pan ||
      !formData.address
    ) {
      setFeedbackMessage("Please fill all required fields");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    ctxUpdateEmployee(selectedEmployee.id, {
      name: formData.name,
      department: formData.department,
      email: formData.email,
      phone: formData.phone,
      joinDate: formData.joinDate,
      dob: formData.dob,
      aadhar: formData.aadhar,
      pan: formData.pan,
      address: formData.address
    });

    setShowEditModal(false);
    setSelectedEmployee(null);
    setFeedbackMessage("Employee updated successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Delete Employee
  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const confirmDeleteEmployee = () => {
    if (!selectedEmployee) return;

    ctxDeleteEmployee(selectedEmployee.id);
    setShowDeleteModal(false);
    setSelectedEmployee(null);
    setFeedbackMessage("Employee deleted successfully");

    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // View Employee
  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      setFormData({
        ...formData,
        avatar: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedDepartment("All Departments");
    setSearchTerm("");
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
    <div className="employees-container">
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

      {/* ===== PAGE HEADER (Expense Style) ===== */}
      <div className="page-header premium-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Employees Details</h1>
            <p className="page-subtitle">Add, edit or manage your team records and organizational structure</p>
          </div>
          <div className="header-actions">
            <button className="add-employee-btn" onClick={handleAddEmployee}>
              <span className="material-symbols-outlined">person_add</span>
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* ===== STATS CARDS (ENHANCED) ===== */}
      <div className="employee-stats">
        <div className="stat-card total-card">
          <div className="stat-content">
            <div className="stat-icon total">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Workforce</p>
              <h2 className="stat-number">{stats.totalEmployees}</h2>
              <p className="stat-subtext">Active Personnel</p>
            </div>
          </div>
          <div className="stat-visual">
            <div className="mini-chart">
              {[40, 70, 45, 90, 65, 80].map((h, i) => (
                <div key={i} className="bar" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>

        <div className="stat-card dept-card">
          <div className="stat-content">
            <div className="stat-icon department">
              <span className="material-symbols-outlined">corporate_fare</span>
            </div>
            <div className="stat-info">
              <p className="stat-label">Departments</p>
              <h2 className="stat-number">{stats.departmentsCount}</h2>
              <p className="stat-subtext">Largest: {stats.topDept[0]}</p>
            </div>
          </div>
          <div className="dept-distribution">
            {Object.entries(employees.reduce((acc, curr) => {
              acc[curr.department] = (acc[curr.department] || 0) + 1;
              return acc;
            }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => (
              <div key={name} className="dept-pill">
                <span className="dept-name">{name}</span>
                <span className="dept-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ===== BREADCRUMBS & VIEW TOGGLE ===== */}
      <div className="employees-subheader">
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={() => navigate("/")}>
            Dashboard
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Employees</span>
        </div>
      </div>

      {/* ===== SEARCH AND FILTERS (UPDATED) ===== */}
      <div className="filters-section">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search employees by name, email, or department..."
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
          {/* Custom Dropdown for Departments */}
          <div className="custom-dropdown" ref={dropdownRef}>
            <div
              className="dropdown-trigger"
              onClick={() => setShowDeptDropdown(!showDeptDropdown)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#006A4E' }}>
                  filter_list
                </span>
                {selectedDepartment}
              </span>
              <span className="material-symbols-outlined">
                {showDeptDropdown ? "expand_less" : "expand_more"}
              </span>
            </div>

            {showDeptDropdown && (
              <div className="dropdown-menu">
                {departments.map((dept) => (
                  <div
                    key={dept}
                    className={`dropdown-item ${selectedDepartment === dept ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDepartment(dept);
                      setShowDeptDropdown(false);
                    }}
                  >
                    <span>{dept}</span>
                    {selectedDepartment === dept && (
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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

      {/* Filter Badge & Quick Summary */}
      < div className="filter-summary-bar" >
        {(selectedDepartment !== "All Departments" || searchTerm) ? (
          <div className="filter-badge-row">
            <span className="filter-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_alt</span>
              Found {filteredEmployees.length} Matching Employees
              <button className="clear-filters-btn" onClick={clearFilters}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </span>
          </div>
        ) : (
          <div className="quick-info">
            <span className="info-item">Showing all active employees</span>
          </div>
        )}
      </div >

      {/* ===== LIST VIEW ===== */}
      {
        viewMode === "list" && (
          <div className="employee-table-container">
            <div className="table-responsive">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Contact</th>
                    <th>Join Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="employee-row clickable-row"
                        onClick={() => handleViewEmployee(employee)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <div className="employee-info">
                            <div className="employee-avatar">
                              {employee.avatar ? (
                                <div
                                  className="avatar-image"
                                  style={{ backgroundImage: `url("${employee.avatar}")` }}
                                ></div>
                              ) : (
                                <div className="avatar-initials">{getInitials(employee.name)}</div>
                              )}
                            </div>
                            <div>
                              <p className="employee-name">{employee.name}</p>
                              <p className="employee-email">{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="department-badge">{employee.department}</span>
                        </td>
                        <td>
                          <p className="employee-phone">{employee.phone}</p>
                        </td>
                        <td>
                          {new Date(employee.joinDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEmployee(employee);
                              }}
                              title="Edit Employee"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEmployee(employee);
                              }}
                              title="Delete Employee"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        <div className="empty-state">
                          <span className="material-symbols-outlined empty-icon">group_off</span>
                          <h4>No employees found</h4>
                          <p>Try adjusting your filters or add a new employee</p>
                          <button className="add-employee-btn" onClick={handleAddEmployee}>
                            Add Employee
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredEmployees.length > 0 && (
              <div className="pagination">
                <p className="pagination-info">
                  Showing <span>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEmployees.length)}</span> of{" "}
                  <span>{filteredEmployees.length}</span> employees
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
        )
      }

      {/* ===== GRID VIEW ===== */}
      {
        viewMode === "grid" && (
          <div className="employee-grid">
            {paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((employee) => (
                <div key={employee.id} className="employee-card" onClick={() => handleViewEmployee(employee)} style={{ cursor: 'pointer' }}>
                  <div className="employee-card-header">
                    <div className="employee-card-avatar">
                      {employee.avatar ? (
                        <div
                          className="avatar-image-large"
                          style={{ backgroundImage: `url("${employee.avatar}")` }}
                        ></div>
                      ) : (
                        <div className="avatar-initials-large">{getInitials(employee.name)}</div>
                      )}
                    </div>
                  </div>
                  <div className="employee-card-content">
                    <div className="employee-card-main">
                      <h3 className="employee-card-name">{employee.name}</h3>
                      <div className="employee-card-dept-tag">
                        <span className="dept-dot"></span>
                        {employee.department}
                      </div>
                    </div>

                    <div className="employee-card-contact">
                      <div className="contact-item">
                        <span className="material-symbols-outlined">mail</span>
                        <span>{employee.email}</span>
                      </div>
                      <div className="contact-item">
                        <span className="material-symbols-outlined">call</span>
                        <span>{employee.phone}</span>
                      </div>
                      <div className="contact-item">
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span>
                          Joined{" "}
                          {new Date(employee.joinDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="employee-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="card-view-btn"
                        onClick={(e) => { e.stopPropagation(); handleViewEmployee(employee) }}
                      >
                        View
                      </button>
                      <button
                        className="card-edit-btn"
                        onClick={(e) => { e.stopPropagation(); handleEditEmployee(employee) }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-grid">
                <span className="material-symbols-outlined empty-icon">group_off</span>
                <h4>No employees found</h4>
                <p>Try adjusting your filters or add a new employee</p>
                <button className="add-employee-btn" onClick={handleAddEmployee}>
                  Add Employee
                </button>
              </div>
            )}
          </div>
        )
      }

      {/* ===== ADD EMPLOYEE MODAL ===== */}
      {
        showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Employee</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={confirmAddEmployee}>
                <div className="modal-body">
                  <div className="modal-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className="modal-input"
                      required
                    />
                  </div>

                  {/* Avatar Upload (Optional) */}
                  <div className="modal-form-group">
                    <label>Profile Image (Optional)</label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="modal-file-input"
                        id="avatar-upload"
                      />
                      <label htmlFor="avatar-upload" className="file-upload-label">
                        <span className="material-symbols-outlined">cloud_upload</span>
                        <span>{formData.avatar ? formData.avatar.name : "Choose an image file"}</span>
                      </label>
                    </div>
                  </div>
                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Department *</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="modal-select"
                        required
                      >
                        {departments
                          .filter((d) => d !== "All Departments")
                          .map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        className="modal-input"
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        className="modal-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Date of Birth *</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="modal-input"
                        required
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>PAN Number *</label>
                      <input
                        type="text"
                        name="pan"
                        value={formData.pan}
                        onChange={handleInputChange}
                        placeholder="Enter PAN Number"
                        className="modal-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Aadhar Number *</label>
                      <input
                        type="text"
                        name="aadhar"
                        value={formData.aadhar}
                        onChange={handleInputChange}
                        placeholder="Enter Aadhar Number"
                        className="modal-input"
                        required
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Join Date *</label>
                      <input
                        type="date"
                        name="joinDate"
                        value={formData.joinDate}
                        onChange={handleInputChange}
                        className="modal-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <label>Full Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter full residential address"
                      className="modal-input"
                      rows="3"
                      style={{ resize: "vertical" }}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="modal-cancel" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-confirm">
                    Add Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* ===== EDIT EMPLOYEE MODAL ===== */}
      {
        showEditModal && selectedEmployee && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Employee</h3>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={confirmEditEmployee}>
                <div className="modal-body">
                  <div className="modal-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="modal-input"
                      required
                    />
                  </div>
                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Department *</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="modal-select"
                        required
                      >
                        {departments
                          .filter((d) => d !== "All Departments")
                          .map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="modal-input"
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="modal-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Date of Birth *</label>
                      <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="modal-input" required />
                    </div>
                    <div className="modal-form-group">
                      <label>PAN Number *</label>
                      <input type="text" name="pan" value={formData.pan} onChange={handleInputChange} className="modal-input" required />
                    </div>
                  </div>
                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Aadhar Number *</label>
                      <input type="text" name="aadhar" value={formData.aadhar} onChange={handleInputChange} className="modal-input" required />
                    </div>
                    <div className="modal-form-group">
                      <label>Join Date *</label>
                      <input type="date" name="joinDate" value={formData.joinDate} onChange={handleInputChange} className="modal-input" required />
                    </div>
                  </div>
                  <div className="modal-form-group">
                    <label>Address *</label>
                    <textarea name="address" value={formData.address} onChange={handleInputChange} className="modal-input" rows="3" required></textarea>
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
        )
      }

      {/* ===== VIEW EMPLOYEE MODAL ===== */}
      {
        showViewModal && selectedEmployee && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Employee Details</h3>
                <button className="modal-close" onClick={() => setShowViewModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="employee-profile-header">
                  <div className="profile-background"></div>
                  <div className="profile-main-info">
                    <div className="employee-profile-avatar">
                      {selectedEmployee.avatar ? (
                        <div className="profile-avatar-image" style={{ backgroundImage: `url("${selectedEmployee.avatar}")` }}></div>
                      ) : (
                        <div className="profile-avatar-initials">{getInitials(selectedEmployee.name)}</div>
                      )}
                    </div>
                    <div className="employee-profile-text">
                      <h2>{selectedEmployee.name}</h2>
                      <span className="profile-dept-badge">{selectedEmployee.department}</span>
                    </div>
                  </div>
                </div>

                <div className="employee-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Department</span>
                    <span className="detail-value">{selectedEmployee.department}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value">{selectedEmployee.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-value">{selectedEmployee.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Join Date</span>
                    <span className="detail-value">
                      {new Date(selectedEmployee.joinDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Employee ID</span>
                    <span className="detail-value">EMP-00{selectedEmployee.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date of Birth</span>
                    <span className="detail-value">{selectedEmployee.dob || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Aadhar Number</span>
                    <span className="detail-value">{selectedEmployee.aadhar || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">PAN Number</span>
                    <span className="detail-value">{selectedEmployee.pan || "N/A"}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: "span 2" }}>
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{selectedEmployee.address || "N/A"}</span>
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
                    handleEditEmployee(selectedEmployee);
                  }}
                >
                  Edit Employee
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {
        showDeleteModal && selectedEmployee && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete Employee</h3>
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
                  You are about to delete <strong>{selectedEmployee.name}</strong> from your
                  employee records. This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="modal-confirm delete" onClick={confirmDeleteEmployee}>
                  Delete Employee
                </button>
              </div>
            </div>
          </div>
        )
      }


    </div >
  );
};

export default Employees;