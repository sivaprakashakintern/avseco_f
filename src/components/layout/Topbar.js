import React, { useState } from "react";
import "./Navbar.css";

const Topbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar-fixed">
      <div className="topbar-inner">
        <div className="search-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            className="search-input-modern"
            placeholder="Search orders, stock, or employees..."
            type="text"
          />
        </div>

        <div className="topbar-right-modern">
          <button className="icon-circle">
            <span className="material-symbols-outlined">notifications</span>
            <span className="notification-badge"></span>
          </button>

          <button className="icon-circle">
            <span className="material-symbols-outlined">help_outline</span>
          </button>

          <div className="v-divider"></div>

          <div
            className="profile-modern"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <div className="profile-text-modern">
              <p className="profile-name">Rajesh Kumar</p>
              <p className="profile-role">Plant Manager</p>
            </div>

            <div className="profile-avatar-modern"></div>

            {open && (
              <div className="profile-dropdown">
                <div className="dropdown-item">
                  <span className="material-symbols-outlined">person</span>
                  <span>Profile</span>
                </div>
                <div className="dropdown-item">
                  <span className="material-symbols-outlined">settings</span>
                  <span>Settings</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout">
                  <span className="material-symbols-outlined">logout</span>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;