import React, { useState, useEffect, useContext } from "react";
import AppContext from "../../context/AppContext.js";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/avs.png";
import { useAuth } from "../../context/AuthContext.js";

import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAccess, isAdmin } = useAuth();

  const { isMobileMenuOpen, setIsMobileMenuOpen, setLoading } = useContext(AppContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [popupTop, setPopupTop] = useState(0);
  const [popupLeft, setPopupLeft] = useState(0);

  // ... (keep existing useEffects)

  // ===== NAVIGATION ITEMS WITH CORRECT PATHS =====
  const navItems = [
    { icon: "dashboard", label: "Dashboard", path: "/dashboard", module: "dashboard" },
    { icon: "inventory_2", label: "Stock", path: "/stock", module: "stock" },
    { icon: "format_list_bulleted", label: "Products", path: "/products", module: "products" },

    // ✅ PRODUCTION - SUB-MENU
    {
      icon: "factory",
      label: "Production",
      path: "/production",
      module: "production",
      children: [
        { label: "Daily Production", path: "/production/daily" },
        { label: "Production Plan", path: "/production/plan" }
      ]
    },

    { icon: "sell", label: "Sales", path: "/sales", module: "sales" },
    {
      icon: "payments",
      label: "Expenses",
      path: "/expenses",
      module: "stock",
      children: [
        { label: "Daily Expenses", path: "/expenses" },
        { label: "Expense Report", path: "/expenses/report" }
      ]
    },
    { icon: "badge", label: "Employees", path: "/employees", module: "employees" },
    { icon: "group", label: "Clients", path: "/clients", module: "clients" },

    // ATTENDANCE SUB-MENU (Now Hover/Popup based via CSS)
    {
      icon: "event_available",
      label: "Attendance",
      path: "/attendance",
      module: "attendance",
      isSubmenu: true, // Flag for specific styling
      children: [
        { label: "Daily Log", path: "/attendance" },
        { label: "Attendance Report", path: "/attendance-report" }
      ]
    },
  ];

  // Filter items based on access
  const filteredNavItems = navItems.filter(item => hasAccess(item.module));

  // Add Admin items if admin
  if (isAdmin) {
    filteredNavItems.push({
      icon: "admin_panel_settings",
      label: "Admin",
      path: "/admin/manage-access",
      module: "admin",
      children: [
        { label: "Manage Access", path: "/admin/manage-access" }
      ]
    });
  }

  // Add Check Status for all (it's a system utility)
  filteredNavItems.push({
    icon: "check_circle",
    label: "Check",
    path: "/check",
    apiStatus: true // Green dot indicator
  });

  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleSubMenu = (item) => {
    if (item.children && item.children.length > 0) {
      // On mobile: just expand/collapse the submenu — do NOT navigate
      setExpandedMenu(prev => prev === item.label ? null : item.label);
    } else {
      // No children: navigate directly
      handleNavigation(item.path);
    }
  };

  return (
    <>

      {isMobile && isMobileMenuOpen && (
        <div
          className="mobile-overlay active"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`sidebar ${isMobile ? "mobile" : ""} ${isMobileMenuOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-header">
          <div className="logo-container logo-container-mobile-fix" onClick={handleLogoClick}>
            <img src={logo} alt="AVSECO Logo" className="logo-full logo-mobile-enhanced" />
          </div>
          {isMobile && (
            <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>


        <nav className="sidebar-nav">
          {filteredNavItems.map((item) => (
            <React.Fragment key={item.label}>
              {item.children ? (
                // Parent Item with Submenu (Hover/Popup)
                <div
                  className={`nav-group popup-group ${isActive(item.path) || location.pathname.includes(item.path) ? "active-group" : ""}`}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      setExpandedMenu(item.label);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPopupTop(rect.top);
                      setPopupLeft(rect.right);
                    }
                  }}
                  onMouseLeave={() => !isMobile && setExpandedMenu(null)}
                >
                  <div
                    className={`nav-item ${isActive(item.path) || location.pathname.includes(item.path) ? "active" : ""}`}
                    onClick={() => toggleSubMenu(item)}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <p className="nav-text">{item.label}</p>
                    <span className="material-symbols-outlined branch-icon">
                      {isMobile ? (expandedMenu === item.label ? "expand_less" : "expand_more") : "chevron_right"}
                    </span>
                  </div>

                  {/* Submenu Logic */}
                  {(expandedMenu === item.label) && (
                    <div
                      className={`submenu ${!isMobile ? 'popup-menu' : ''}`}
                      style={!isMobile ? { top: popupTop, left: popupLeft, position: 'fixed', marginLeft: 0 } : {}}
                    >
                      {item.children.map((sub) => (
                        <div
                          key={sub.label}
                          className={`submenu-item ${isActive(sub.path) ? "active" : ""}`}
                          onClick={() => handleNavigation(sub.path)}
                        >
                          <span className="submenu-text">{sub.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Regular Item
                <div
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <p className="nav-text">{item.label}</p>

                  {/* API Status Indicator */}
                  {item.apiStatus !== undefined && (
                    <span
                      className={`api-status-dot ${item.apiStatus ? "connected" : "disconnected"}`}
                      title={item.apiStatus ? "API Connected" : "API Error"}
                    ></span>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}


        </nav>
      </aside >
    </>
  );
};

export default Sidebar;