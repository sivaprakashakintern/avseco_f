import React from 'react';
import ReactDOM from 'react-dom';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Yes, Delete', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <div className="warning-icon-bg">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        
        <div className="confirm-modal-footer">
          <button className="btn-cancel-flat" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn-confirm-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
