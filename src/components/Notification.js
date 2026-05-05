import React, { useEffect } from 'react';
import './Notification.css';

const Notification = ({ message, type, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`simple-notification ${type} ${show ? 'fade-in' : ''}`}>
      <div className="notification-icon">
        {type === 'success' ? '✅' : '❌'}
      </div>
      <div className="notification-text">{message}</div>
    </div>
  );
};

export default Notification;
