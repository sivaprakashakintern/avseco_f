import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import ProfilePasswordModal from "../../components/ProfilePasswordModal.jsx";
import { authApi, employeeApi } from "../../utils/api.js";
import { formatDate } from "../../utils/dateUtils.js";
import "./ProfilePage.css";

const ProfilePage = () => {
    const { id: routeId } = useParams();
    const { user: authUser, isAdmin, refreshUser } = useAuth();
    
    const [isEditing, setIsEditing] = useState(false);
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ message: "", type: "" });
    const [errors, setErrors] = useState({});

    // The data being displayed/edited
    const [profileData, setProfileData] = useState({
        _id: "",
        name: "",
        role: "",
        email: "",
        phone: "+91 ",
        empId: "",
        department: "",
        avatar: "",
        address: "",
        joinDate: "",
        dob: ""
    });

    // Helper to determine if we are looking at our own profile
    const isSelf = !routeId || routeId === authUser?._id;
    const canEdit = isSelf || isAdmin;

    // Load Profile Data
    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                let data;
                if (isSelf) {
                    // Use authUser if available, otherwise fetch
                    data = authUser;
                } else {
                    // Fetch other employee
                    data = await employeeApi.getById(routeId);
                }

                if (data) {
                    setProfileData({
                        _id: data._id,
                        name: data.name || "",
                        role: data.role || "Member",
                        email: data.email || "",
                        phone: data.phone || "",
                        empId: data.empId || "EMP-XXXXXX",
                        department: data.department || "General",
                        avatar: data.avatar || "",
                        address: data.address || "",
                        joinDate: data.joinDate || "",
                        dob: data.dob || ""
                    });
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
                showFeedback("⚠️ Failed to load profile details", "error");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [routeId, isSelf, authUser]);

    const showFeedback = (msg, type = "success") => {
        setFeedback({ message: msg, type });
        setTimeout(() => setFeedback({ message: "", type: "" }), 4000);
    };

    const handleInputChange = (e) => {
        let { name, value } = e.target;
        
        if (name === "phone") {
            if (!value.startsWith("+91 ")) {
                value = "+91 " + value.replace(/^\+91\s*/, "");
            }
            const digits = value.slice(4).replace(/\D/g, "").slice(0, 10);
            value = "+91 " + digits;
        }

        setProfileData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSave = async () => {
        // Validation
        if (!profileData.name) {
            setErrors({ name: "Name is required" });
            return;
        }

        try {
            if (isSelf) {
                // Update via self api
                await authApi.updateProfile({
                    name: profileData.name,
                    email: profileData.email,
                    phone: profileData.phone,
                    address: profileData.address,
                    avatar: profileData.avatar,
                    dob: profileData.dob
                });
                await refreshUser();
            } else if (isAdmin) {
                // Admin updating another user via employee api
                await employeeApi.update(routeId, {
                    name: profileData.name,
                    email: profileData.email,
                    phone: profileData.phone,
                    address: profileData.address,
                    avatar: profileData.avatar,
                    dob: profileData.dob
                });
            }
            
            setIsEditing(false);
            showFeedback("✅ Profile updated successfully!");
        } catch (error) {
            console.error("Save error:", error);
            showFeedback(error.response?.data?.message || "❌ Failed to save profile", "error");
        }
    };

    const getInitials = (name) => {
        if (!name) return "AV";
        return name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="profile-loading-screen">
                <div className="profile-loader"></div>
                <p>Syncing Profile Data...</p>
            </div>
        );
    }

    return (
        <div className={`profile-page-modern ${profileData.role === 'admin' ? 'admin-view' : ''} ${isEditing ? 'is-editing-mode' : ''}`}>
            {/* Feedback Toast */}
            {feedback.message && (
                <div className={`profile-toast-modern ${feedback.type}`}>
                    <span className="material-symbols-outlined">
                        {feedback.type === 'error' ? 'report' : 'verified'}
                    </span>
                    {feedback.message}
                </div>
            )}

            {/* Hero Section */}
            <div className="profile-hero-section">
                <div className="hero-content">
                    <div className="profile-avatar-wrapper">
                        {profileData.avatar ? (
                            <img src={profileData.avatar} alt={profileData.name} className="hero-avatar" />
                        ) : (
                            <div className="hero-avatar-initials">{getInitials(profileData.name)}</div>
                        )}
                        <div className="status-indicator online"></div>
                    </div>
                    <div className="hero-text">
                        <h1 className="hero-name">{profileData.name}</h1>
                        <div className="badge-group">
                            <span className="hero-role-badge">{profileData.role}</span>
                            <span className="hero-dept-badge">{profileData.department}</span>
                        </div>
                    </div>
                </div>
                
                {canEdit && (
                    <div className="hero-actions">
                        {!isEditing ? (
                            <button className="glass-btn edit-btn" onClick={() => setIsEditing(true)}>
                                <span className="material-symbols-outlined">edit_note</span>
                                Edit Profile
                            </button>
                        ) : (
                            <div className="edit-group">
                                <button className="glass-btn save-btn" onClick={handleSave}>
                                    <span className="material-symbols-outlined">save_as</span>
                                    Save
                                </button>
                                <button className="glass-btn cancel-btn" onClick={() => setIsEditing(false)}>
                                    <span className="material-symbols-outlined">close</span>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Profile Content */}
            <div className="profile-info-grid">
                {/* Personal Section - Hidden for Admins to simplify */}
                {profileData.role !== 'admin' && (
                    <div className="info-card">
                        <div className="card-header">
                            <span className="material-symbols-outlined">account_circle</span>
                            <h3>Account Identity</h3>
                        </div>
                        <div className="card-body">
                            <div className={`detail-item ${errors.name ? 'error' : ''}`}>
                                <label>Full Name *</label>
                                {isEditing ? (
                                    <input name="name" value={profileData.name} onChange={handleInputChange} className="profile-input" />
                                ) : (
                                    <span>{profileData.name}</span>
                                )}
                                {errors.name && <small className="err-msg">{errors.name}</small>}
                            </div>
                            <div className="detail-item">
                                <label>Employee ID</label>
                                <span className="readonly-val">{profileData.empId}</span>
                            </div>
                            <div className="detail-item">
                                <label>System Designation</label>
                                <span className="readonly-val">{profileData.role}</span>
                            </div>
                            <div className="detail-item">
                                <label>Birth Date</label>
                                {isEditing ? (
                                    <input name="dob" type="date" value={profileData.dob} onChange={handleInputChange} className="profile-input" />
                                ) : (
                                    <span>{profileData.dob || "Not specified"}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Combined / Simplified Section for Admin (Email, Password, Phone) */}
                <div className="info-card">
                    <div className="card-header">
                        <span className="material-symbols-outlined">contact_page</span>
                        <h3>Security & Contact</h3>
                    </div>
                    <div className="card-body">
                        <div className="detail-item">
                            <label>Email Address</label>
                            {isEditing ? (
                                <input name="email" value={profileData.email} onChange={handleInputChange} className="profile-input" />
                            ) : (
                                <span>{profileData.email || "N/A"}</span>
                            )}
                        </div>
                        <div className="detail-item">
                            <label>Phone Number</label>
                            {isEditing ? (
                                <input name="phone" value={profileData.phone} onChange={handleInputChange} className="profile-input" />
                            ) : (
                                <span>{profileData.phone || "Not linked"}</span>
                            )}
                        </div>
                        
                        {/* Always show password button in this section for admins */}
                        {profileData.role === 'admin' && isSelf && (
                             <div className="detail-item password-fix">
                                <label>Account Security</label>
                                <button className="security-action-btn-inline" onClick={() => setIsPassModalOpen(true)}>
                                    <span className="material-symbols-outlined">lock_reset</span>
                                    Change Login Password
                                </button>
                             </div>
                        )}

                        {/* Hide address for admins */}
                        {profileData.role !== 'admin' && (
                            <div className="detail-item">
                                <label>Address Details</label>
                                {isEditing ? (
                                    <textarea name="address" value={profileData.address} onChange={handleInputChange} className="profile-input area" />
                                ) : (
                                    <p className="address-display">{profileData.address || "No address provided"}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Avatar / Settings Section - Hidden for Admins */}
                {(isEditing && profileData.role !== 'admin') && (
                    <div className="info-card avatar-settings-card">
                        <div className="card-header">
                            <span className="material-symbols-outlined">photo_camera</span>
                            <h3>Customization</h3>
                        </div>
                        <div className="card-body">
                            <div className="detail-item">
                                <label>Avatar Image Link</label>
                                <input 
                                    name="avatar" 
                                    placeholder="https://example.com/photo.jpg"
                                    value={profileData.avatar} 
                                    onChange={handleInputChange} 
                                    className="profile-input" 
                                />
                                <small className="hint">Direct URL to your profile picture</small>
                            </div>
                        </div>
                    </div>
                )}

                {/* Account Security - Only shown for non-admins as it was already merged for admins */}
                {profileData.role !== 'admin' && (
                    <div className={`info-card ${isEditing ? 'security-card-compact' : 'security-card-wide'}`}>
                        <div className="card-header">
                            <span className="material-symbols-outlined">shield_person</span>
                            <h3>System Connection</h3>
                        </div>
                        <div className="card-body">
                            <div className="security-belt">
                                <div className="security-info">
                                    <div className="status-indicator-pill">
                                        <span className="pulse-dot"></span>
                                        Operational
                                    </div>
                                    <p className="join-date-inf">Onboarded since: <strong>{formatDate(profileData.joinDate)}</strong></p>
                                </div>
                                {isSelf && (
                                    <button className="security-action-btn" onClick={() => setIsPassModalOpen(true)}>
                                        <span className="material-symbols-outlined">key</span>
                                        Change Password
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ProfilePasswordModal isOpen={isPassModalOpen} onClose={() => setIsPassModalOpen(false)} />
            
            {(!isAdmin && !isSelf) && (
                <div className="restricted-overlay">
                    <span className="material-symbols-outlined">visibility_off</span>
                    <p>Protected Data View</p>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;