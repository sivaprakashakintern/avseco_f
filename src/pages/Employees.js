import React, { useState } from 'react';
import './Employees.css';

const Employees = () => {
  const [viewMode, setViewMode] = useState('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  const employees = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      role: 'Plant Manager',
      department: 'Management',
      email: 'rajesh.k@avseco.com',
      phone: '+91 98765 43210',
      status: 'Active',
      joinDate: '2020-01-15',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNTIrSDLkd1nVKZTJd-gk2ZvFYlRNFrjFvpbFbflQC5fMyGGVGBuVrSXDat-YAPERMn0xe8mBtMS9ScrSKp-GZSbhUwRiaRgjtG9_16Ozcosi7Sc2ZQP1dlyeZnY-ql3xtuNbXa7BWh8MBp8cfN7S2XOO0Xz5Vhj6-P3Ok6RN-T5nEnO68vqbsozcQRLCdrh2pJBAPKFSXHugsuD7FeRzwH_vEf1u9esg2pNFGG31dMO9wG_tWXKoXr_pEP7Gv1L_LJtTdcplpLcoS'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      role: 'Production Supervisor',
      department: 'Production',
      email: 'priya.s@avseco.com',
      phone: '+91 98765 43211',
      status: 'Active',
      joinDate: '2021-03-10',
      avatar: ''
    },
    {
      id: 3,
      name: 'Amit Patel',
      role: 'Quality Control',
      department: 'Quality',
      email: 'amit.p@avseco.com',
      phone: '+91 98765 43212',
      status: 'Active',
      joinDate: '2021-06-22',
      avatar: ''
    },
    {
      id: 4,
      name: 'Sneha Reddy',
      role: 'Inventory Manager',
      department: 'Inventory',
      email: 'sneha.r@avseco.com',
      phone: '+91 98765 43213',
      status: 'On Leave',
      joinDate: '2022-01-05',
      avatar: ''
    },
    {
      id: 5,
      name: 'Vikram Singh',
      role: 'Machine Operator',
      department: 'Production',
      email: 'vikram.s@avseco.com',
      phone: '+91 98765 43214',
      status: 'Active',
      joinDate: '2022-09-18',
      avatar: ''
    },
    {
      id: 6,
      name: 'Anjali Mehta',
      role: 'HR Executive',
      department: 'HR',
      email: 'anjali.m@avseco.com',
      phone: '+91 98765 43215',
      status: 'Inactive',
      joinDate: '2021-11-30',
      avatar: ''
    }
  ];

  const departments = ['All Departments', 'Management', 'Production', 'Quality', 'Inventory', 'HR'];
  const statuses = ['All Status', 'Active', 'On Leave', 'Inactive'];

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: 'Production',
    email: '',
    phone: '',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    // Add employee logic here
    console.log('New Employee:', formData);
    setShowAddForm(false);
    // Reset form
    setFormData({
      name: '',
      role: '',
      department: 'Production',
      email: '',
      phone: '',
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0]
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="employees-container">
      {/* Header with Add Button */}
      <div className="employees-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your workforce and attendance</p>
        </div>
        <button className="add-employee-btn" onClick={() => setShowAddForm(true)}>
          <span className="material-symbols-outlined">add</span>
          Add Employee
        </button>
      </div>

      {/* Add Employee Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Job Role *</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="Enter job role"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    {departments.filter(d => d !== 'All Departments').map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Join Date</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={formData.joinDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Breadcrumbs & View Toggle */}
      <div className="employees-subheader">
        <div className="breadcrumb">
          <a href="/" className="breadcrumb-link">Home</a>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Employees</span>
        </div>
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <span className="material-symbols-outlined">view_list</span>
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <div className="department-filters">
            {departments.map((dept) => (
              <button
                key={dept}
                className={`filter-btn ${selectedDepartment === dept ? 'active' : ''}`}
                onClick={() => setSelectedDepartment(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-actions">
          <button className="more-filters-btn">
            <span className="material-symbols-outlined">filter_alt</span>
            More Filters
          </button>
          <button className="export-btn">
            <span className="material-symbols-outlined">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="employee-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Employees</p>
            <p className="stat-number">124</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Active</p>
            <p className="stat-number">98</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon leave">
            <span className="material-symbols-outlined">beach_access</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">On Leave</p>
            <p className="stat-number">12</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon department">
            <span className="material-symbols-outlined">business</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Departments</p>
            <p className="stat-number">6</p>
          </div>
        </div>
      </div>

      {/* List View - WITH SCROLL FIX */}
      {viewMode === 'list' && (
        <div className="employee-table-container">
          {/* FIX: Added table-responsive wrapper for horizontal scroll */}
          <div className="table-responsive">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="employee-row">
                    <td>
                      <div className="employee-info">
                        <div className="employee-avatar">
                          {employee.avatar ? (
                            <div 
                              className="avatar-image"
                              style={{ backgroundImage: `url("${employee.avatar}")` }}
                            ></div>
                          ) : (
                            <div className="avatar-initials">
                              {getInitials(employee.name)}
                            </div>
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
                    <td>{employee.role}</td>
                    <td>
                      <p className="employee-phone">{employee.phone}</p>
                    </td>
                    <td>{new Date(employee.joinDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</td>
                    <td>
                      <span className={`status-badge ${employee.status.toLowerCase().replace(' ', '-')}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="delete-btn">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                        <button className="more-btn">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <p className="pagination-info">Showing <span>1-6</span> of <span>124</span> employees</p>
            <div className="pagination-controls">
              <button className="pagination-btn" disabled>Previous</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">4</button>
              <button className="pagination-btn">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="employee-grid">
          {employees.map((employee) => (
            <div key={employee.id} className="employee-card">
              <div className="employee-card-header">
                <div className="employee-card-avatar">
                  {employee.avatar ? (
                    <div 
                      className="avatar-image-large"
                      style={{ backgroundImage: `url("${employee.avatar}")` }}
                    ></div>
                  ) : (
                    <div className="avatar-initials-large">
                      {getInitials(employee.name)}
                    </div>
                  )}
                </div>
                <span className={`card-status-badge ${employee.status.toLowerCase().replace(' ', '-')}`}>
                  {employee.status}
                </span>
              </div>
              <div className="employee-card-content">
                <h3 className="employee-card-name">{employee.name}</h3>
                <p className="employee-card-role">{employee.role}</p>
                <p className="employee-card-dept">{employee.department}</p>
                
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
                    <span>Joined {new Date(employee.joinDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>

                <div className="employee-card-actions">
                  <button className="card-edit-btn">Edit</button>
                  <button className="card-view-btn">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Employees;