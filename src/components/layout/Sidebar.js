import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import logo from "../../assets/avs.png";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [popupTop, setPopupTop] = useState(0);
  const [popupLeft, setPopupLeft] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isMobileMenuOpen) {
        const sidebar = document.querySelector(".sidebar");
        const hamburger = document.querySelector(".mobile-hamburger");

        if (
          sidebar &&
          !sidebar.contains(event.target) &&
          hamburger &&
          !hamburger.contains(event.target)
        ) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isMobileMenuOpen]);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogoClick = () => {
    navigate("/dashboard");
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // ===== NAVIGATION ITEMS WITH CORRECT PATHS =====
  const navItems = [
    { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
    { icon: "inventory_2", label: "Stock", path: "/stock" },
    { icon: "format_list_bulleted", label: "Product List", path: "/products" },

    // ✅ PRODUCTION - CORRECT PATH (ROUTE, NOT FILENAME)
    { icon: "factory", label: "Production", path: "/production/plan" },

    { icon: "payments", label: "Expenses", path: "/expenses" },
    { icon: "badge", label: "Employees", path: "/employees" },
    { icon: "group", label: "Clients", path: "/clients" },

    // ATTENDANCE SUB-MENU (Now Hover/Popup based via CSS)
    {
      icon: "event_available",
      label: "Attendance",
      path: "/attendance",
      isSubmenu: true, // Flag for specific styling
      children: [
        { label: "Daily Log", path: "/attendance" },
        { label: "Attendance Report", path: "/attendance-report" }
      ]
    },

    // CHECK SYSTEM STATUS
    {
      icon: "check_circle",
      label: "Check",
      path: "/check",
      apiStatus: true // Green dot indicator
    },
  ];

  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleSubMenu = (label) => {
    if (expandedMenu === label) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(label);
    }
  };

  return (
    <>
      {isMobile && (
        <button
          className={`mobile-hamburger ${isMobileMenuOpen ? "active" : ""}`}
          onClick={toggleMobileMenu}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      )}

      {isMobile && isMobileMenuOpen && (
        <div
          className="mobile-overlay active"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`sidebar ${isMobile ? "mobile" : ""} ${isMobileMenuOpen ? "mobile-open" : ""
          }`}
      >
        <div className="sidebar-header" onClick={handleLogoClick}>
          <img src={logo} alt="AVSECO Logo" className="logo-full" />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
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
                    onClick={() => isMobile && toggleSubMenu(item.label)}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <p className="nav-text">{item.label}</p>
                    <span className="material-symbols-outlined branch-icon">
                      {isMobile ? (expandedMenu === item.label ? "expand_less" : "expand_more") : "chevron_right"}
                    </span>
                  </div>

                  {/* Popup Submenu */}
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

                  {/* API Status Indicator for Reports */}
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
      </aside>
    </>
  );
};

export default Sidebar;