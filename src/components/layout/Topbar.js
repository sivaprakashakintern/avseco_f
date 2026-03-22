import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/avs.png";
import AppContext, { useAppContext } from "../../context/AppContext.js";
import { useAuth } from "../../context/AuthContext.js";
import "./Topbar.css";

const Topbar = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useContext(AppContext);
  const { user: authUser, logout } = useAuth();
  const { fetchData } = useAppContext();
  const [open, setOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const user = {
    name: authUser?.name || "User",
    role: authUser?.role || "Staff",
    initials: getInitials(authUser?.name),
    avatar: authUser?.profileImage || authUser?.avatar || null,
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const handleNavigation = (path) => {
    navigate(path);
    setOpen(false); // Close dropdown after navigation
  };

  const handleLogout = () => {
    logout();
    console.log("Logging out...");
    navigate("/login");
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchData();
      // Optional: Add a small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      profileRef.current &&
      !profileRef.current.contains(event.target)
    ) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="topbar-fixed">
      <div className="topbar-inner">
        {/* Mobile Left Section: Hamburger & Logo */}
        {isMobile && (
          <div className="mobile-header-left">
            <button 
              className="mobile-hamburger-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
            >
              <span className="material-symbols-outlined">
                {isMobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
            <div className="mobile-logo-left" onClick={() => navigate("/dashboard")}>
              <img src={logo} alt="AVSECO" className="mobile-header-logo" />
            </div>
          </div>
        )}


        {/* Right Section: Notification & Profile */}
        <div className="topbar-right-modern">

          {/* Refresh Button */}
          <button 
            className="icon-circle" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            aria-label="Refresh Data"
            title="Refresh Data"
          >
            <span className={`material-symbols-outlined ${isRefreshing ? 'spinning' : ''}`}>
              refresh
            </span>
          </button>

          {/* Notification Button */}
          <button className="icon-circle" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className="notification-dot"></span>
          </button>

          {!isMobile && <div className="v-divider"></div>}

          {/* Profile Container - Interactive */}
          <div
            className="profile-container"
            ref={profileRef}
            onClick={() => setOpen(!open)}
            onMouseEnter={() => !isMobile && setOpen(true)}
            onMouseLeave={() => {
              if (!isMobile) {
                setTimeout(() => {
                  if (!dropdownRef.current?.matches(':hover')) {
                    setOpen(false);
                  }
                }, 100);
              }
            }}
          >
            <div className="profile-content">
              <div className="profile-text-hover">
                <span className="profile-name-hover">{user.name}</span>
                <span className="profile-role-hover">{user.role}</span>
              </div>
              <div className="profile-avatar-modern">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="avatar-image-modern" />
                ) : (
                  user.initials
                )}
              </div>
            </div>

            {/* Dropdown Menu */}
            {open && (
              <div
                className="profile-dropdown"
                ref={dropdownRef}
                onMouseEnter={() => !isMobile && setOpen(true)}
                onMouseLeave={() => !isMobile && setOpen(false)}
              >
                {/* User Info Header in Dropdown on Mobile */}
                {isMobile && (
                  <div className="dropdown-user-header" style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{user.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{user.role}</p>
                  </div>
                )}

                <div className="dropdown-item" onClick={() => handleNavigation("/profile")}>
                  <span className="material-symbols-outlined">person</span>
                  <span>My Profile</span>
                </div>
                <div className="dropdown-item logout" onClick={handleLogout}>
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