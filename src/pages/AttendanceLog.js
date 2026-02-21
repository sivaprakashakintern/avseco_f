import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AttendanceLog.css";

const AttendanceLog = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showStoppageModal, setShowStoppageModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [halfDayTime, setHalfDayTime] = useState({ from: "09:00", to: "13:00" });
  const [tempHalfDayTime, setTempHalfDayTime] = useState({ from: "09:00", to: "13:00" });

  // Stoppage State
  const [stoppageData, setStoppageData] = useState({
    reason: "Machine Breakdown",
    startTime: "10:00",
    endTime: "12:00",
    note: ""
  });
  const itemsPerPage = 10;

  // Sample employee data with state
  const [employees, setEmployees] = useState([
    {
      id: 1,
      initials: "AK",
      name: "Arjun Kumar",
      empId: "EMP-2023-001",
      department: "Leaf Processing",
      status: "present",
      note: "",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 2,
      initials: "SD",
      name: "Sita Devi",
      empId: "EMP-2023-042",
      department: "Packaging",
      status: "half",
      note: "Medical leave for afternoon",
      avatar: null,
      halfDayTime: { from: "09:00", to: "13:00" },
    },
    {
      id: 3,
      initials: "RS",
      name: "Rajesh Singh",
      empId: "EMP-2023-089",
      department: "Quality Control",
      status: "absent",
      note: "Uninformed absence",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 4,
      initials: "PS",
      name: "Priya Sharma",
      empId: "EMP-2023-102",
      department: "Leaf Processing",
      status: "present",
      note: "",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 5,
      initials: "VM",
      name: "Vikram Mehta",
      empId: "EMP-2023-056",
      department: "Warehouse",
      status: "present",
      note: "",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 6,
      initials: "LN",
      name: "Lakshmi Nair",
      empId: "EMP-2023-078",
      department: "HR",
      status: "absent",
      note: "Sick leave",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 7,
      initials: "KR",
      name: "Karthik Rajan",
      empId: "EMP-2023-091",
      department: "Quality Control",
      status: "present",
      note: "",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 8,
      initials: "MK",
      name: "Manoj Kumar",
      empId: "EMP-2023-112",
      department: "Warehouse",
      status: "half",
      note: "Personal work",
      avatar: null,
      halfDayTime: { from: "14:00", to: "18:00" },
    },
    {
      id: 9,
      initials: "DK",
      name: "Divya Krishnan",
      empId: "EMP-2023-124",
      department: "Packaging",
      status: "present",
      note: "",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 10,
      initials: "AP",
      name: "Amit Patel",
      empId: "EMP-2023-089",
      department: "Quality Control",
      status: "present",
      note: "",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 11,
      initials: "SR",
      name: "Sneha Reddy",
      empId: "EMP-2023-132",
      department: "Inventory",
      status: "absent",
      note: "Emergency leave",
      avatar: null,
      halfDayTime: null,
    },
    {
      id: 12,
      initials: "AM",
      name: "Anjali Mehta",
      empId: "EMP-2023-045",
      department: "HR",
      status: "present",
      note: "",
      avatar: null,
      halfDayTime: null,
    },
  ]);

  // Department options
  const departments = ["All Departments", "Leaf Processing", "Packaging", "Quality Control", "Warehouse", "HR", "Inventory"];

  // Stats - Using static values as requested
  const totalEmployees = 16;
  const [stats, setStats] = useState({
    present: 12, // 74% of 156
    absent: 4,   // 32% of 156
    half: 0,      // 21% of 156
  });

  // Update stats when employees change
  useEffect(() => {
    setStats({
      present: employees.filter(e => e.status === "present").length,
      absent: employees.filter(e => e.status === "absent").length,
      half: employees.filter(e => e.status === "half").length,
    });
  }, [employees]);

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    // Department filter
    const matchesDepartment = selectedDepartment === "All Departments" || emp.department === selectedDepartment;

    // Search filter
    const matchesSearch = searchTerm === "" ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());

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

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Handle date navigation
  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
    loadRandomData(newDate);
  };

  const handleNextDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);

    // Prevent going beyond today
    if (newDate <= today) {
      setCurrentDate(newDate);
      loadRandomData(newDate);
    }
  };

  // Simulate loading data for a specific date
  const loadRandomData = (date) => {
    // In a real app, this would fetch from API
    // Here we just shuffle status to simulate different days
    const statuses = ["present", "absent", "half", "present", "present"];
    const newEmployees = employees.map(emp => ({
      ...emp,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      note: Math.random() > 0.8 ? "Random note" : "",
      halfDayTime: null
    }));
    setEmployees(newEmployees);
  };

  // Handle status change
  const handleStatusChange = (empId, newStatus) => {
    const employee = employees.find(e => e.id === empId);

    // If changing to half day, show time selection modal
    if (newStatus === "half" && employee.status !== "half") {
      setSelectedEmployee(employee);
      // Set default time based on employee's existing halfDayTime or default
      setTempHalfDayTime(employee.halfDayTime || { from: "09:00", to: "13:00" });
      setShowTimeModal(true);
    } else {
      // For other status changes, update directly
      setEmployees(employees.map(emp =>
        emp.id === empId ? { ...emp, status: newStatus, halfDayTime: newStatus !== "half" ? null : emp.halfDayTime } : emp
      ));
      setFeedbackMessage(`Status updated for ${employee?.name}`);
      setTimeout(() => setFeedbackMessage(""), 2000);
    }
  };

  // Handle half-day time save
  const handleHalfDayTimeSave = () => {
    if (selectedEmployee) {
      setEmployees(employees.map(emp =>
        emp.id === selectedEmployee.id
          ? { ...emp, status: "half", halfDayTime: tempHalfDayTime }
          : emp
      ));
      setShowTimeModal(false);
      setFeedbackMessage(`Half-day marked for ${selectedEmployee.name} (${tempHalfDayTime.from} - ${tempHalfDayTime.to})`);
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
  };

  // Handle note change
  const handleNoteChange = (empId, newNote) => {
    setEmployees(employees.map(emp =>
      emp.id === empId ? { ...emp, note: newNote } : emp
    ));
  };

  // Open note modal
  const handleOpenNoteModal = (employee) => {
    setSelectedEmployee(employee);
    setNoteText(employee.note || "");
    setShowNoteModal(true);
  };

  // Open time edit modal for half-day employees
  const handleEditHalfDayTime = (employee) => {
    setSelectedEmployee(employee);
    setTempHalfDayTime(employee.halfDayTime || { from: "09:00", to: "13:00" });
    setShowTimeModal(true);
  };

  // Save note from modal
  const handleSaveNote = () => {
    if (selectedEmployee) {
      handleNoteChange(selectedEmployee.id, noteText);
      setShowNoteModal(false);
      setFeedbackMessage(`Note updated for ${selectedEmployee.name}`);
      setTimeout(() => setFeedbackMessage(""), 2000);
    }
  };

  // Handle Mark All Present
  const handleMarkAllPresent = () => {
    setEmployees(employees.map(emp => ({
      ...emp,
      status: "present",
      halfDayTime: null // Reset half-day time when marking present
    })));
    setFeedbackMessage("All employees marked as present");
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Handle Save Attendance
  const handleSaveAttendance = () => {
    setSaveLoading(true);

    // Simulate API call
    setTimeout(() => {
      setSaveLoading(false);
      setSaveSuccess(true);
      setFeedbackMessage("Attendance saved successfully");

      setTimeout(() => {
        setSaveSuccess(false);
        setFeedbackMessage("");
      }, 3000);
    }, 1500);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedDepartment("All Departments");
    setSearchTerm("");
  };

  // Handle Work Stoppage - Apply to filtered employees
  const handleApplyStoppage = () => {
    const reasonText = `[${stoppageData.reason}: ${stoppageData.startTime} - ${stoppageData.endTime}] ${stoppageData.note}`;

    // Update filtered employees (only those currently matching filters)
    const filteredIds = filteredEmployees.map(e => e.id);

    setEmployees(employees.map(emp => {
      if (filteredIds.includes(emp.id)) {
        // Mark status as Absent (As per company policy for stoppage - No Pay)
        // But append note
        const currentNote = emp.note ? emp.note + "; " : "";
        return {
          ...emp,
          status: "absent",
          note: currentNote + reasonText
        };
      }
      return emp;
    }));

    setShowStoppageModal(false);
    setFeedbackMessage(`Work stoppage logged for ${filteredEmployees.length} employees`);
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case "present": return "status-badge present";
      case "half": return "status-badge half";
      case "absent": return "status-badge absent";
      default: return "";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "present": return "Present";
      case "half": return "Half Day";
      case "absent": return "Absent";
      default: return status;
    }
  };

  // Get initials
  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  // Generate time options (every 30 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="attendance-container">

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="toast-popup">
          <span className="material-symbols-outlined">
            {feedbackMessage.includes("saved") ? "save" : "check_circle"}
          </span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Save Success Toast */}
      {saveSuccess && (
        <div className="toast-popup success">
          <span className="material-symbols-outlined">download_done</span>
          <span>Attendance saved successfully</span>
        </div>
      )}

      {/* ===== PREMIUM ANALYTICS HEADER ===== */}
      <div className="page-header premium-header">
        <div className="page-title-section">
          <h1 className="page-title">Daily Attendance Log</h1>
          <p className="page-subtitle">
            Recorded for: {formatDate(currentDate)}
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn-transfer-premium"
            onClick={() => navigate("/attendance-report")}
          >
            <span className="material-symbols-outlined">analytics</span>
            Full Report
          </button>

          <button
            className="btn-export-premium"
            onClick={handleSaveAttendance}
            disabled={saveLoading}
          >
            <span className="material-symbols-outlined">
              {saveLoading ? "hourglass_empty" : "check_circle"}
            </span>
            {saveLoading ? "Saving..." : "Save Log"}
          </button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="attendance-stats">
        <div className="stat-card total">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Employees</span>
            <span className="stat-number">{totalEmployees}</span>
          </div>
        </div>

        <div className="stat-card clickable present">
          <div className="stat-icon green">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Present</span>
            <div className="stat-value-group">
              <span className="stat-number">{stats.present}</span>
            </div>
          </div>
        </div>

        <div className="stat-card clickable absent">
          <div className="stat-icon red">
            <span className="material-symbols-outlined">cancel</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Absent</span>
            <div className="stat-value-group">
              <span className="stat-number">{stats.absent}</span>
            </div>
          </div>
        </div>

        <div className="stat-card clickable half">
          <div className="stat-icon orange">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Half Day</span>
            <div className="stat-value-group">
              <span className="stat-number">{stats.half}</span>
            </div>
          </div>
        </div>
      </div>



      {/* ===== SEARCH AND FILTERS ===== */}
      <div className="filters-section">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search employees by name, ID, or department..."
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
          <select
            className="filter-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Badge */}
      {
        (selectedDepartment !== "All Departments" || searchTerm) && (
          <div className="filter-badge-container">
            <span className="filter-badge">
              Filtered: {filteredEmployees.length} employees
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear All
              </button>
            </span>
          </div>
        )
      }

      {/* ===== ACTION BAR (DATE & SAVE) ===== */}
      <div className="attendance-action-bar">
        <div className="date-selector">
          <button className="date-nav-btn" onClick={handlePrevDay}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="date-display">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            {formatDate(currentDate)}
          </div>
          <button
            className="date-nav-btn"
            onClick={handleNextDay}
            disabled={new Date(currentDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)}
            style={{ opacity: new Date(currentDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) ? 0.5 : 1 }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <button
          className="btn-export-premium"
          onClick={handleSaveAttendance}
          disabled={saveLoading}
        >
          <span className="material-symbols-outlined">
            {saveLoading ? "hourglass_empty" : "check_circle"}
          </span>
          {saveLoading ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      <div className="table-container">

        {/* Table Controls */}
        <div className="table-controls">
          <div className="left-controls">
            <h3 className="section-title">Employee List</h3>
            <span className="count-badge">{filteredEmployees.length}</span>
          </div>
          <div className="action-buttons">
            <button className="btn-transfer-premium" onClick={() => setShowStoppageModal(true)} title="Log Force Majeure / Breakdown">
              <span className="material-symbols-outlined">warning</span>
              Log Stoppage
            </button>
            <button className="btn-export-premium" onClick={handleMarkAllPresent}>
              <span className="material-symbols-outlined">check_circle</span>
              Mark All Present
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="attendance-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Employee Details</th>
                <th style={{ width: '15%' }}>Department</th>
                <th style={{ width: '15%' }}>Applied Status</th>
                <th style={{ width: '25%' }}>Attendance Action</th>
                <th style={{ width: '20%' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => (
                  <tr key={employee.id} className="employee-row">
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {employee.avatar ? (
                            <div
                              className="avatar-image"
                              style={{ backgroundImage: `url(${employee.avatar})` }}
                            ></div>
                          ) : (
                            <div className="avatar-initials">
                              {employee.initials || getInitials(employee.name)}
                            </div>
                          )}
                        </div>
                        <div className="employee-info">
                          <span className="employee-name">{employee.name}</span>
                          <span className="employee-id">{employee.empId}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="department-cell">
                        <span className="department-badge">
                          {employee.department}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="status-with-time" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span className={getStatusClass(employee.status)}>
                          {employee.status === "half" ? "Half Day" : getStatusText(employee.status)}
                        </span>
                        {employee.status === "half" && employee.halfDayTime && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: '4px' }}>
                            <span className="time-chip" style={{ fontSize: '10px' }}>
                              {employee.halfDayTime.from} – {employee.halfDayTime.to}
                            </span>
                            <button
                              className="edit-time-btn"
                              onClick={() => handleEditHalfDayTime(employee)}
                              style={{ width: '20px', height: '20px', padding: 0 }}
                              title="Edit Time"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="status-cell">
                        <div className="status-toggle-container">
                          <div className={`status-pill ${employee.status}`}>
                            <button
                              onClick={() => handleStatusChange(employee.id, "present")}
                              className={`pill-btn ${employee.status === "present" ? "active" : ""}`}
                              title="Mark Present"
                            >
                              P
                            </button>
                            <button
                              onClick={() => handleStatusChange(employee.id, "half")}
                              className={`pill-btn ${employee.status === "half" ? "active" : ""}`}
                              title="Mark Half Day"
                            >
                              HD
                            </button>
                            <button
                              onClick={() => handleStatusChange(employee.id, "absent")}
                              className={`pill-btn ${employee.status === "absent" ? "active" : ""}`}
                              title="Mark Absent"
                            >
                              A
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="note-action-cell">
                        {employee.note ? (
                          <div className="note-display" onClick={() => handleOpenNoteModal(employee)}>
                            <span className="material-symbols-outlined note-icon">description</span>
                            <span className="note-text-truncate" title={employee.note}>{employee.note}</span>
                          </div>
                        ) : (
                          <button className="add-note-btn" onClick={() => handleOpenNoteModal(employee)}>
                            + Add Note
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="empty-state">
                      <span className="material-symbols-outlined empty-icon">
                        group_off
                      </span>
                      <h4>No employees found</h4>
                      <p>Try adjusting your filters</p>
                      <button className="btn-primary" onClick={clearFilters}>
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Action */}
        <div className="table-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <button
            className="btn-export-premium"
            onClick={handleSaveAttendance}
            disabled={saveLoading}
          >
            <span className="material-symbols-outlined">
              {saveLoading ? "hourglass_empty" : "check_circle"}
            </span>
            {saveLoading ? "Saving..." : "Save Changes"}
          </button>
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== FILTER MODAL ===== */}
      {
        showFilterModal && (
          <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Filter Employees</h3>
                <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="filter-section">
                  <h4>Department</h4>
                  <div className="filter-options">
                    {departments.map((dept) => (
                      <button
                        key={dept}
                        className={`filter-option-btn ${selectedDepartment === dept ? "active" : ""}`}
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setShowFilterModal(false);
                        }}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h4>Attendance Status</h4>
                  <div className="filter-options">
                    <button className="filter-option-btn">All</button>
                    <button className="filter-option-btn">Present</button>
                    <button className="filter-option-btn">Half Day</button>
                    <button className="filter-option-btn">Absent</button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel" onClick={() => setShowFilterModal(false)}>
                  Cancel
                </button>
                <button className="modal-confirm" onClick={() => setShowFilterModal(false)}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ===== NOTE MODAL ===== */}
      {
        showNoteModal && selectedEmployee && (
          <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Note</h3>
                <button className="modal-close" onClick={() => setShowNoteModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="employee-info-header">
                  <div className="employee-avatar large">
                    <div className="avatar-initials">
                      {selectedEmployee.initials || getInitials(selectedEmployee.name)}
                    </div>
                  </div>
                  <div>
                    <h4 className="employee-name-large">{selectedEmployee.name}</h4>
                    <p className="employee-id-large">{selectedEmployee.empId}</p>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Attendance Note</label>
                  <textarea
                    className="modal-textarea"
                    rows="4"
                    placeholder="Enter remarks or notes..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel" onClick={() => setShowNoteModal(false)}>
                  Cancel
                </button>
                <button className="modal-confirm" onClick={handleSaveNote}>
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ===== HALF-DAY TIME MODAL ===== */}
      {
        showTimeModal && selectedEmployee && (
          <div className="modal-overlay" onClick={() => setShowTimeModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Select Half-Day Time</h3>
                <button className="modal-close" onClick={() => setShowTimeModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="employee-info-header">
                  <div className="employee-avatar large">
                    <div className="avatar-initials">
                      {selectedEmployee.initials || getInitials(selectedEmployee.name)}
                    </div>
                  </div>
                  <div>
                    <h4 className="employee-name-large">{selectedEmployee.name}</h4>
                    <p className="employee-id-large">{selectedEmployee.empId}</p>
                  </div>
                </div>

                <div className="time-selection-container">
                  <div className="time-select-group">
                    <label>From</label>
                    <select
                      className="time-select"
                      value={tempHalfDayTime.from}
                      onChange={(e) => setTempHalfDayTime({ ...tempHalfDayTime, from: e.target.value })}
                    >
                      {timeOptions.map(time => (
                        <option key={`from-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div className="time-select-group">
                    <label>To</label>
                    <select
                      className="time-select"
                      value={tempHalfDayTime.to}
                      onChange={(e) => setTempHalfDayTime({ ...tempHalfDayTime, to: e.target.value })}
                    >
                      {timeOptions.map(time => (
                        <option key={`to-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div className="time-presets">
                    <button
                      className="time-preset-btn"
                      onClick={() => setTempHalfDayTime({ from: "09:00", to: "13:00" })}
                    >
                      Morning (9AM - 1PM)
                    </button>
                    <button
                      className="time-preset-btn"
                      onClick={() => setTempHalfDayTime({ from: "13:00", to: "17:00" })}
                    >
                      Afternoon (1PM - 5PM)
                    </button>
                    <button
                      className="time-preset-btn"
                      onClick={() => setTempHalfDayTime({ from: "09:00", to: "12:00" })}
                    >
                      9AM - 12PM
                    </button>
                    <button
                      className="time-preset-btn"
                      onClick={() => setTempHalfDayTime({ from: "14:00", to: "18:00" })}
                    >
                      2PM - 6PM
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel" onClick={() => setShowTimeModal(false)}>
                  Cancel
                </button>
                <button className="modal-confirm" onClick={handleHalfDayTimeSave}>
                  Confirm Half-Day
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ===== WORK STOPPAGE MODAL ===== */}
      {
        showStoppageModal && (
          <div className="modal-overlay" onClick={() => setShowStoppageModal(false)}>
            <div className="modal-content warning-theme" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Log Work Stoppage</h3>
                <button className="modal-close" onClick={() => setShowStoppageModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="info-box">
                  <span className="material-symbols-outlined">info</span>
                  <p>
                    <strong>HR Policy Note:</strong> Work stoppages due to company issues (breakdown, power cut)
                    will be marked as <strong>Absent</strong> (Company Issue - Unpaid). This action will apply to all
                    <strong> {filteredEmployees.length} </strong> filtered employees.
                  </p>
                </div>

                <div className="modal-form-group">
                  <label>Reason for Stoppage</label>
                  <select
                    className="modal-select"
                    value={stoppageData.reason}
                    onChange={(e) => setStoppageData({ ...stoppageData, reason: e.target.value })}
                  >
                    <option value="Machine Breakdown">Machine Breakdown</option>
                    <option value="Power Failure">Power Failure</option>
                    <option value="Raw Material Shortage">Raw Material Shortage</option>
                    <option value="Safety Incident">Safety Incident</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      className="modal-input"
                      value={stoppageData.startTime}
                      onChange={(e) => setStoppageData({ ...stoppageData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      className="modal-input"
                      value={stoppageData.endTime}
                      onChange={(e) => setStoppageData({ ...stoppageData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Additional Notes</label>
                  <textarea
                    className="modal-textarea"
                    rows="2"
                    placeholder="Details about the incident..."
                    value={stoppageData.note}
                    onChange={(e) => setStoppageData({ ...stoppageData, note: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel" onClick={() => setShowStoppageModal(false)}>
                  Cancel
                </button>
                <button className="modal-confirm warning" onClick={handleApplyStoppage}>
                  Apply Log
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default AttendanceLog;