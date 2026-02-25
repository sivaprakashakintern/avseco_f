import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/avs.png";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [popupTop, setPopupTop] = useState(0);
  const [popupLeft, setPopupLeft] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
      if (window.innerWidth > 1024) {
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

  const user = {
    name: "Rajesh Kumar",
    role: "Plant Manager",
    initials: "RK",
    avatar: null,
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    console.log("Logging out...");
    navigate("/login");
  };

  // ===== NAVIGATION ITEMS WITH CORRECT PATHS =====
  const navItems = [
    { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
    { icon: "inventory_2", label: "Stock", path: "/stock" },
    { icon: "format_list_bulleted", label: "Product List", path: "/products" },

    // ✅ PRODUCTION - SUB-MENU
    {
      icon: "factory",
      label: "Production",
      path: "/production",
      children: [
        { label: "Production Plan", path: "/production/plan" },
        { label: "Daily Production", path: "/production/daily" }
      ]
    },

    { icon: "sell", label: "Sales", path: "/sales" },
    {
      icon: "payments",
      label: "Expenses",
      path: "/expenses",
      children: [
        { label: "Daily Expenses", path: "/expenses" },
        { label: "Expense Report", path: "/expenses/report" }
      ]
    },
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
        <div className="mobile-header-bar">
          <div className="mobile-logo-left" onClick={handleLogoClick}>
            <img src={logo} alt="AVSECO" className="mobile-header-logo" />
          </div>
          <div className="mobile-profile-right" onClick={toggleMobileMenu}>
            <div className="mobile-avatar-trigger">
              {user.initials}
            </div>
          </div>
        </div>
      )}

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
          <div className="logo-container" onClick={handleLogoClick}>
            <img src={logo} alt="AVSECO Logo" className="logo-full logo-boost" />
          </div>
          {isMobile && (
            <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Navigation to Profile - Mobile Only */}
        {isMobile && (
          <div className="sidebar-profile-box-compact">
            <div
              className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
              onClick={() => handleNavigation('/profile')}
            >
              <span className="material-symbols-outlined">person</span>
              <p className="nav-text">Profile</p>
            </div>
          </div>
        )}

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
                    onClick={() => toggleSubMenu(item.label)}
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

        {/* Sidebar Footer with Logout - Mobile Only */}
        {isMobile && (
          <div className="sidebar-footer">
            <div className="logout-item" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              <span className="nav-text">Logout</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;