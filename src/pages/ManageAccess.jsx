import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import axios from '../utils/axiosConfig.js';
import './ManageAccess.css';

const ManageAccess = () => {
  const { user, canEdit, refreshUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' or 'credentials'
  const [initialModules, setInitialModules] = useState([]); // Track original state for 'changes' button color logic
  const [initialViewOnly, setInitialViewOnly] = useState(false);
  const managementCardRef = useRef(null);

  // Credential editing state
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, modRes] = await Promise.all([
        axios.get('/admin/employees'),
        axios.get('/admin/modules')
      ]);
      setEmployees(empRes.data);
      setAvailableModules(modRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
      setLoading(false);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee({ ...employee });
    setInitialModules([...(employee.modules || [])]);
    setInitialViewOnly(Boolean(employee.viewOnly));
    // Auto-fetch email as username
    setCredentials({ 
      username: employee.username || employee.email || '', 
      password: '' 
    });
    setMessage({ type: '', text: '' });

    // Auto-scroll to management card on mobile
    if (window.innerWidth <= 992) {
      setTimeout(() => {
        managementCardRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: `${label} copied to clipboard!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCredentials({ ...credentials, password: pass });
    setMessage({ type: 'success', text: `New password generated: ${pass}` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleToggleModule = (moduleName) => {
    if (!selectedEmployee || !canEdit || Boolean(selectedEmployee.viewOnly)) return;

    // Ensure modules array exists
    const currentModules = [...(selectedEmployee.modules || [])];
    const index = currentModules.indexOf(moduleName);

    if (index > -1) {
      currentModules.splice(index, 1);
    } else {
      currentModules.push(moduleName);
    }

    setSelectedEmployee({ ...selectedEmployee, modules: currentModules });
  };

  const handleSelectAll = () => {
    if (!selectedEmployee || !canEdit) return;
    setSelectedEmployee({ ...selectedEmployee, modules: [...availableModules] });
  };

  const handleClearAll = () => {
    if (!selectedEmployee || !canEdit) return;
    setSelectedEmployee({ ...selectedEmployee, modules: [] });
  };

  const handleToggleViewOnly = () => {
    if (!selectedEmployee || !canEdit) return;
    // No role‑based restriction; any user can be set to view‑only
    setSelectedEmployee({ ...selectedEmployee, viewOnly: !selectedEmployee.viewOnly });
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee || !canEdit) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put(`/admin/employees/${selectedEmployee._id}/modules`, {
        modules: selectedEmployee.modules,
        viewOnly: Boolean(selectedEmployee.viewOnly)
      });
      // Refresh user info in case the current user is being updated
      await refreshUser();
      const updatedEmployee = { ...selectedEmployee, viewOnly: Boolean(selectedEmployee.viewOnly) };
      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? updatedEmployee : emp
      ));
      setSelectedEmployee(updatedEmployee);
      setInitialModules([...selectedEmployee.modules]); // Update initial state after save
      setInitialViewOnly(Boolean(selectedEmployee.viewOnly));
      setMessage({ type: 'success', text: 'Permissions saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save permissions' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!selectedEmployee || !canEdit) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.put(`/admin/employees/${selectedEmployee._id}/credentials`, credentials);
      
      const updatedEmployee = { 
        ...selectedEmployee, 
        username: credentials.username,
        visiblePassword: data.visiblePassword || credentials.password
      };
      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? updatedEmployee : emp
      ));
      setSelectedEmployee(updatedEmployee);
      setCredentials({ ...credentials, password: '' }); // Clear password for security
      
      setMessage({ type: 'success', text: 'Credentials updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update credentials' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (!emp || !emp.name) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = emp.name.toLowerCase().includes(searchLower);
    const userMatch = emp.username ? emp.username.toLowerCase().includes(searchLower) : false;
    const deptMatch = emp.department ? emp.department.toLowerCase().includes(searchLower) : false;
    
    return nameMatch || userMatch || deptMatch;
  });

  const getModuleIcon = (module) => {
    const icons = {
      dashboard: 'dashboard',
      stock: 'inventory_2',
      products: 'format_list_bulleted',
      production: 'factory',
      employees: 'badge',
      attendance: 'event_available',
      clients: 'group',
      sales: 'sell',
      reports: 'analytics',
      expenses: 'payments',
      notifications: 'notifications'
    };
    return icons[module] || 'extension';
  };
  
  // Calculate if there are pending changes for the 'Commit Changes' button logic
  const hasPendingChanges = selectedEmployee && (
    JSON.stringify([...selectedEmployee.modules].sort()) !== JSON.stringify([...initialModules].sort()) ||
    Boolean(selectedEmployee.viewOnly) !== Boolean(initialViewOnly)
  );

  // Calculate if credential changes are pending
  const hasCredentialChanges = selectedEmployee && (
    credentials.username !== (selectedEmployee.username || selectedEmployee.email || '') ||
    credentials.password !== ''
  );

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner"></div>
      <p>Loading administration console...</p>
    </div>
  );

  
  

  const renderManagementContent = () => (
    <div className="management-wrapper">
      <div className="management-top-bar">
        <div className="selected-user-header">
          <h2 className="desktop-only">{selectedEmployee.name}</h2>
          <div className="tabs">
            <button 
              className={activeTab === 'permissions' ? 'active' : ''} 
              onClick={() => setActiveTab('permissions')}
            >
              Permissions
            </button>
            <button 
              className={activeTab === 'credentials' ? 'active' : ''} 
              onClick={() => setActiveTab('credentials')}
            >
              Credentials
            </button>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`status-message ${message.type}`}>
          <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          {message.text}
        </div>
      )}

      {!canEdit && (
        <div className="status-message info">
          <span className="material-symbols-outlined">visibility</span>
          View-only access is enabled. You can browse modules, but changes are disabled.
        </div>
      )}

      {activeTab === 'permissions' ? (
        <div className="permissions-tab">
          <div className="tab-header">
            <h3>Module Access</h3>
            <div className="tab-actions">
               <button onClick={handleSelectAll} className="bulk-btn select" disabled={!canEdit || Boolean(selectedEmployee?.viewOnly)}>Allow All</button>
               <button onClick={handleClearAll} className="bulk-btn clear" disabled={!canEdit || Boolean(selectedEmployee?.viewOnly)}>Revoke All</button>
            </div>
          </div>
            <div className="view-only-toggle" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: canEdit ? 'pointer' : 'not-allowed', fontWeight: 600, color: '#0f172a' }}>
                <input
                  type="checkbox"
                  checked={Boolean(selectedEmployee?.viewOnly)}
                  onChange={handleToggleViewOnly}
                  disabled={!canEdit}
                />
                View-only access
              </label>
              <span style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '520px' }}>
                When enabled, this user can browse assigned modules but cannot make edits.
              </span>
            </div>
          <div className="modules-grid">
              {availableModules.filter(m => m.toLowerCase() !== 'dashboard').map(module => (
                <div 
                  key={module}
                  onClick={canEdit && !selectedEmployee?.viewOnly ? () => handleToggleModule(module) : undefined}
                                      className={`module-card ${selectedEmployee.modules?.includes(module) ? 'active' : ''} ${!canEdit || Boolean(selectedEmployee?.viewOnly) ? 'readonly' : ''}`}
                >
                  <div className="module-icon">
                    <span className="material-symbols-outlined">{getModuleIcon(module)}</span>
                  </div>
                  <span className="module-name">{module}</span>
                  <div className="check-box">
                    {selectedEmployee.modules?.includes(module) && <span className="material-symbols-outlined">done</span>}
                  </div>
                </div>
              ))}
          </div>
          <div className="tab-footer">
              {canEdit ? (
                <button 
                  onClick={handleSavePermissions}
                  disabled={saving || !hasPendingChanges}
                  className={`save-btn ${hasPendingChanges ? 'has-changes' : 'no-changes'}`}
                >
                  {saving ? 'Saving...' : 'Commit Changes'}
                </button>
              ) : (
                <div className="info-message">
                  <span className="material-symbols-outlined" style={{ verticalAlign: 'middle' }}>visibility</span>
                  <span style={{ marginLeft: '6px' }}>View‑only mode – changes cannot be saved.</span>
                </div>
              )}
              {!hasPendingChanges && selectedEmployee && (
                 <span className="no-changes-hint">No pending changes</span>
              )}
            </div>
        </div>
      ) : (
        <div className="credentials-tab">
          <div className="tab-header">
            <h3>Security Credentials</h3>
          </div>
          <div className="credential-form">
        <div className="form-group">
          <label>Login Username</label>
          <div className="input-with-actions">
            <input 
              value={credentials.username} 
              readOnly={!canEdit}
              disabled={!canEdit}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="e.g. jdoe"
            />
            <button className="icon-action-btn" onClick={() => copyToClipboard(credentials.username, 'Username')} title="Copy Username" disabled={!canEdit}>
              <span className="material-symbols-outlined">content_copy</span>
            </button>
          </div>
        </div>

        <div className="form-group current-creds-info">
           <div className="current-pass-display">
             <span className="info-label">Current Data Password:</span>
             <span className="info-value">{selectedEmployee.visiblePassword || 'Not Set'}</span>
             {selectedEmployee.visiblePassword && (
               <button className="copy-mini-btn" onClick={() => copyToClipboard(selectedEmployee.visiblePassword, 'Password')} disabled={!canEdit}>
                  <span className="material-symbols-outlined">content_copy</span>
               </button>
             )}
           </div>
        </div>

        <div className="form-group credentials-group">
          <div className="db-status-badge">
            <span className="material-symbols-outlined">verified_user</span>
            Database Status: 🔒 Encrypted & Secure
          </div>
          
          <label>Assign New Password</label>
          <div className="input-with-actions">
            <div className="input-with-button" style={{ flex: 1 }}>
              <input 
                type="text" 
                value={credentials.password} 
                readOnly={!canEdit}
                disabled={!canEdit}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Leave empty to keep existing"
                className="creds-input"
              />
              <button className="gen-btn" onClick={generatePassword} type="button" disabled={!canEdit}>
                <span className="material-symbols-outlined">key</span>
                Gen
              </button>
            </div>
            {credentials.password && (
              <button className="icon-action-btn" onClick={() => copyToClipboard(credentials.password, 'Password')} title="Copy Password" disabled={!canEdit}>
                <span className="material-symbols-outlined">content_copy</span>
              </button>
            )}
          </div>
          <p className="hint">
            <span className="material-symbols-outlined">info</span>
            Setting a new password will immediately override the current one in the database.
          </p>
        </div>
      </div>
          <div className="tab-footer">
              {canEdit ? (
                <button 
                  onClick={handleSaveCredentials}
                  disabled={saving || !credentials.username || !hasCredentialChanges}
                  className={`save-btn creds ${hasCredentialChanges ? 'has-changes' : 'no-changes'}`}
                >
                  {saving ? 'Updating...' : 'Set New Credentials'}
                </button>
              ) : (
                <div className="info-message">
                  <span className="material-symbols-outlined" style={{ verticalAlign: 'middle' }}>visibility</span>
                  <span style={{ marginLeft: '6px' }}>View‑only mode – credentials cannot be edited.</span>
                </div>
              )}
            {!hasCredentialChanges && selectedEmployee && (
               <span className="no-changes-hint">No pending changes</span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-container">
      <div className="premium-header-green att-header">
        <div className="header-left-group">
          <h1 className="page-title-white">Security & Access</h1>
        </div>
      </div>

      <div className="admin-layout">
        {/* Left: Employee Directory */}
        <div className="employee-sidebar-card">
          <div className="sidebar-search">
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="employee-list">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(emp => (
                <React.Fragment key={emp._id}>
                  <div 
                    onClick={() => handleSelectEmployee(emp)}
                    className={`employee-item ${selectedEmployee?._id === emp._id ? 'selected' : ''}`}
                  >
                    <div className="emp-avatar">
                     {emp.avatar ? <img src={emp.avatar} alt="" /> : <span>{emp.name.charAt(0)}</span>}
                     {user?._id === emp._id && <div className="online-indicator" title="Online now"></div>}
                    </div>
                    <div className="emp-info">
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-dept">{emp.department}</span>
                      {emp.username && <span className="emp-user">@{emp.username}</span>}
                    </div>
                    {emp.role === 'admin' && <span className="admin-badge">Admin</span>}
                  </div>

                  {/* Mobile Inline Expansion */}
                  {window.innerWidth <= 992 && selectedEmployee?._id === emp._id && (
                    <div className="mobile-inline-management">
                      {renderManagementContent()}
                    </div>
                  )}
                </React.Fragment>
              ))
            ) : (
              <div className="no-results">No employees found</div>
            )}
          </div>
        </div>

        {/* Right: Management Content (Desktop Only) */}
        <div className="management-content-card desktop-only-panel" ref={managementCardRef}>
          {selectedEmployee ? renderManagementContent() : (
            <div className="empty-state">
              <span className="material-symbols-outlined">manage_accounts</span>
              <h3>No Employee Selected</h3>
              <p>Please select an employee from the directory to configure their access.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageAccess;
