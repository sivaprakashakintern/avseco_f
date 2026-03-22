import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Yes, Delete All', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="warning-icon-bg">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <h3>{title}</h3>
        </div>
        
        <div className="modal-body">
          <p>{message}</p>
        </div>
        
        <div className="modal-footer footer-spaced">
          <button className="btn-cancel-flat" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn-confirm-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
