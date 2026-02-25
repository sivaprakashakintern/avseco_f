import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from '../context/AppContext.js';
import "./AttendanceLog.css";

const AttendanceLog = () => {
  const navigate = useNavigate();

  // ── Global employees (shared source of truth) ───────────────────────────
  const { employees: globalEmployees, departments: globalDepts, todayStats } = useAppContext();

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

  // ── Local attendance overrides (status/note per employee for the selected date) ─
  // Keyed by employee id; merges on top of the global list
  const [attendanceMap, setAttendanceMap] = useState({});

  // Build the displayed employees list from global employees + local attendance overrides
  const employees = useMemo(() => {
    return globalEmployees.map(emp => ({
      id: emp.id,
      name: emp.name,
      empId: `EMP-${String(emp.id).padStart(4, '0')}`,
      department: emp.department,
      initials: emp.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      avatar: emp.avatar || null,
      status: attendanceMap[emp.id]?.status ?? 'present',
      note: attendanceMap[emp.id]?.note ?? '',
      halfDayTime: attendanceMap[emp.id]?.halfDayTime ?? null,
    }));
  }, [globalEmployees, attendanceMap]);

  // Helper to patch attendance for one employee
  const patchAttendance = (empId, patch) => {
    setAttendanceMap(prev => ({
      ...prev,
      [empId]: { ...(prev[empId] || {}), ...patch }
    }));
  };

  // Department options derived from context
  const departments = ["All Departments", ...globalDepts.filter(d => d !== "All Departments")];

  // Stats
  const totalEmployees = employees.length;
  const [stats, setStats] = useState({ present: 0, absent: 0, half: 0 });

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
    const newMap = {};
    employees.forEach(emp => {
      newMap[emp.id] = {
        status: statuses[Math.floor(Math.random() * statuses.length)],
        note: Math.random() > 0.8 ? "Random note" : "",
        halfDayTime: null
      };
    });
    setAttendanceMap(newMap);
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
      patchAttendance(empId, { status: newStatus, halfDayTime: newStatus !== "half" ? null : undefined });
      setFeedbackMessage(`Status updated for ${employee?.name}`);
      setTimeout(() => setFeedbackMessage(""), 2000);
    }
  };

  // Handle half-day time save
  const handleHalfDayTimeSave = () => {
    if (selectedEmployee) {
      patchAttendance(selectedEmployee.id, { status: "half", halfDayTime: tempHalfDayTime });
      setShowTimeModal(false);
      setFeedbackMessage(`Half-day marked for ${selectedEmployee.name} (${tempHalfDayTime.from} - ${tempHalfDayTime.to})`);
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
  };

  // Handle note change
  const handleNoteChange = (empId, newNote) => {
    patchAttendance(empId, { note: newNote });
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
    const newMap = {};
    employees.forEach(emp => {
      newMap[emp.id] = { status: "present", halfDayTime: null, note: emp.note || "" };
    });
    setAttendanceMap(newMap);
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
    const filteredIds = filteredEmployees.map(e => e.id);

    filteredIds.forEach(empId => {
      const currentNote = attendanceMap[empId]?.note ? attendanceMap[empId].note + "; " : "";
      patchAttendance(empId, { status: "absent", note: currentNote + reasonText });
    });

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
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Daily Attendance</h1>
            <p className="page-subtitle">Track and manage workforce participation for {formatDate(currentDate)}</p>
          </div>
          <div className="header-actions">
            <button
              className="save-attendance-btn"
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
      </div>

      {/* ===== ACTION BAR (DATE SELECTOR) ===== */}
      <div className="attendance-date-bar">
        <div className="date-controls-wrapper">
          <button className="date-step-btn" onClick={handlePrevDay}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="current-date-box">
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="date-text">{formatDate(currentDate)}</span>
          </div>
          <button
            className="date-step-btn"
            onClick={handleNextDay}
            disabled={new Date(currentDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className="quick-stats-pills">
          <div className="stat-pill-item present">
            <span className="dot"></span>
            Present: <strong>{stats.present}</strong>
          </div>
          <div className="stat-pill-item absent">
            <span className="dot"></span>
            Absent: <strong>{stats.absent}</strong>
          </div>
          <div className="stat-pill-item half">
            <span className="dot"></span>
            Half Day: <strong>{stats.half}</strong>
          </div>
        </div>
      </div>

      {/* ===== STATS CARDS (Refined) ===== */}
      <div className="attendance-stats">
        <div className="stat-card total-card">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Workforce</p>
            <h2 className="stat-number">{totalEmployees}</h2>
            <p className="stat-subtext">Registered Staff</p>
          </div>
        </div>

        <div className="stat-card attendance-rate-card">
          <div className="stat-icon green">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Attendance Rate</p>
            <h2 className="stat-number">
              {totalEmployees > 0 ? Math.round(((stats.present + stats.half * 0.5) / totalEmployees) * 100) : 0}%
            </h2>
            <p className="stat-subtext">Productivity index</p>
          </div>
        </div>
      </div>



      {/* ===== SEARCH AND FILTERS (Refined) ===== */}
      <div className="attendance-filters">
        <div className="search-wrapper">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Find employee by name, ID or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            className="dept-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "All Departments" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          <div className="bulk-actions">
            <button className="bulk-btn present" onClick={handleMarkAllPresent}>
              <span className="material-symbols-outlined">done_all</span>
              All Present
            </button>
            <button className="bulk-btn stoppage" onClick={() => setShowStoppageModal(true)}>
              <span className="material-symbols-outlined">warning</span>
              Stoppage
            </button>
          </div>
        </div>
      </div>

      <div className="attendance-table-container">
        <div className="table-header-row">
          <div className="title-area">
            <h3>Workforce Records</h3>
            <span className="count-tag">{filteredEmployees.length} Found</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="custom-attendance-table">
            <thead>
              <tr>
                <th className="th-employee">Employee Details</th>
                <th className="th-dept">Department</th>
                <th className="th-status">Current Status</th>
                <th className="th-action text-center">Mark Attendance</th>
                <th className="th-notes">Remarks</th>
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

                    <td className="td-status">
                      <div className="status-display">
                        <span className={`status-badge-premium ${employee.status}`}>
                          <span className="dot"></span>
                          {employee.status === "half" ? "Half Day" : getStatusText(employee.status)}
                        </span>
                        {employee.status === "half" && employee.halfDayTime && (
                          <div className="half-day-info">
                            <span className="time-range">{employee.halfDayTime.from} - {employee.halfDayTime.to}</span>
                            <button className="btn-edit-mini" onClick={() => handleEditHalfDayTime(employee)}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="td-action">
                      <div className="attendance-toggle">
                        <button
                          className={`toggle-btn p ${employee.status === "present" ? "active" : ""}`}
                          onClick={() => handleStatusChange(employee.id, "present")}
                          title="Present"
                        >P</button>
                        <button
                          className={`toggle-btn h ${employee.status === "half" ? "active" : ""}`}
                          onClick={() => handleStatusChange(employee.id, "half")}
                          title="Half Day"
                        >H</button>
                        <button
                          className={`toggle-btn a ${employee.status === "absent" ? "active" : ""}`}
                          onClick={() => handleStatusChange(employee.id, "absent")}
                          title="Absent"
                        >A</button>
                      </div>
                    </td>

                    <td className="td-notes">
                      <div className="note-container">
                        {employee.note ? (
                          <div className="active-note" onClick={() => handleOpenNoteModal(employee)}>
                            <span className="material-symbols-outlined">description</span>
                            <span className="truncate">{employee.note}</span>
                          </div>
                        ) : (
                          <button className="add-note-inline" onClick={() => handleOpenNoteModal(employee)}>
                            <span className="material-symbols-outlined">add_comment</span>
                            Remark
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