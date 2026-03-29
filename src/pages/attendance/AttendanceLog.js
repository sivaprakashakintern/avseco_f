import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { formatDate } from '../../utils/dateUtils.js';
import { notificationApi } from '../../utils/api.js';
import './AttendanceLog.css';
// ─── Helpers ──────────────────────────────────────────────────────────────────
// ✅ Use local date (not UTC) to avoid IST → UTC date shift bug
// e.g. March 19 00:00 IST = March 18 18:30 UTC → toISOString() gives wrong date!
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const today = () => {
  const now = new Date();
  // Create date with local midnight to avoid timezone issues
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();



// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <div className={`att-toast att-toast-${type}`}>
    <span className="material-symbols-outlined">
      {type === "success" ? "check_circle" : type === "error" ? "error" : "info"}
    </span>
    <span>{message}</span>
    <button className="att-toast-close" onClick={onClose}>
      <span className="material-symbols-outlined">close</span>
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceLog = () => {
  const { 
    attendanceRecords, 
    saveAttendanceForDate,
    initAttendanceForDate,
    updateAttendanceRecord,
    employees: globalEmployees
  } = useAppContext();
  const { user, isAdmin } = useAuth();

  // ── Date State ──────────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(today());
  const dateKey = toDateKey(currentDate);
  const isToday = toDateKey(currentDate) === toDateKey(today());
  const isSunday = currentDate.getDay() === 0;

  const goToPreviousDay = () => setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; });
  const goToNextDay = () => { if (!isToday) setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; }); };

  // ── Fetch Attendance for Current Date ────────────────────────────────────────
  useEffect(() => {
    initAttendanceForDate(dateKey);
  }, [dateKey, initAttendanceForDate]);

  const patchAttendance = (empId, patch) => {
    updateAttendanceRecord(dateKey, empId, patch);
  };

  // ── Search / Filter State ────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const ITEMS_PER_PAGE = isMobile ? 15 : 10;
  useEffect(() => setCurrentPage(1), [searchTerm, selectedDept, statusFilter, dateKey]);

  // ── Modal State ───────────────────────────────────────────────────────────────
  const [showHalfDayModal, setShowHalfDayModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [showStoppageModal, setShowStoppageModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [halfDayTime, setHalfDayTime] = useState({ from: "09:00", to: "13:00" });
  const [absentReason, setAbsentReason] = useState("");
  const [stoppageData, setStoppageData] = useState({ reason: "Machine Breakdown", startTime: "10:00", endTime: "12:00", notes: "" });

  // ── Toast State ───────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Derived Employees List ────────────────────────────────────────────────────
  const employees = useMemo(() => {
    const dayRecords = attendanceRecords[dateKey] || [];
    return globalEmployees.map(emp => {
      const record = dayRecords.find(r => r.empId === emp.id);
      return {
        ...emp,
        empId: emp.empId || `EMP-${String(emp.id).padStart(4, "0")}`,
        status: record?.status || "present",
        note: record?.note || "",
        halfDayTime: record?.halfDayTime || null,
      };
    });
  }, [globalEmployees, attendanceRecords, dateKey]);

  // ── Quick Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const present = employees.filter(e => e.status === "present").length;
    const absent = employees.filter(e => e.status === "absent").length;
    const half = employees.filter(e => e.status === "half").length;
    const total = employees.length;
    return { total, present, absent, half };
  }, [employees]);

  // ── Filtered Employees ────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return employees.filter(emp => {
      const matchSearch = !q || emp.name.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q) || (emp.empId || "").toLowerCase().includes(q);
      const matchDept = selectedDept === "All Departments" || emp.department === selectedDept;
      const matchStatus = statusFilter === "all" || emp.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, selectedDept, statusFilter]);

  // ── Paginated ─────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage, ITEMS_PER_PAGE]);

  // ── Departments List ──────────────────────────────────────────────────────────
  const departments = useMemo(() => {
    const depts = ["All Departments", ...new Set(globalEmployees.map(e => e.department))];
    return depts;
  }, [globalEmployees]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleStatusChange = (empId, newStatus) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    if (newStatus === "present") {
      patchAttendance(empId, { status: "present", note: "", halfDayTime: null });
      showToast(`${emp.name} marked as Present`);
    } else if (newStatus === "half") {
      setSelectedEmployee(emp);
      setHalfDayTime(emp.halfDayTime || { from: "09:00", to: "13:00" });
      setAbsentReason(emp.note || "");
      setShowHalfDayModal(true);
    } else if (newStatus === "absent") {
      setSelectedEmployee(emp);
      setAbsentReason(emp.note || "");
      setShowAbsentModal(true);
    }
  };

  const handleSaveHalfDay = () => {
    if (!selectedEmployee) return;
    patchAttendance(selectedEmployee.id, { status: "half", halfDayTime, note: absentReason });
    showToast(`Half Day marked for ${selectedEmployee.name} (${halfDayTime.from}–${halfDayTime.to})`);
    setShowHalfDayModal(false);
    setSelectedEmployee(null);
  };

  const handleSaveAbsent = () => {
    if (!selectedEmployee) return;
    patchAttendance(selectedEmployee.id, { status: "absent", note: absentReason, halfDayTime: null });
    showToast(`${selectedEmployee.name} marked as Absent`);
    setShowAbsentModal(false);
    setSelectedEmployee(null);
  };



  const handleMarkAllPresent = () => {
    filteredEmployees.forEach(emp => patchAttendance(emp.id, { status: "present", note: "", halfDayTime: null }));
    showToast(`All ${filteredEmployees.length} employees marked as Present`);
  };

  const handleStoppageSave = () => {
    filteredEmployees.forEach(emp => patchAttendance(emp.id, { status: "absent", note: `Work Stoppage: ${stoppageData.reason}`, halfDayTime: null }));
    showToast(`Work stoppage applied – ${filteredEmployees.length} employees marked Absent`, "warning");
    setShowStoppageModal(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDept("All Departments");
    setStatusFilter("all");
  };

  const handleSendReminder = async (emp) => {
    try {
      await notificationApi.sendPush({
        title: "Attendance Notification",
        message: `Hi ${emp.name}, please update your attendance status for today (${dateKey}).`,
        targetAudience: emp.id
      });
      showToast(`Reminder sent to ${emp.name}`);
    } catch (err) {
      showToast("Failed to send reminder", "error");
    }
  };

  const [saveLoading, setSaveLoading] = useState(false);
  const handleSaveAttendance = async () => {
    setSaveLoading(true);
    try {
      const dayRecords = (attendanceRecords[dateKey] || []).map(r => ({
        ...r,
        recordedBy: r.recordedBy || user?.name || "System"
      }));
      await saveAttendanceForDate(dateKey, dayRecords);
      showToast("Attendance saved successfully!", "success");
    } catch (error) {
      showToast("Failed to save attendance", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Pagination pages ──────────────────────────────────────────────────────────
  const pageNumbers = () => {
    const pages = [];
    const delta = 1;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    if (left > 1) { pages.push(1); if (left > 2) pages.push("..."); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="att-container">

      {/* ── TOAST ─────────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── PAGE HEADER BANNER ─────────────────────────────────────────────── */}
      <div className="att-banner-header">
        <div className="att-banner-left">
          <h1 className="att-banner-title">Attendance Management</h1>
        </div>
      </div>

      {/* ── DATE NAVIGATOR ────────────────────────────────────────────────────── */}
      <div className="att-date-nav">
        <div className="att-date-controls">
          <button className="att-date-btn" onClick={goToPreviousDay}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="att-date-display">
            <span className="material-symbols-outlined">calendar_today</span>
            <span>{formatDate(currentDate)}</span>
            {isToday && <span className="att-today-badge">Today</span>}
          </div>
          <button className="att-date-btn" onClick={goToNextDay} disabled={isToday}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div className="att-date-actions">
          <button 
            className="att-btn att-btn-outline" 
            onClick={() => setShowStoppageModal(true)}
            disabled={isSunday || !isToday}
          >
            <span className="material-symbols-outlined">warning</span>
            Work Stoppage
          </button>
          {!isMobile && (
            <button 
              className="att-btn att-btn-primary" 
              onClick={handleSaveAttendance} 
              disabled={saveLoading || isSunday || !isToday}
            >
              <span className="material-symbols-outlined">{saveLoading ? "hourglass_top" : "save"}</span>
              {saveLoading ? "Saving…" : "Save Attendance"}
            </button>
          )}
        </div>
      </div>

      {/* ── STATS CARDS ───────────────────────────────────────────────────────── */}
      <div className="att-stats-grid">
        <div className="att-stat-card">
          <div className="att-stat-icon blue"><span className="material-symbols-outlined">group</span></div>
          <div className="att-stat-info">
            <p className="att-stat-label">Total Staff</p>
            <h3 className="att-stat-number">{stats.total}</h3>
          </div>
        </div>
        <div className="att-stat-card">
          <div className="att-stat-icon green"><span className="material-symbols-outlined">check_circle</span></div>
          <div className="att-stat-info">
            <p className="att-stat-label">Present</p>
            <h3 className="att-stat-number">{stats.present}</h3>
          </div>
        </div>
        <div className="att-stat-card">
          <div className="att-stat-icon red"><span className="material-symbols-outlined">cancel</span></div>
          <div className="att-stat-info">
            <p className="att-stat-label">Absent</p>
            <h3 className="att-stat-number">{stats.absent}</h3>
          </div>
        </div>
        <div className="att-stat-card">
          <div className="att-stat-icon amber"><span className="material-symbols-outlined">schedule</span></div>
          <div className="att-stat-info">
            <p className="att-stat-label">Half Day</p>
            <h3 className="att-stat-number">{stats.half}</h3>
          </div>
        </div>

      </div>

      {/* ── FILTERS + BULK ACTIONS ────────────────────────────────────────────── */}
      <div className="att-filter-row">
        {/* Search */}
        <div className="att-search-box">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search by name, dept, or ID…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="att-search-clear" onClick={() => setSearchTerm("")}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Department Filter */}
        <select className="att-select att-select-dept" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Status Filter */}
        <select className="att-select att-select-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="half">Half Day</option>
          <option value="absent">Absent</option>
        </select>

        {/* Clear */}
        {(searchTerm || selectedDept !== "All Departments" || statusFilter !== "all") && (
          <button className="att-btn att-btn-ghost" onClick={clearFilters}>
            <span className="material-symbols-outlined">filter_list_off</span>
            Clear
          </button>
        )}

        <div className="att-filter-spacer" />

        <button 
          className="att-btn att-btn-success-outline" 
          onClick={handleMarkAllPresent}
          disabled={isSunday || !isToday}
        >
          <span className="material-symbols-outlined">done_all</span>
          Mark All Present
        </button>
      </div>

      {isMobile && (
        <div style={{ padding: '0 14px', marginBottom: '20px' }}>
          <button 
            className="att-btn att-btn-primary" 
            style={{ width: '100%', justifyContent: 'center', height: '50px', borderRadius: '14px' }}
            onClick={handleSaveAttendance} 
            disabled={saveLoading || isSunday || !isToday}
          >
            <span className="material-symbols-outlined">{saveLoading ? "hourglass_top" : "save"}</span>
            {saveLoading ? "Saving…" : "Save Attendance"}
          </button>
        </div>
      )}

      {/* ── TABLE ─────────────────────────────────────────────────────────────── */}
      <div className="att-table-card">
        {/* Table header */}
        <div className="att-table-header">
          <div>
            <h3>Employee Attendance</h3>
            <span className="att-count-badge">{filteredEmployees.length} employees</span>
          </div>
        </div>

        {/* ───── DESKTOP TABLE ───── */}
        {!isMobile && (
          <div className="att-table-wrap">
            <table className="att-table">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '50px' }}>S.NO</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th className="text-center" style={{ width: '180px' }}>Mark Attendance</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp, index) => (
                    <tr key={emp.id} className="att-table-row">
                      <td className="text-center" style={{ color: '#64748b', fontWeight: '600', fontSize: '13px' }}>
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className="att-td-name">
                        <div className="att-emp-cell">
                          <div className={`att-avatar att-avatar-${emp.status}`}>
                            {getInitials(emp.name)}
                          </div>
                          <div className="att-emp-info">
                            <span className="att-emp-name">{emp.name}</span>
                            <span className="att-emp-dept">{emp.department}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="att-dept-badge">{emp.department}</span></td>

                      <td className="text-center">
                        <div className="att-actions-cell">
                          <div className="att-toggle-group">
                            <button className={`att-toggle-btn att-p${emp.status === "present" ? " active" : ""}`} onClick={() => !isSunday && isToday && handleStatusChange(emp.id, "present")} disabled={isSunday || !isToday} title={isSunday ? "Sunday Restricted" : !isToday ? "View Only" : "Present"}>P</button>
                            <button className={`att-toggle-btn att-h${emp.status === "half" ? " active" : ""}`} onClick={() => !isSunday && isToday && handleStatusChange(emp.id, "half")} disabled={isSunday || !isToday} title={isSunday ? "Sunday Restricted" : !isToday ? "View Only" : "Half Day"}>H</button>
                            <button className={`att-toggle-btn att-a${emp.status === "absent" ? " active" : ""}`} onClick={() => !isSunday && isToday && handleStatusChange(emp.id, "absent")} disabled={isSunday || !isToday} title={isSunday ? "Sunday Restricted" : !isToday ? "View Only" : "Absent"}>A</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="att-empty">
                      <span className="material-symbols-outlined">search_off</span>
                      <p>No employees match the current filters</p>
                      <button className="att-btn att-btn-ghost" onClick={clearFilters}>Clear Filters</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ───── MOBILE LIST ───── */}
        {isMobile && (
          <div className="att-mobile-list">
            {paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((emp, index) => (
                <div key={emp.id} className="att-mobile-row">
                  {/* S.NO */}
                  <span className="att-mobile-sno">
                    #{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </span>

                  {/* Avatar */}
                  <div className={`att-avatar att-avatar-${emp.status} att-mobile-avatar`}>
                    {getInitials(emp.name)}
                  </div>

                  {/* Name + Dept */}
                  <div className="att-mobile-info">
                    <span className="att-mobile-name">{emp.name}</span>
                    <span className="att-mobile-dept">{emp.department}</span>
                  </div>

                  {/* P / H / A */}
                  <div className="att-mobile-right">
                    <div className="att-toggle-group att-mobile-toggle">
                      <button className={`att-toggle-btn att-p${emp.status === "present" ? " active" : ""}`} onClick={() => !isSunday && isToday && handleStatusChange(emp.id, "present")} disabled={isSunday || !isToday}>P</button>
                      <button className={`att-toggle-btn att-h${emp.status === "half" ? " active" : ""}`} onClick={() => !isSunday && isToday && handleStatusChange(emp.id, "half")} disabled={isSunday || !isToday}>H</button>
                      <button className={`att-toggle-btn att-a${emp.status === "absent" ? " active" : ""}`} onClick={() => !isSunday && isToday && handleStatusChange(emp.id, "absent")} disabled={isSunday || !isToday}>A</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="att-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <span className="material-symbols-outlined">search_off</span>
                <p>No employees match the current filters</p>
              </div>
            )}
          </div>
        )}


        {/* Pagination */}
        {totalPages > 1 && (
          <div className="att-pagination">
            <p className="att-pagination-info">
              Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)}</strong> of <strong>{filteredEmployees.length}</strong> employees
            </p>
            <div className="att-pagination-controls">
              <button
                className="att-page-btn nav-btn"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {pageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="att-page-dots">…</span>
                ) : (
                  <button
                    key={p}
                    className={`att-page-btn${currentPage === p ? " active" : ""}`}
                    onClick={() => setCurrentPage(p)}
                  >{p}</button>
                )
              )}
              <button
                className="att-page-btn nav-btn"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── HALF DAY MODAL ────────────────────────────────────────────────────── */}
      {showHalfDayModal && selectedEmployee && (
        <div className="att-modal-overlay" onClick={() => setShowHalfDayModal(false)}>
          <div className="att-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <div>
                <h3>Half Day – {selectedEmployee.name}</h3>
                <p className="att-modal-sub">Select time range and optional reason</p>
              </div>
              <button className="att-modal-close" onClick={() => setShowHalfDayModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="att-modal-body">
              {/* Employee info */}
              <div className="att-modal-emp-row">
                <div className="att-avatar att-avatar-half">{getInitials(selectedEmployee.name)}</div>
                <div>
                  <strong>{selectedEmployee.name}</strong>
                  <p className="att-modal-sub">{selectedEmployee.department}</p>
                </div>
              </div>

              {/* Presets */}
              <p className="att-field-label">Quick Presets</p>
              <div className="att-presets">
                {[
                  { label: "9AM–1PM", from: "09:00", to: "13:00" },
                  { label: "1PM–6PM", from: "13:00", to: "18:00" },
                  { label: "9AM–12PM", from: "09:00", to: "12:00" },
                  { label: "2PM–6PM", from: "14:00", to: "18:00" },
                ].map(p => (
                  <button
                    key={p.label}
                    className={`att-preset-btn${halfDayTime.from === p.from && halfDayTime.to === p.to ? " selected" : ""}`}
                    onClick={() => setHalfDayTime({ from: p.from, to: p.to })}
                  >{p.label}</button>
                ))}
              </div>

              {/* Time pickers */}
              <div className="att-time-row">
                <div className="att-time-group">
                  <label className="att-field-label">From</label>
                  <input type="time" className="att-time-input" value={halfDayTime.from} onChange={e => setHalfDayTime(t => ({ ...t, from: e.target.value }))} />
                </div>
                <span className="att-time-sep">to</span>
                <div className="att-time-group">
                  <label className="att-field-label">To</label>
                  <input type="time" className="att-time-input" value={halfDayTime.to} onChange={e => setHalfDayTime(t => ({ ...t, to: e.target.value }))} />
                </div>
              </div>

              {/* Reason */}
              <label className="att-field-label">Reason <span className="att-optional">(optional)</span></label>
              <textarea
                className="att-textarea"
                rows={3}
                placeholder="Enter reason for half day…"
                value={absentReason}
                onChange={e => setAbsentReason(e.target.value)}
              />
            </div>
            <div className="att-modal-footer">
              <button className="att-btn att-btn-ghost" onClick={() => setShowHalfDayModal(false)}>Cancel</button>
              <button className="att-btn att-btn-amber" onClick={handleSaveHalfDay}>
                <span className="material-symbols-outlined">schedule</span>
                Save Half Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ABSENT MODAL ──────────────────────────────────────────────────────── */}
      {showAbsentModal && selectedEmployee && (
        <div className="att-modal-overlay" onClick={() => setShowAbsentModal(false)}>
          <div className="att-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header att-modal-header-red">
              <div>
                <h3>Mark Absent – {selectedEmployee.name}</h3>
                <p className="att-modal-sub">Provide an optional reason for absence</p>
              </div>
              <button className="att-modal-close" onClick={() => setShowAbsentModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="att-modal-body">
              <div className="att-modal-emp-row">
                <div className="att-avatar att-avatar-absent">{getInitials(selectedEmployee.name)}</div>
                <div>
                  <strong>{selectedEmployee.name}</strong>
                  <p className="att-modal-sub">{selectedEmployee.department} • Marking Absent</p>
                </div>
              </div>
              <label className="att-field-label">Reason for Absence <span className="att-optional">(optional)</span></label>
              <textarea
                className="att-textarea"
                rows={4}
                placeholder="Enter reason for leave, sick day, etc…"
                value={absentReason}
                onChange={e => setAbsentReason(e.target.value)}
              />
            </div>
            <div className="att-modal-footer">
              <button className="att-btn att-btn-ghost" onClick={() => setShowAbsentModal(false)}>Cancel</button>
              <button className="att-btn att-btn-danger" onClick={handleSaveAbsent}>
                <span className="material-symbols-outlined">cancel</span>
                Confirm Absent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WORK STOPPAGE MODAL ───────────────────────────────────────────────── */}
      {showStoppageModal && (
        <div className="att-modal-overlay" onClick={() => setShowStoppageModal(false)}>
          <div className="att-modal att-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header att-modal-header-orange">
              <div>
                <h3>Log Work Stoppage</h3>
                <p className="att-modal-sub">This will mark all {filteredEmployees.length} filtered employees as Absent</p>
              </div>
              <button className="att-modal-close" onClick={() => setShowStoppageModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="att-modal-body">
              <label className="att-field-label">Reason for Stoppage</label>
              <select className="att-select att-select-full" value={stoppageData.reason} onChange={e => setStoppageData(s => ({ ...s, reason: e.target.value }))}>
                <option>Machine Breakdown</option>
                <option>Power Failure</option>
                <option>Raw Material Shortage</option>
                <option>Safety Inspection</option>
                <option>Government Holiday</option>
                <option>Other</option>
              </select>

              <div className="att-time-row" style={{ marginTop: 16 }}>
                <div className="att-time-group">
                  <label className="att-field-label">Start Time</label>
                  <input type="time" className="att-time-input" value={stoppageData.startTime} onChange={e => setStoppageData(s => ({ ...s, startTime: e.target.value }))} />
                </div>
                <span className="att-time-sep">to</span>
                <div className="att-time-group">
                  <label className="att-field-label">End Time</label>
                  <input type="time" className="att-time-input" value={stoppageData.endTime} onChange={e => setStoppageData(s => ({ ...s, endTime: e.target.value }))} />
                </div>
              </div>

              <label className="att-field-label" style={{ marginTop: 16 }}>Additional Notes <span className="att-optional">(optional)</span></label>
              <textarea
                className="att-textarea"
                rows={3}
                placeholder="Add notes about the stoppage…"
                value={stoppageData.notes}
                onChange={e => setStoppageData(s => ({ ...s, notes: e.target.value }))}
              />

              <div className="att-stoppage-warn">
                <span className="material-symbols-outlined">warning</span>
                <span>This will mark <strong>{filteredEmployees.length} employees</strong> as Absent for this date.</span>
              </div>
            </div>
            <div className="att-modal-footer">
              <button className="att-btn att-btn-ghost" onClick={() => setShowStoppageModal(false)}>Cancel</button>
              <button className="att-btn att-btn-orange" onClick={handleStoppageSave}>
                <span className="material-symbols-outlined">warning</span>
                Apply Stoppage
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceLog;