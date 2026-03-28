import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import './NotificationsPage.css';

const NotificationsPage = () => {
    const { notifications, markNotificationAsRead, setToast } = useAppContext();
    const [filter, setFilter] = useState('all'); // 'all', 'unread'
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [respondedIds, setRespondedIds] = useState(new Set()); // Track local responses

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'attendance': return 'person_check';
            case 'sale': return 'shopping_cart';
            case 'production': return 'factory';
            case 'admin_push': return 'campaign';
            case 'feedback': return 'thumbs_up_down';
            case 'response': return 'reply';
            default: return 'notifications';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const submitResponse = async (id, status) => {
        setIsSubmitting(true);
        try {
            const { notificationApi } = (await import('../../utils/api.js'));
            await notificationApi.respond(id, { status, reason: status === 'problem' ? reason : 'Acknowledge OK' });
            
            setRespondedIds(prev => new Set([...prev, id]));
            setReason('');
            setToast({ 
                message: "Response sent successfully", 
                type: "success",
                icon: "check_circle"
            });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error("Response Error:", err);
            setToast({ message: "Failed to send response", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ntp-container">
            {/* ── Banner Header ───────────────────────────────────── */}
            <div className="ntp-banner">
                <div className="ntp-banner-info">
                    <h1 className="ntp-banner-title">Notifications Center</h1>
                </div>
            </div>

            {/* ── Filters ────────────────────────────────────────── */}
            <div className="ntp-filter-bar">
                <div className="ntp-tabs">
                    <button 
                        className={`ntp-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Activity
                        <span className="ntp-count">{notifications.length}</span>
                    </button>
                    <button 
                        className={`ntp-tab ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Unread
                        <span className={`ntp-count ${notifications.some(n => !n.isRead) ? 'unread' : ''}`}>
                            {notifications.filter(n => !n.isRead).length}
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Notification List ──────────────────────────────── */}
            <div className="ntp-list">
                {filteredNotifications.length === 0 ? (
                    <div className="ntp-empty">
                        <div className="ntp-empty-icon">
                            <span className="material-symbols-outlined">notifications_paused</span>
                        </div>
                        <h3>No notifications found</h3>
                        <p>You're all caught up! New alerts will appear here.</p>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => {
                        const isResponded = respondedIds.has(notif._id) || notif.type === 'response';
                        const isFeedback = notif.type === 'feedback';
                        
                        return (
                            <div 
                                key={notif._id} 
                                className={`ntp-card ${!notif.isRead ? 'is-unread' : ''}`}
                                onClick={() => {
                                    if (!notif.isRead) markNotificationAsRead(notif._id);
                                }}
                            >
                                <div className={`ntp-icon-box ${notif.type}`}>
                                    <span className="material-symbols-outlined">{getIcon(notif.type)}</span>
                                </div>

                                <div className="ntp-content">
                                    <div className="ntp-header">
                                        <div className="ntp-type-tag">
                                            {isFeedback ? 'MESSAGE' : notif.type.replace('_', ' ')}
                                        </div>
                                        <span className="ntp-time">{formatDate(notif.createdAt)}</span>
                                    </div>

                                    <h4 className="ntp-title">
                                        {isFeedback ? 'System Message' : notif.title}
                                    </h4>
                                    <p className="ntp-msg">{notif.message}</p>
                                    
                                    <div className="ntp-footer">
                                        {notif.sender && (
                                            <div className="ntp-sender-info">
                                                <div className="ntp-avatar">{notif.sender.name.charAt(0)}</div>
                                                <span>From: <strong>{notif.sender.name}</strong></span>
                                            </div>
                                        )}

                                        <div className="ntp-actions">
                                            {!isResponded && !isFeedback && (
                                                <>
                                                    <button 
                                                        className="ntp-btn-ok"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            submitResponse(notif._id, 'ok');
                                                        }}
                                                        disabled={isSubmitting}
                                                    >
                                                        <span className="material-symbols-outlined">done</span>
                                                        OK
                                                    </button>

                                                    <button 
                                                        className="ntp-btn-refresh"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setToast({ 
                                                                message: "Notification updated", 
                                                                type: "info",
                                                                icon: "sync" 
                                                            });
                                                            setTimeout(() => setToast(null), 2000);
                                                        }}
                                                        disabled={isSubmitting}
                                                    >
                                                        <span className="material-symbols-outlined">sync</span>
                                                        Refresh
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!notif.isRead && <div className="ntp-unread-glow"></div>}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;

