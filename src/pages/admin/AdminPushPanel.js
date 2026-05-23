import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { notificationApi } from '../../utils/api.js';
import './AdminPushPanel.css';

const AdminPushPanel = () => {
    const { employees } = useAppContext();
    const [recipientId, setRecipientId] = useState('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }
    const { canEdit } = useAuth();

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title || !message) {
            setStatus({ type: 'error', msg: 'Please fill in all fields' });
            return;
        }

        setIsSending(true);
        setStatus(null);
        try {
            await notificationApi.sendPush({
                recipientId,
                title,
                message,
                link: '/notifications'
            });
            setStatus({ type: 'success', msg: 'Notification sent successfully!' });
            setTitle('');
            setMessage('');
            setRecipientId('all');
        } catch (error) {
            setStatus({ type: 'error', msg: error.response?.data?.message || 'Failed to send notification' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="admin-push-container">
            <div className="premium-header-green att-header">
                <div className="header-left-group">
                    <h1 className="page-title-white">Broadcast Center</h1>
                </div>
            </div>

            <div className="push-main-content">
                {!canEdit && (
                    <div className="status-message info" style={{ marginBottom: '20px' }}>
                        <span className="material-symbols-outlined">visibility</span>
                        View-only access is enabled. You can browse this page, but sending notifications is disabled.
                    </div>
                )}
                <div className="push-card-premium">
                    <div className="push-card-header-new">
                        <span className="material-symbols-outlined header-icon">campaign</span>
                        <div className="header-text">
                            <h2>Draft Notification</h2>
                            <p>Send a global alert or private message</p>
                        </div>
                    </div>

                    <form className="push-form-refined" onSubmit={handleSend}>
                        <div className="form-grid-new">
                            <div className="form-group-refined">
                                <label>Target Audience</label>
                                <div className="input-with-icon">
                                    <span className="material-symbols-outlined input-icon">group</span>
                                    <select 
                                        value={recipientId} 
                                        onChange={(e) => setRecipientId(e.target.value)}
                                        className="push-select-refined"
                                    >
                                        <option value="all">All Employees</option>
                                        {employees.filter(e => e.role !== 'admin').map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group-refined">
                                <label>Notification Title</label>
                                <div className="input-with-icon">
                                    <span className="material-symbols-outlined input-icon">label</span>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., General Announcement" 
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="push-input-refined"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group-refined full-width">
                            <label>Message Content</label>
                            <div className="textarea-with-icon">
                                <span className="material-symbols-outlined input-icon">chat_bubble</span>
                                <textarea 
                                    placeholder="Type your message here..." 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="push-textarea-refined"
                                    rows="4"
                                />
                            </div>
                        </div>

                        {status && (
                            <div className={`push-status-refined ${status.type}`}>
                                <span className="material-symbols-outlined">
                                    {status.type === 'success' ? 'check_circle' : 'error'}
                                </span>
                                {status.msg}
                            </div>
                        )}

                        <div className="push-footer-refined">
                            <button 
                                type="submit" 
                                className="btn-send-push-premium" 
                                disabled={isSending || !canEdit}
                            >
                                {isSending ? (
                                    <>
                                        <span className="material-symbols-outlined spinning">sync</span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">send</span>
                                        Dispatch Notification
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminPushPanel;
