import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAppContext } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import "./Employees.css";
import "../../dashboard/Dashboard.css"; // Reuse dashboard header styles

import { formatDate } from '../../utils/dateUtils.js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const Employees = () => {

  // ── Global shared state (synced with AttendanceLog, Dashboard, etc.) ────────
  const {
    employees,
    addEmployee: ctxAddEmployee,
    updateEmployee: ctxUpdateEmployee,
    deleteEmployee: ctxDeleteEmployee,
    departments
  } = useAppContext();

  const { isAdmin } = useAuth();

  const [viewMode, setViewMode] = useState(window.innerWidth <= 768 ? "list" : "grid");
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
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setViewMode("list");
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    avatar: null,
    salary: ""
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

  const startIndex = 0;
  // Use all filtered employees for a single page view
  const employeesToDisplay = filteredEmployees;

  // Reset scroll or view when filters change if needed
  useEffect(() => {
    // Scroll to top or handle view reset
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
    const today = dayjs();
    setFormData({
      name: "",
      department: "Operator",
      email: "",
      phone: "+91 ",
      joinDate: today,
      dob: null, // Initialized as null for cleaner typing experience
      aadhar: "",
      pan: "",
      address: "",
      avatar: null,
      salary: ""
    });
    setShowAddModal(true);
    if (window.innerWidth <= 1024) {
      document.body.classList.add("hide-topbar-mobile");
    }
  };

  // Function to convert dd/mm/yyyy UI string to yyyy-mm-dd for backend
    const toBackendDate = (ddmmyyyy) => {
        if (!ddmmyyyy || !ddmmyyyy.includes("/")) return ddmmyyyy;
        const [d, m, y] = ddmmyyyy.split("/");
        if (!d || !m || !y || y.length !== 4) return ddmmyyyy;
        return `${y}-${m}-${d}`;
    };

  const confirmAddEmployee = async (e) => {
    e.preventDefault();

    // Validate form - basic fields first
    if (!formData.name || !formData.department || !formData.phone || !formData.joinDate) {
      setFeedbackMessage("Please fill all required fields (Name, Dept, Phone, Join Date)");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // Email validation (optional but if provided must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFeedbackMessage("❌ Please enter a valid email address");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // PAN validation
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
      setFeedbackMessage("❌ Please enter a valid PAN Number (e.g. ABCDE1234F)");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    if (!formData.joinDate || !dayjs(formData.joinDate).isValid()) {
        setFeedbackMessage("❌ Please enter a valid Join Date");
        setTimeout(() => setFeedbackMessage(""), 3000);
        return;
    }
    if (formData.dob && !dayjs(formData.dob).isValid()) {
        setFeedbackMessage("❌ Please enter a valid Date of Birth");
        setTimeout(() => setFeedbackMessage(""), 3000);
        return;
    }

    // Aadhar validation
    const rawAadhar = formData.aadhar.replace(/\s/g, "");
    if (rawAadhar.length !== 12) {
      setFeedbackMessage("❌ Aadhar Number must be exactly 12 digits");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // Uniqueness check (UI side before server call)
    const normPhone = formData.phone.replace(/\s+/g, "");
    const normAadhar = formData.aadhar.replace(/\s+/g, "");

    const isDuplicate = employees.some(emp => {
      const dbPhone = (emp.phone || "").replace(/\s+/g, "");
      const dbAadhar = (emp.aadhar || "").replace(/\s+/g, "");
      return dbPhone === normPhone || dbAadhar === normAadhar;
    });

    if (isDuplicate) {
      setFeedbackMessage("❌ This employee (Mobile or Aadhar) already exists");
      setTimeout(() => setFeedbackMessage(""), 4000);
      return;
    }

    try {
      setFeedbackMessage("Adding employee...");
      const newEmployee = {
        name: formData.name,
        department: formData.department,
        email: formData.email,
        phone: formData.phone,
        joinDate: formData.joinDate && dayjs(formData.joinDate).isValid() ? formData.joinDate.format("YYYY-MM-DD") : null,
        dob: formData.dob && dayjs(formData.dob).isValid() ? formData.dob.format("YYYY-MM-DD") : null,
        aadhar: formData.aadhar,
        pan: formData.pan.toUpperCase(),
        address: formData.address,
        salary: Number(formData.salary) || 0,
        avatar: formData.avatar,
        empId: 'EMP-' + Math.floor(100000 + Math.random() * 900000)
      };

      await ctxAddEmployee(newEmployee);
      
      setShowAddModal(false);
      setFeedbackMessage("Employee added successfully! ✅");
      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (error) {
      console.error("Add employee error:", error);
      setFeedbackMessage("❌ Failed to add employee: " + (error.response?.data?.message || error.message));
      setTimeout(() => setFeedbackMessage(""), 5000);
    }
  };

  // Edit Employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      department: employee.department,
      email: employee.email || "",
      phone: employee.phone || "",
      joinDate: employee.joinDate ? dayjs(employee.joinDate) : null,
      dob: employee.dob ? dayjs(employee.dob) : null,
      aadhar: employee.aadhar || "",
      pan: employee.pan || "",
      address: employee.address || "",
      salary: employee.salary || "",
      avatar: employee.avatar || null
    });
    setShowEditModal(true);
  };

  const confirmEditEmployee = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    if (!formData.name || !formData.department || !formData.phone) {
      setFeedbackMessage("Please fill all required fields");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // Validate form - basic fields first
    if (!formData.name || !formData.department || !formData.phone || !formData.joinDate) {
      setFeedbackMessage("Please fill all required fields (Name, Dept, Phone, Join Date)");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFeedbackMessage("❌ Please enter a valid email address");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // PAN validation
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
      setFeedbackMessage("❌ Please enter a valid PAN Number (e.g. ABCDE1234F)");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    // Date validation
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(formData.joinDate)) {
        setFeedbackMessage("❌ Join Date must be in DD/MM/YYYY format");
        setTimeout(() => setFeedbackMessage(""), 3000);
        return;
    }
    if (!dateRegex.test(formData.dob)) {
        setFeedbackMessage("❌ Date of Birth must be in DD/MM/YYYY format");
        setTimeout(() => setFeedbackMessage(""), 3000);
        return;
    }

    // Uniqueness check (excluding current employee)
    const normPhone = formData.phone.replace(/\s+/g, "");
    const normAadhar = formData.aadhar.replace(/\s+/g, "");

    const isDuplicate = employees.some(emp => {
      if (emp.id === selectedEmployee.id) return false;
      const dbPhone = (emp.phone || "").replace(/\s+/g, "");
      const dbAadhar = (emp.aadhar || "").replace(/\s+/g, "");
      return dbPhone === normPhone || dbAadhar === normAadhar;
    });

    if (isDuplicate) {
        setFeedbackMessage("❌ Another employee already has this Mobile or Aadhar number");
        setTimeout(() => setFeedbackMessage(""), 4000);
        return;
    }

    try {
      setFeedbackMessage("Updating employee...");
      await ctxUpdateEmployee(selectedEmployee.id, {
        name: formData.name,
        department: formData.department,
        email: formData.email,
        phone: formData.phone,
        joinDate: formData.joinDate && dayjs(formData.joinDate).isValid() ? formData.joinDate.format("YYYY-MM-DD") : null,
        dob: formData.dob && dayjs(formData.dob).isValid() ? formData.dob.format("YYYY-MM-DD") : null,
        aadhar: formData.aadhar,
        pan: formData.pan.toUpperCase(),
        address: formData.address,
        salary: Number(formData.salary) || 0,
        avatar: formData.avatar
      });

      setShowEditModal(false);
      setSelectedEmployee(null);
      setFeedbackMessage("Employee updated successfully! ✅");
      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (error) {
      setFeedbackMessage("❌ Update failed: " + (error.response?.data?.message || error.message));
      setTimeout(() => setFeedbackMessage(""), 5000);
    }
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

  const handleDateChange = (name, newValue) => {
    setFormData({ ...formData, [name]: newValue });
  };

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      setFormData({
        ...formData,
        avatar: files[0],
      });
    } else if (name === "aadhar") {
      // Format Aadhar: 1234 5678 9012
      let val = value.replace(/\D/g, "").substring(0, 12);
      let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
      setFormData({
        ...formData,
        aadhar: formatted,
      });
    } else if (name === "phone") {
        // Force +91 prefix and limit digits to 10
        let digits = value.replace(/^\+91\s?/, "").replace(/\D/g, "").substring(0, 10);
        setFormData({ ...formData, phone: "+91 " + digits });
    } else if (name === "pan") {
        // PAN is 10 characters (ABCDE1234F)
        let val = value.toUpperCase().substring(0, 10);
        setFormData({ ...formData, pan: val });
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

  return (
    <div className={`employees-container ${showAddModal || showEditModal || showDeleteModal || showViewModal ? 'modal-open' : ''}`}>
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
            <h1 className="page-title">Employees</h1>
          </div>
          <div className="header-actions">
            {isAdmin && (
              <button className="add-employee-btn" onClick={handleAddEmployee}>
                <span className="material-symbols-outlined">person_add</span>
                Add Employee
              </button>
            )}
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
        ) : null}
      </div >

      {/* ===== LIST VIEW ===== */}
      {viewMode === "list" && (
        <div className="employee-table-container">
          {/* ── Desktop Table ── */}
          <div className="table-responsive desktop-table-view">
            <table className="employee-table">
              <thead>
                <tr>
                  <th className="sticky-col-no" style={{ textAlign: 'center' }}>S.No</th>
                  <th className="sticky-col" style={{ textAlign: 'center' }}>Employee</th>
                  <th className="col-dept" style={{ textAlign: 'center' }}>Department</th>
                  <th className="col-contact" style={{ textAlign: 'center' }}>Contact</th>
                  <th className="col-date" style={{ textAlign: 'center' }}>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {employeesToDisplay.length > 0 ? (
                  employeesToDisplay.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className="employee-row clickable-row"
                      onClick={() => handleViewEmployee(employee)}
                      style={{ cursor: "pointer", textAlign: 'center' }}
                      title="Click to view full employee details"
                    >
                      <td className="sticky-col-no" style={{ textAlign: 'center' }}>{startIndex + index + 1}</td>
                      <td className="sticky-col" style={{ textAlign: 'center' }}>
                        <div className="employee-info" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <div className="employee-avatar">
                            {employee.avatar ? (
                              <div className="avatar-image" style={{ backgroundImage: `url("${employee.avatar}")` }}></div>
                            ) : (
                              <div className="avatar-initials">{getInitials(employee.name)}</div>
                            )}
                          </div>
                          <div className="employee-details-text" style={{ textAlign: 'left' }}>
                            <div className="name-email-row">
                              <p className="employee-name" title={employee.name}>{employee.name}</p>
                              <span className="email-separator">|</span>
                              <p className="employee-email" title={employee.email}>{employee.email}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="col-dept" style={{ textAlign: 'center' }}>
                        <span className="department-badge pill-badge" title={employee.department} style={{ minWidth: '120px', display: 'inline-block', borderRadius: '20px' }}>
                          {employee.department}
                        </span>
                      </td>
                      <td className="col-contact" style={{ textAlign: 'center' }}>
                        <p className="employee-phone">{employee.phone}</p>
                      </td>
                      <td className="col-date" style={{ textAlign: 'center' }}>{formatDate(employee.joinDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      <div className="empty-state">
                        <span className="material-symbols-outlined empty-icon">group_off</span>
                        <h4>No employees found</h4>
                        <p>Try adjusting your filters or add a new employee</p>
                        {isAdmin && <button className="add-employee-btn" onClick={handleAddEmployee}>Add Employee</button>}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Card List ── */}
          <div className="mobile-employee-cards">
            {employeesToDisplay.length > 0 ? (
              employeesToDisplay.map((employee, index) => (
                <div
                  key={employee.id}
                  className="mobile-emp-card"
                  onClick={() => handleViewEmployee(employee)}
                >
                  {/* Serial number */}
                  <span className="mobile-emp-sno">#{index + 1}</span>

                  {/* Avatar */}
                  <div className="mobile-emp-avatar">
                    {employee.avatar ? (
                      <div className="avatar-image" style={{ backgroundImage: `url("${employee.avatar}")`, width: '100%', height: '100%', borderRadius: '50%', backgroundSize: 'cover' }}></div>
                    ) : (
                      <div className="mobile-emp-initials">{getInitials(employee.name)}</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mobile-emp-info">
                    <p className="mobile-emp-name">{employee.name}</p>
                    <span className="mobile-emp-dept">{employee.department}</span>
                  </div>

                  {/* Phone */}
                  <span className="mobile-emp-phone">{employee.phone}</span>

                  {/* Delete */}
                </div>
              ))
            ) : (
              <div className="mobile-emp-empty">
                <span className="material-symbols-outlined">group_off</span>
                <p>No employees found</p>
                {isAdmin && <button className="add-employee-btn" onClick={handleAddEmployee}>Add Employee</button>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== GRID VIEW ===== */}
      {viewMode === "grid" && (
        <div className="employee-grid">
          {employeesToDisplay.length > 0 ? (
            employeesToDisplay.map((employee) => (
              <div key={employee.id} className="employee-card" onClick={() => handleViewEmployee(employee)} style={{ cursor: 'pointer' }}>
                <div className="employee-card-header">
                  <div className="employee-card-profile-section">
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
                    <div className="employee-card-main">
                      <h3 className="employee-card-name">{employee.name}</h3>
                      <div className="employee-card-dept-tag">
                        <span className="dept-dot"></span>
                        {employee.department}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="employee-card-content">

                  <div className="employee-card-contact">
                    <div className="contact-item">
                      <span className="material-symbols-outlined">mail</span>
                      <span>{employee.email}</span>
                    </div>
                    <div className="contact-item">
                      <span className="material-symbols-outlined">call</span>
                      <span>{employee.phone}</span>
                    </div>
                  </div>

                  <div className="employee-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="card-view-btn"
                      onClick={(e) => { e.stopPropagation(); handleViewEmployee(employee) }}
                    >
                      View
                    </button>
                    {isAdmin && (
                      <button
                        className="card-edit-btn"
                        onClick={(e) => { e.stopPropagation(); handleEditEmployee(employee) }}
                        style={{ marginLeft: '12px', padding: '6px 14px', borderRadius: '10px', background: '#006A4E', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-grid">
              <span className="material-symbols-outlined empty-icon">group_off</span>
              <h4>No employees found</h4>
              <p>Try adjusting your filters or add a new employee</p>
              {isAdmin && (
                <button className="add-employee-btn" onClick={handleAddEmployee}>
                  Add Employee
                </button>
              )}
            </div>
          )}
        </div>
      )}

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

                  <div className="modal-row">
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
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={formData.dob}
                          onChange={(newValue) => handleDateChange("dob", newValue)}
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              className: 'modal-mui-input'
                            }
                          }}
                        />
                      </LocalizationProvider>
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
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={formData.joinDate}
                          onChange={(newValue) => handleDateChange("joinDate", newValue)}
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              className: 'modal-mui-input'
                            }
                          }}
                        />
                      </LocalizationProvider>
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
                      rows="4"
                      style={{ resize: "vertical", minHeight: '100px' }}
                      required
                    ></textarea>
                  </div>

                  <div className="modal-form-group">
                    <label>Default Salary (Monthly) *</label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="Enter monthly salary"
                      className="modal-input"
                      required
                    />
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
                      placeholder="Enter full name"
                      className="modal-input"
                      required
                    />
                  </div>

                  <div className="modal-row">
                    <div className="modal-form-group">
                      <label>Profile Image (Optional)</label>
                      <div className="file-upload-wrapper">
                        <input
                          type="file"
                          id="edit-employee-avatar"
                          accept="image/*"
                          onChange={handleInputChange}
                          className="modal-file-input"
                          name="avatar"
                        />
                        <label htmlFor="edit-employee-avatar" className="file-upload-label">
                          <span className="material-symbols-outlined">cloud_upload</span>
                          {formData.avatar ? "Change image file" : "Choose an image file"}
                        </label>
                      </div>
                    </div>

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
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={formData.dob ? dayjs(toBackendDate(formData.dob)) : null}
                          onChange={(newValue) => handleDateChange("dob", newValue)}
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              className: 'modal-mui-input'
                            }
                          }}
                        />
                      </LocalizationProvider>
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
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={formData.joinDate ? dayjs(toBackendDate(formData.joinDate)) : null}
                          onChange={(newValue) => handleDateChange("joinDate", newValue)}
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              className: 'modal-mui-input'
                            }
                          }}
                        />
                      </LocalizationProvider>
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
                      rows="4"
                      style={{ resize: "vertical", minHeight: '100px' }}
                      required
                    ></textarea>
                  </div>

                  <div className="modal-form-group">
                    <label>Default Salary (Monthly) *</label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="Enter monthly salary"
                      className="modal-input"
                      required
                    />
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

                <div className="profile-details-section">
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
                        {formatDate(selectedEmployee.joinDate)}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Date of Birth</span>
                      <span className="detail-value">{formatDate(selectedEmployee.dob)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Aadhar Number</span>
                      <span className="detail-value">{selectedEmployee.aadhar || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">PAN Number</span>
                      <span className="detail-value">{selectedEmployee.pan || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Default Salary</span>
                      <span className="detail-value">₹{Number(selectedEmployee.salary || 0).toLocaleString()}</span>
                    </div>
                    <div className="detail-item" style={{ gridColumn: "span 2" }}>
                      <span className="detail-label">Address</span>
                      <span className="detail-value">{selectedEmployee.address || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {isAdmin && (
                  <button
                    className="modal-delete"
                    onClick={() => {
                      setShowViewModal(false);
                      handleDeleteEmployee(selectedEmployee);
                    }}
                  >
                    <span className="material-symbols-outlined">delete</span>
                    Delete Employee
                  </button>
                )}
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                  <button
                    className="modal-cancel"
                    onClick={() => setShowViewModal(false)}
                  >
                    Close
                  </button>
                  {isAdmin && (
                    <button
                      className="modal-confirm"
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditEmployee(selectedEmployee);
                      }}
                    >
                      Edit Employee
                    </button>
                  )}
                </div>
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