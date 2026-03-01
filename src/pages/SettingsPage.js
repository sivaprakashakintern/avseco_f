import React, { useState } from "react";
import "./SettingsPage.css";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    companyName: "AVSECO Industries",
    companySubtitle: "MANUFACTURING ERP",
    email: "admin@avseco.com",
    phone: "+91 98765 43210",
    address: "B-204, Green Valley Apartments, Electronic City, Bangalore - 560100",
    gst: "29ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    cin: "U12345KA2020PTC123456",
    website: "www.avseco.com",
    establishedYear: "2020",
    employeeCount: "156",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    attendanceAlerts: true,
    leaveRequests: true,
    stockAlerts: true,
    reportGeneration: false,
    marketingEmails: false,
  });

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState({
    darkMode: false,
    compactMode: false,
    primaryColor: "#13ec5b",
    fontSize: "medium", // small, medium, large
    sidebarCollapsed: false,
    animations: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30", // minutes
    passwordExpiry: "90", // days
    loginAlerts: true,
    ipWhitelisting: false,
  });

  // Billing Settings
  const [billingSettings, setBillingSettings] = useState({
    plan: "Enterprise",
    billingCycle: "yearly",
    nextBillingDate: "15 Mar 2026",
    autoRenew: true,
    paymentMethod: "VISA •••• 4242",
  });

  // Team Members
  const [teamMembers] = useState([
    {
      id: 1,
      name: "Rajesh Kumar",
      role: "Plant Manager",
      email: "rajesh.k@avseco.com",
      permissions: "admin",
      status: "active",
      avatar: null,
    },
    {
      id: 2,
      name: "Priya Sharma",
      role: "Production Supervisor",
      email: "priya.s@avseco.com",
      permissions: "editor",
      status: "active",
      avatar: null,
    },
    {
      id: 3,
      name: "Amit Patel",
      role: "Quality Control",
      email: "amit.p@avseco.com",
      permissions: "viewer",
      status: "active",
      avatar: null,
    },
    {
      id: 4,
      name: "Sneha Reddy",
      role: "Inventory Manager",
      email: "sneha.r@avseco.com",
      permissions: "editor",
      status: "inactive",
      avatar: null,
    },
  ]);

  // Audit Logs
  const [auditLogs] = useState([
    {
      id: 1,
      user: "Rajesh Kumar",
      action: "Settings updated",
      details: "Changed notification preferences",
      timestamp: "2026-02-12 10:30 AM",
      ip: "192.168.1.100",
    },
    {
      id: 2,
      user: "Priya Sharma",
      action: "User added",
      details: "Added new team member: Vikram Singh",
      timestamp: "2026-02-11 03:45 PM",
      ip: "192.168.1.105",
    },
    {
      id: 3,
      user: "Amit Patel",
      action: "Password changed",
      details: "Password updated successfully",
      timestamp: "2026-02-10 09:15 AM",
      ip: "192.168.1.110",
    },
    {
      id: 4,
      user: "System",
      action: "Backup completed",
      details: "Database backup completed successfully",
      timestamp: "2026-02-10 02:00 AM",
      ip: "System",
    },
  ]);

  // Handle Input Changes
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanySettings({ ...companySettings, [name]: value });
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({ ...notificationSettings, [name]: checked });
  };

  const handleThemeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setThemeSettings({
      ...themeSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Save Settings
  const handleSave = () => {
    setIsEditing(false);
    console.log("Settings saved:", {
      companySettings,
      notificationSettings,
      themeSettings,
      securitySettings,
    });
    // Show success message
    alert("Settings saved successfully!");
  };

  // Reset Password
  const handleResetPassword = () => {
    console.log("Password reset requested");
    alert("Password reset email sent!");
  };

  // Export Data
  const handleExportData = () => {
    console.log("Exporting data...");
    alert("Data export started. You will receive an email shortly.");
  };

  // Clear Cache
  const handleClearCache = () => {
    console.log("Clearing cache...");
    alert("Cache cleared successfully!");
  };

  // Delete Account
  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    console.log("Account deletion requested");
    alert("Account deletion request submitted. You will receive a confirmation email.");
  };

  // Get Initials
  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="settings-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account and application preferences</p>
        </div>
        <div className="settings-header-actions">
          {!isEditing ? (
            <button className="edit-settings-btn" onClick={() => setIsEditing(true)}>
              <span className="material-symbols-outlined">edit</span>
              Edit Settings
            </button>
          ) : (
            <>
              <button className="save-settings-btn" onClick={handleSave}>
                <span className="material-symbols-outlined">save</span>
                Save Changes
              </button>
              <button className="cancel-settings-btn" onClick={() => setIsEditing(false)}>
                <span className="material-symbols-outlined">close</span>
                Cancel
              </button>
            </>
          )}
          <button className="more-settings-btn">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          <span className="material-symbols-outlined">business</span>
          General
        </button>
        <button
          className={`settings-tab ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          <span className="material-symbols-outlined">notifications</span>
          Notifications
        </button>
        <button
          className={`settings-tab ${activeTab === "appearance" ? "active" : ""}`}
          onClick={() => setActiveTab("appearance")}
        >
          <span className="material-symbols-outlined">palette</span>
          Appearance
        </button>
        <button
          className={`settings-tab ${activeTab === "team" ? "active" : ""}`}
          onClick={() => setActiveTab("team")}
        >
          <span className="material-symbols-outlined">group</span>
          Team
        </button>
        <button
          className={`settings-tab ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <span className="material-symbols-outlined">security</span>
          Security
        </button>
        <button
          className={`settings-tab ${activeTab === "billing" ? "active" : ""}`}
          onClick={() => setActiveTab("billing")}
        >
          <span className="material-symbols-outlined">payments</span>
          Billing
        </button>
        <button
          className={`settings-tab ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <span className="material-symbols-outlined">history</span>
          Audit Logs
        </button>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* ===== GENERAL SETTINGS ===== */}
        {activeTab === "general" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>General Settings</h2>
              <p>Manage your company information and preferences</p>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Company Information</h3>
              </div>
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name *</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="companyName"
                        value={companySettings.companyName}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.companyName}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Company Subtitle</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="companySubtitle"
                        value={companySettings.companySubtitle}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.companySubtitle}</p>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={companySettings.email}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.email}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={companySettings.phone}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.phone}</p>
                    )}
                  </div>
                </div>

                <div className="form-row full-width">
                  <div className="form-group">
                    <label>Address</label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={companySettings.address}
                        onChange={handleCompanyChange}
                        className="form-textarea"
                        rows="3"
                      />
                    ) : (
                      <p className="form-value">{companySettings.address}</p>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>GST Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="gst"
                        value={companySettings.gst}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.gst}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>PAN Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="pan"
                        value={companySettings.pan}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.pan}</p>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>CIN Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="cin"
                        value={companySettings.cin}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.cin}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="website"
                        value={companySettings.website}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.website}</p>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Established Year</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="establishedYear"
                        value={companySettings.establishedYear}
                        onChange={handleCompanyChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="form-value">{companySettings.establishedYear}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Employee Count</label>
                    <p className="form-value">{companySettings.employeeCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Danger Zone</h3>
              </div>
              <div className="danger-zone">
                <div className="danger-item">
                  <div>
                    <h4>Export All Data</h4>
                    <p>Download all your company data including employees, products, and transactions</p>
                  </div>
                  <button className="danger-btn warning" onClick={handleExportData}>
                    <span className="material-symbols-outlined">download</span>
                    Export Data
                  </button>
                </div>
                <div className="danger-item">
                  <div>
                    <h4>Clear Cache</h4>
                    <p>Clear all cached data and reset application state</p>
                  </div>
                  <button className="danger-btn" onClick={handleClearCache}>
                    <span className="material-symbols-outlined">clear_all</span>
                    Clear Cache
                  </button>
                </div>
                <div className="danger-item">
                  <div>
                    <h4>Delete Account</h4>
                    <p>Permanently delete your company account and all associated data</p>
                  </div>
                  <button className="danger-btn delete" onClick={handleDeleteAccount}>
                    <span className="material-symbols-outlined">delete_forever</span>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== NOTIFICATION SETTINGS ===== */}
        {activeTab === "notifications" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Notification Settings</h2>
              <p>Configure how and when you receive notifications</p>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Notification Channels</h3>
              </div>
              <div className="settings-list">
                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">mail</span>
                    <div>
                      <h4>Email Notifications</h4>
                      <p>Receive notifications via email</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onChange={handleNotificationChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">notifications</span>
                    <div>
                      <h4>Push Notifications</h4>
                      <p>Receive push notifications in browser</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="pushNotifications"
                      checked={notificationSettings.pushNotifications}
                      onChange={handleNotificationChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">sms</span>
                    <div>
                      <h4>SMS Notifications</h4>
                      <p>Receive notifications via SMS</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="smsNotifications"
                      checked={notificationSettings.smsNotifications}
                      onChange={handleNotificationChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Alert Preferences</h3>
              </div>
              <div className="settings-list">
                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">event</span>
                    <div>
                      <h4>Attendance Alerts</h4>
                      <p>Get notified when employees mark attendance</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="attendanceAlerts"
                      checked={notificationSettings.attendanceAlerts}
                      onChange={handleNotificationChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">beach_access</span>
                    <div>
                      <h4>Leave Requests</h4>
                      <p>Get notified when employees request leave</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="leaveRequests"
                      checked={notificationSettings.leaveRequests}
                      onChange={handleNotificationChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">inventory</span>
                    <div>
                      <h4>Stock Alerts</h4>
                      <p>Get notified when stock levels are low</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="stockAlerts"
                      checked={notificationSettings.stockAlerts}
                      onChange={handleNotificationChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">assessment</span>
                    <div>
                      <h4>Report Generation</h4>
                      <p>Get notified when reports are generated</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="reportGeneration"
                      checked={notificationSettings.reportGeneration}
                      onChange={handleNotificationChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== APPEARANCE SETTINGS ===== */}
        {activeTab === "appearance" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Appearance</h2>
              <p>Customize the look and feel of your application</p>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Theme</h3>
              </div>
              <div className="settings-list">
                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">dark_mode</span>
                    <div>
                      <h4>Dark Mode</h4>
                      <p>Switch between light and dark theme</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="darkMode"
                      checked={themeSettings.darkMode}
                      onChange={handleThemeChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">compact</span>
                    <div>
                      <h4>Compact Mode</h4>
                      <p>Reduce spacing for more content</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="compactMode"
                      checked={themeSettings.compactMode}
                      onChange={handleThemeChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">animation</span>
                    <div>
                      <h4>Animations</h4>
                      <p>Enable UI animations and transitions</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="animations"
                      checked={themeSettings.animations}
                      onChange={handleThemeChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Font Size</h3>
              </div>
              <div className="font-size-selector">
                <button
                  className={`font-size-btn ${themeSettings.fontSize === "small" ? "active" : ""}`}
                  onClick={() => !isEditing ? null : setThemeSettings({ ...themeSettings, fontSize: "small" })}
                  disabled={!isEditing}
                >
                  <span className="material-symbols-outlined">text_decrease</span>
                  Small
                </button>
                <button
                  className={`font-size-btn ${themeSettings.fontSize === "medium" ? "active" : ""}`}
                  onClick={() => !isEditing ? null : setThemeSettings({ ...themeSettings, fontSize: "medium" })}
                  disabled={!isEditing}
                >
                  <span className="material-symbols-outlined">text_fields</span>
                  Medium
                </button>
                <button
                  className={`font-size-btn ${themeSettings.fontSize === "large" ? "active" : ""}`}
                  onClick={() => !isEditing ? null : setThemeSettings({ ...themeSettings, fontSize: "large" })}
                  disabled={!isEditing}
                >
                  <span className="material-symbols-outlined">text_increase</span>
                  Large
                </button>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Primary Color</h3>
              </div>
              <div className="color-picker">
                <div className="color-presets">
                  <button
                    className={`color-preset ${themeSettings.primaryColor === "#13ec5b" ? "active" : ""}`}
                    style={{ backgroundColor: "#13ec5b" }}
                    onClick={() => !isEditing ? null : setThemeSettings({ ...themeSettings, primaryColor: "#13ec5b" })}
                    disabled={!isEditing}
                  ></button>
                  <button
                    className={`color-preset ${themeSettings.primaryColor === "#3b82f6" ? "active" : ""}`}
                    style={{ backgroundColor: "#3b82f6" }}
                    onClick={() => !isEditing ? null : setThemeSettings({ ...themeSettings, primaryColor: "#3b82f6" })}
                    disabled={!isEditing}
                  ></button>
                  <button
                    className={`color-preset ${themeSettings.primaryColor === "#8b5cf6" ? "active" : ""}`}
                    style={{ backgroundColor: "#8b5cf6" }}
                    onClick={() => !isEditing ? null : setThemeSettings({ ...themeSettings, primaryColor: "#8b5cf6" })}
                    disabled={!isEditing}
                  ></button>
                  <button
                    className={`color-preset ${themeSettings.primaryColor === "#ec4899" ? "active" : ""}`}
                    style={{ backgroundColor: "#ec4899" }}
                    onClick={() => !isEditing ? null : setThemeSettings({ ...themeSettings, primaryColor: "#ec4899" })}
                    disabled={!isEditing}
                  ></button>
                  <button
                    className={`color-preset ${themeSettings.primaryColor === "#f59e0b" ? "active" : ""}`}
                    style={{ backgroundColor: "#f59e0b" }}
                    onClick={() => !isEditing ? null : setThemeSettings({ ...themeSettings, primaryColor: "#f59e0b" })}
                    disabled={!isEditing}
                  ></button>
                </div>
                {isEditing && (
                  <div className="custom-color">
                    <label>Custom Color</label>
                    <input
                      type="color"
                      name="primaryColor"
                      value={themeSettings.primaryColor}
                      onChange={handleThemeChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== TEAM SETTINGS ===== */}
        {activeTab === "team" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Team Management</h2>
              <p>Manage team members and permissions</p>
              <button className="add-member-btn">
                <span className="material-symbols-outlined">person_add</span>
                Add Member
              </button>
            </div>

            <div className="team-list">
              {teamMembers.map((member) => (
                <div key={member.id} className="team-member-card">
                  <div className="member-avatar">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      <div className="member-initials">{getInitials(member.name)}</div>
                    )}
                  </div>
                  <div className="member-info">
                    <h4>{member.name}</h4>
                    <p>{member.role}</p>
                    <span className="member-email">{member.email}</span>
                  </div>
                  <div className="member-permissions">
                    <span className={`permission-badge ${member.permissions}`}>
                      {member.permissions}
                    </span>
                    <span className={`status-badge ${member.status}`}>
                      {member.status}
                    </span>
                  </div>
                  <div className="member-actions">
                    <button className="member-edit-btn">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button className="member-delete-btn">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SECURITY SETTINGS ===== */}
        {activeTab === "security" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Security Settings</h2>
              <p>Manage your account security and authentication</p>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Password</h3>
              </div>
              <div className="security-password">
                <div className="password-info">
                  <span className="material-symbols-outlined">lock</span>
                  <div>
                    <h4>Password</h4>
                    <p>Last changed 90 days ago</p>
                  </div>
                </div>
                <button className="reset-password-btn" onClick={handleResetPassword}>
                  Reset Password
                </button>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Two-Factor Authentication</h3>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <span className="material-symbols-outlined">verified</span>
                  <div>
                    <h4>Enable 2FA</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="twoFactorAuth"
                    checked={securitySettings.twoFactorAuth}
                    onChange={handleSecurityChange}
                    disabled={!isEditing}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Session Settings</h3>
              </div>
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    {isEditing ? (
                      <select
                        name="sessionTimeout"
                        value={securitySettings.sessionTimeout}
                        onChange={handleSecurityChange}
                        className="form-select"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="240">4 hours</option>
                      </select>
                    ) : (
                      <p className="form-value">{securitySettings.sessionTimeout} minutes</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Password Expiry (days)</label>
                    {isEditing ? (
                      <select
                        name="passwordExpiry"
                        value={securitySettings.passwordExpiry}
                        onChange={handleSecurityChange}
                        className="form-select"
                      >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">365 days</option>
                      </select>
                    ) : (
                      <p className="form-value">{securitySettings.passwordExpiry} days</p>
                    )}
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="material-symbols-outlined">notification_important</span>
                    <div>
                      <h4>Login Alerts</h4>
                      <p>Get notified when someone logs into your account</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="loginAlerts"
                      checked={securitySettings.loginAlerts}
                      onChange={handleSecurityChange}
                      disabled={!isEditing}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== BILLING SETTINGS ===== */}
        {activeTab === "billing" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Billing & Subscription</h2>
              <p>Manage your subscription and payment methods</p>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Current Plan</h3>
              </div>
              <div className="billing-plan">
                <div className="plan-badge enterprise">ENTERPRISE</div>
                <div className="plan-details">
                  <div className="plan-feature">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Unlimited employees</span>
                  </div>
                  <div className="plan-feature">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Advanced analytics</span>
                  </div>
                  <div className="plan-feature">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Priority support</span>
                  </div>
                  <div className="plan-feature">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>API access</span>
                  </div>
                </div>
                <button className="upgrade-btn">Upgrade Plan</button>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Billing Information</h3>
              </div>
              <div className="billing-info">
                <div className="billing-row">
                  <span>Current Plan</span>
                  <strong>{billingSettings.plan}</strong>
                </div>
                <div className="billing-row">
                  <span>Billing Cycle</span>
                  <strong>{billingSettings.billingCycle === "yearly" ? "Yearly" : "Monthly"}</strong>
                </div>
                <div className="billing-row">
                  <span>Next Billing Date</span>
                  <strong>{billingSettings.nextBillingDate}</strong>
                </div>
                <div className="billing-row">
                  <span>Payment Method</span>
                  <strong>{billingSettings.paymentMethod}</strong>
                </div>
                <div className="billing-row">
                  <span>Auto Renew</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="autoRenew"
                      checked={billingSettings.autoRenew}
                      onChange={() => setBillingSettings({ ...billingSettings, autoRenew: !billingSettings.autoRenew })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <button className="update-billing-btn">
                Update Payment Method
              </button>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Invoices</h3>
              </div>
              <div className="invoice-list">
                <div className="invoice-item">
                  <div>
                    <span className="material-symbols-outlined">description</span>
                    <div>
                      <h4>Invoice #INV-2026-001</h4>
                      <p>15 Jan 2026 • ₹45,000</p>
                    </div>
                  </div>
                  <button className="download-btn">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
                <div className="invoice-item">
                  <div>
                    <span className="material-symbols-outlined">description</span>
                    <div>
                      <h4>Invoice #INV-2025-012</h4>
                      <p>15 Dec 2025 • ₹45,000</p>
                    </div>
                  </div>
                  <button className="download-btn">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
                <div className="invoice-item">
                  <div>
                    <span className="material-symbols-outlined">description</span>
                    <div>
                      <h4>Invoice #INV-2025-011</h4>
                      <p>15 Nov 2025 • ₹45,000</p>
                    </div>
                  </div>
                  <button className="download-btn">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </div>
              <button className="view-all-btn">View All Invoices</button>
            </div>
          </div>
        )}

        {/* ===== AUDIT LOGS ===== */}
        {activeTab === "audit" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Audit Logs</h2>
              <p>Track all activities and changes in your account</p>
              <button className="export-logs-btn">
                <span className="material-symbols-outlined">download</span>
                Export Logs
              </button>
            </div>

            <div className="audit-table-container">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="audit-user">
                          <span className="audit-user-initials">
                            {getInitials(log.user)}
                          </span>
                          <span>{log.user}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`audit-action ${log.action.toLowerCase().replace(" ", "-")}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.details}</td>
                      <td>{log.timestamp}</td>
                      <td>
                        <span className="audit-ip">{log.ip}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="audit-pagination">
              <p>Showing 1-4 of 124 logs</p>
              <div className="pagination-controls">
                <button className="pagination-btn" disabled>Previous</button>
                <button className="pagination-btn active">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <button className="pagination-btn">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <span className="material-symbols-outlined warning">warning</span>
              <h2>Delete Account</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="delete-modal-content">
              <p>Are you sure you want to delete your account?</p>
              <p className="warning-text">This action cannot be undone. All data will be permanently lost.</p>
            </div>
            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="delete-confirm-btn" onClick={confirmDelete}>
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;