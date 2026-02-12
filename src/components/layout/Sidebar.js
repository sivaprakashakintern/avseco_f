import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isMobileMenuOpen) {
        const sidebar = document.querySelector('.sidebar');
        const hamburger = document.querySelector('.mobile-hamburger');
        
        if (sidebar && !sidebar.contains(event.target) && 
            hamburger && !hamburger.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileMenuOpen]);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (label) => {
    const path = location.pathname;
    switch(label) {
      case 'Dashboard': return path === '/' || path === '/dashboard';
      case 'Stock': return path === '/stock';
      case 'Product List': return path === '/products';
      case 'Stock Purchased': return path === '/purchased';
      case 'Employees': return path === '/employees';
      case 'Clients': return path === '/clients';
      case 'Attendance': return path === '/attendance';
      case 'Reports': return path === '/reports';
      default: return false;
    }
  };

  const getRoutePath = (label) => {
    switch(label) {
      case 'Dashboard': return '/dashboard';
      case 'Stock': return '/stock';
      case 'Product List': return '/products';
      case 'Stock Purchased': return '/purchased';
      case 'Employees': return '/employees';
      case 'Clients': return '/clients';
      case 'Attendance': return '/attendance';
      case 'Reports': return '/reports';
      default: return '/';
    }
  };

  const navItems = [
    { icon: "dashboard", label: "Dashboard" },
    { icon: "inventory_2", label: "Stock" },
    { icon: "format_list_bulleted", label: "Product List" },
    { icon: "shopping_cart", label: "Stock Purchased" },
    { icon: "badge", label: "Employees" },
    { icon: "group", label: "Clients" },
    { icon: "event_available", label: "Attendance" },
    { icon: "description", label: "Reports" },
  ];

  return (
    <>
      {isMobile && (
        <button 
          className={`mobile-hamburger ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Menu"
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

      <aside className={`sidebar ${isMobile ? 'mobile' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <span className="material-symbols-outlined logo-icon">factory</span>
          </div>
          <div className="company-text">
            <h1 className="company-name">AVSECO</h1>
            <p className="company-subtitle">Manufacturing ERP</p>
          </div>
          
          {isMobile && isMobileMenuOpen && (
            <button 
              className="mobile-close"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`nav-item ${isActive(item.label) ? 'active' : ''}`}
              onClick={() => handleNavigation(getRoutePath(item.label))}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <p className="nav-text">{item.label}</p>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}; 

export default Sidebar;