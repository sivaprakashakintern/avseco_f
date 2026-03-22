import React, { useState } from 'react';
import axios from '../utils/axiosConfig';
import './ProfilePasswordModal.css';

const ProfilePasswordModal = ({ isOpen, onClose }) => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (passwords.newPassword.length < 6) {
      return setError('New password must be at least 6 characters long.');
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      return setError('New passwords do not match.');
    }

    setLoading(true);
    try {
      await axios.put('/auth/update-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      setSuccess(true);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="password-modal profile-pass-modal">
        <button className="modal-dismiss-btn" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="modal-header-premium">
          <div className="header-icon-box profile-icon">
             <span className="material-symbols-outlined header-icon">lock_open</span>
          </div>
          <div className="header-text-box">
            <h2>Update Security</h2>
            <p>Enter your current password to set a new one for your account.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">Password updated successfully!</div>}
          
          <div className="input-group">
            <label>Current Password</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">vpn_key</span>
              <input 
                type="password" 
                name="oldPassword"
                value={passwords.oldPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                required
              />
            </div>
          </div>

          <div className="pass-divider"></div>

          <div className="input-group">
            <label>New Password</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">lock</span>
              <input 
                type="password" 
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Confirm New Password</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">lock_reset</span>
              <input 
                type="password" 
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat new password"
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn profile-submit" disabled={loading || success}>
            {loading ? 'Verifying...' : success ? 'Updated!' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePasswordModal;
