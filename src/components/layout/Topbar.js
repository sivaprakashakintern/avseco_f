import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Topbar.css";
import logo from "../../assets/avs.png"; // Company logo

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

  const handleNavigation = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    // Add your logout logic here
  };

  // Handle logo click - navigate to dashboard
  const handleLogoClick = (e) => {
    e.stopPropagation();
    navigate("/dashboard");
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
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => {
              setTimeout(() => {
                if (!dropdownRef.current?.matches(':hover')) {
                  setOpen(false);
                }
              }, 100);
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
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
              >
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