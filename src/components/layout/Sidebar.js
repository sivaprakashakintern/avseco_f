import React, { useState, useEffect, useContext } from "react";
import AppContext from "../../context/AppContext.js";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/avs.png";
import avatar from "../../assets/avatar.png";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isMobileMenuOpen, setIsMobileMenuOpen } = useContext(AppContext);
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
    name: "Arun Kumar",
    role: "Plant Manager",
    initials: "AK",
    avatar: avatar,
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

          {/* Profile & Logout - Visible Only on Mobile Menu */}
          {isMobile && (
            <div className="sidebar-mobile-footer">
              <div className="sidebar-nav-divider"></div>

              <div className="mobile-profile-info" onClick={() => handleNavigation('/profile')} style={{ cursor: 'pointer' }}>
                <div className="mobile-profile-avatar-container">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="mobile-profile-avatar" />
                  ) : (
                    <span className="mobile-avatar-initials">{user.initials}</span>
                  )}
                </div>
                <div className="mobile-profile-details">
                  <span className="mobile-profile-name">{user.name}</span>
                  <span className="mobile-profile-role">{user.role}</span>
                </div>
              </div>

              <div className="nav-item logout-item-mobile" onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
                <p className="nav-text">Logout</p>
              </div>
            </div>
          )}
        </nav>
      </aside >
    </>
  );
};

export default Sidebar;