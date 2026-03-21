import React, { useState } from 'react';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { logout } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await axios.put('/auth/change-password', { newPassword });
      alert('Password updated successfully! Please log in again with your new password.');
      logout(); // Force re-login after password change
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="password-modal">
        <div className="modal-header-premium">
          <div className="header-icon-box">
             <span className="material-symbols-outlined header-icon">verified_user</span>
          </div>
          <div className="header-text-box">
            <h2>Secure Your Account</h2>
            <p>This is your first time logging in with these credentials. For your security, please set a new password.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          
          <div className="input-group">
            <label>New Password</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">lock</span>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new secure password"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">lock_reset</span>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
