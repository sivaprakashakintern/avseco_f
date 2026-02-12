import React, { useState } from 'react';
import './AttendanceLog.css';

const AttendanceLog = () => {
  // Sample employee data
  const [employees, setEmployees] = useState([
    {
      id: 1,
      initials: 'AK',
      name: 'Arjun Kumar',
      empId: 'EMP-2023-001',
      department: 'Leaf Processing',
      departmentClass: 'primary',
      status: 'present',
      note: ''
    },
    {
      id: 2,
      initials: 'SD',
      name: 'Sita Devi',
      empId: 'EMP-2023-042',
      department: 'Packaging',
      departmentClass: 'default',
      status: 'half',
      note: 'Medical leave for afternoon'
    },
    {
      id: 3,
      initials: 'RS',
      name: 'Rajesh Singh',
      empId: 'EMP-2023-089',
      department: 'Quality Control',
      departmentClass: 'default',
      status: 'absent',
      note: 'Uninformed absence'
    },
    {
      id: 4,
      initials: 'PS',
      name: 'Priya Sharma',
      empId: 'EMP-2023-102',
      department: 'Leaf Processing',
      departmentClass: 'primary',
      status: 'present',
      note: 'None'
    }
  ]);

  // Stats
  const totalEmployees = 156;
  const presentCount = 142;
  const absentCount = 8;
  const lateCount = 6;

  // Handle status change
  const handleStatusChange = (empId, newStatus) => {
    setEmployees(employees.map(emp => 
      emp.id === empId ? { ...emp, status: newStatus } : emp
    ));
  };

  // Handle note change
  const handleNoteChange = (empId, newNote) => {
    setEmployees(employees.map(emp => 
      emp.id === empId ? { ...emp, note: newNote } : emp
    ));
  };

  // Handle Mark All Present
  const handleMarkAllPresent = () => {
    setEmployees(employees.map(emp => ({ 
      ...emp, 
      status: 'present',
      note: emp.note === 'None' ? '' : emp.note 
    })));
  };

  // Calculate pending updates
  const pendingUpdates = employees.filter(emp => 
    emp.status !== 'present' || (emp.note && emp.note !== '' && emp.note !== 'None')
  ).length;

  // Chart data
  const chartData = [
    { date: 'Oct 01', present: 95, absent: 2, half: 4 },
    { date: 'Oct 05', present: 88, absent: 6, half: 2 },
    { date: 'Oct 10', present: 92, absent: 4, half: 4 },
    { date: 'Oct 15', present: 98, absent: 1, half: 1 },
    { date: 'Oct 24', present: 91, absent: 5, half: 4, isToday: true },
    { date: 'Oct 30', present: 0, absent: 0, half: 0, isEmpty: true }
  ];

  return (
    <div className="app-container">
      
      {/* Scrollable Content Area */}
      <div className="scrollable-content">
        <main className="main-container">
          
          {/* Page Header */}
          <div className="page-header">
            <div className="page-title-section">
              <h1 className="page-title">
                Daily Attendance Log
              </h1>
              <p className="page-subtitle">
                October 24, 2023 • Morning Shift (08:00 - 16:00)
              </p>
            </div>
            
            <div className="date-controls">
              <div className="date-selector">
                <button className="date-nav-btn">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div className="date-display">
                  <span className="material-symbols-outlined text-primary">calendar_today</span>
                  24 Oct 2023
                </div>
                <button className="date-nav-btn">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <button className="save-btn">
                <span className="material-symbols-outlined">check_circle</span>
                Save Attendance
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Workforce</div>
              <div className="stat-value">
                <span className="stat-number">{totalEmployees}</span>
                <span className="stat-badge">Active</span>
              </div>
            </div>

            <div className="stat-card border-left-primary">
              <div className="stat-label">Present</div>
              <div className="stat-value">
                <span className="stat-number primary">{presentCount}</span>
                <span className="stat-badge primary">
                  {Math.round((presentCount / totalEmployees) * 100)}%
                </span>
              </div>
            </div>

            <div className="stat-card border-left-red">
              <div className="stat-label">Absent</div>
              <div className="stat-value">
                <span className="stat-number red">{absentCount}</span>
                <span className="stat-badge red">
                  {Math.round((absentCount / totalEmployees) * 100)}%
                </span>
              </div>
            </div>

            <div className="stat-card border-left-orange">
              <div className="stat-label">Half-day / Late</div>
              <div className="stat-value">
                <span className="stat-number orange">{lateCount}</span>
                <span className="stat-badge orange">
                  {Math.round((lateCount / totalEmployees) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="table-container">
            
            {/* Table Controls */}
            <div className="table-controls">
              <div className="action-buttons">
                <button onClick={handleMarkAllPresent} className="action-btn">
                  Mark All Present
                </button>
                <button className="action-btn">
                  <span className="material-symbols-outlined">filter_list</span>
                  Filter Dept
                </button>
              </div>
              <div className="table-info">
                Showing 1-{employees.length} of {totalEmployees} Employees
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Employee Details</th>
                    <th>Department</th>
                    <th>Status Toggle</th>
                    <th>Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">{employee.initials}</div>
                          <div className="employee-info">
                            <span className="employee-name">{employee.name}</span>
                            <span className="employee-id">{employee.empId}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="department-cell">
                          <span className={`department-tag ${employee.departmentClass}`}>
                            {employee.department}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="status-cell">
                          <div className="status-toggle-group">
                            <button 
                              onClick={() => handleStatusChange(employee.id, 'present')}
                              className={`status-btn ${employee.status === 'present' ? 'active bg-primary' : ''}`}
                            >
                              Present
                            </button>
                            <button 
                              onClick={() => handleStatusChange(employee.id, 'half')}
                              className={`status-btn ${employee.status === 'half' ? 'active bg-orange' : ''}`}
                            >
                              Half
                            </button>
                            <button 
                              onClick={() => handleStatusChange(employee.id, 'absent')}
                              className={`status-btn ${employee.status === 'absent' ? 'active bg-red' : ''}`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="remark-cell">
                          <input 
                            className="remark-input"
                            placeholder={employee.status === 'present' && !employee.note ? 'None' : 'Add a note...'}
                            type="text"
                            value={employee.note || ''}
                            onChange={(e) => handleNoteChange(employee.id, e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <span style={{ color: 'var(--text-muted)' }}>...</span>
              <button className="pagination-btn">16</button>
            </div>
          </div>

          {/* Chart Section */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Month-at-a-Glance</h2>
                <p className="chart-subtitle">Attendance percentage trends for October 2023</p>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot primary"></div>
                  <span className="legend-text">Present</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot orange"></div>
                  <span className="legend-text">Half-day</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot red"></div>
                  <span className="legend-text">Absent</span>
                </div>
              </div>
            </div>

            <div className="chart-scroll">
              <div className="chart-bars">
                {chartData.map((data, index) => (
                  <div key={index} className="chart-bar-item">
                    {data.isToday && (
                      <div className="chart-tooltip">Today: {data.present}%</div>
                    )}
                    <div className="chart-bar-wrapper">
                      <div 
                        className={`chart-bar ${data.isEmpty ? 'empty' : ''} ${data.isToday ? 'today' : ''}`}
                        style={{ height: data.isEmpty ? '4px' : `${data.present}%` }}
                      >
                        {!data.isEmpty && (
                          <>
                            <div style={{ height: `${data.absent}px`, width: '100%', backgroundColor: 'var(--absent)' }}></div>
                            <div style={{ height: `${data.half}px`, width: '100%', backgroundColor: 'var(--half-day)' }}></div>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`chart-label ${data.isToday ? 'active' : ''}`}>{data.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Footer */}
      <div className="floating-footer">
        <div className="floating-card">
          <div className="pending-info">
            <span className="pending-label">Pending Updates</span>
            <span className="pending-count">{pendingUpdates} Employees</span>
          </div>
          <div className="divider"></div>
          <button className="confirm-btn">
            <span className="material-symbols-outlined">save</span>
            <span>CONFIRM & SAVE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceLog;