import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Topbar.css";

const Topbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  const user = {
    name: "Rajesh Kumar",
    role: "Plant Manager",
    initials: "RK",
    avatar: null, // Set to image URL or null
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
    { icon: "inventory_2", label: "Stock", path: "/stock" },
    { icon: "format_list_bulleted", label: "Product List", path: "/products" },
    { icon: "factory", label: "Production", path: "/production" },
    { icon: "payments", label: "Expenses", path: "/expenses" },
    { icon: "badge", label: "Employees", path: "/employees" },
    { icon: "group", label: "Clients", path: "/clients" },
    { icon: "event_available", label: "Attendance", path: "/attendance" },
    { icon: "check_circle", label: "Check", path: "/check" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setOpen(false); // Close dropdown after navigation
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn"); // Clear login status
    console.log("Logging out...");
    navigate("/login");
  };

  // Handle click outside to close dropdown
  useEffect(() => {
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown when Escape key is pressed
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
        {/* Left Section: Greeting & Date */}
        {/* Left Section: Logo */}
        {/* Left Section: Intentional Blank */}
        <div className="topbar-left-auto"></div>

        {/* Right Section: Notification & Profile */}
        <div className="topbar-right-modern">

          {/* Notification Button */}
          <button className="icon-circle" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className="notification-dot"></span>
          </button>

          <div className="v-divider"></div>

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

              <div className="profile-avatar-modern">
                {user.initials}
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
                  <div className="dropdown-user-header">
                    <h4>{user.name}</h4>
                    <p>{user.role}</p>
                    <div className="dropdown-divider"></div>
                  </div>
                )}

                {/* Nav Items only on Mobile inside profile dropdown */}
                {isMobile && navItems.map((item) => (
                  <div
                    key={item.label}
                    className="dropdown-item"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}

                {isMobile && <div className="dropdown-divider"></div>}

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