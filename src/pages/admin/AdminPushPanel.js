import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import { notificationApi } from '../../utils/api.js';
import './AdminPushPanel.css';

const AdminPushPanel = () => {
    const { employees } = useAppContext();
    const [recipientId, setRecipientId] = useState('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

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
            <div className="push-banner">
                <div className="push-banner-info">
                    <h1 className="push-banner-title">Broadcast Center</h1>
                </div>
            </div>

            <div className="push-card">
                <form className="push-form" onSubmit={handleSend}>
                    <div className="push-form-row">
                        <div className="form-group">
                            <label>Target Audience</label>
                            <select 
                                value={recipientId} 
                                onChange={(e) => setRecipientId(e.target.value)}
                                className="push-select"
                            >
                                <option value="all">All Employees</option>
                                {employees.filter(e => e.role !== 'admin').map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notification Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g., Attendance Reminder" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="push-input"
                            />
                        </div>
                    </div>

                    {status && (
                        <div className={`push-status ${status.type}`}>
                            <span className="material-symbols-outlined">
                                {status.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                            {status.msg}
                        </div>
                    )}

                    <div className="form-group flex-1">
                        <label>Message Content</label>
                        <div className="push-form-msg-row-unified">
                            <textarea 
                                placeholder="Write your message here..." 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="push-textarea-compact"
                                rows="1"
                            />
                            <button 
                                type="submit" 
                                className="btn-send-push-inline" 
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <span className="material-symbols-outlined spinning">sync</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">send</span>
                                        Send
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminPushPanel;
