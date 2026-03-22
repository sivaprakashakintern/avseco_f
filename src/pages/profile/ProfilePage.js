import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.js";
import ProfilePasswordModal from "../../components/ProfilePasswordModal.jsx";

import { formatDate } from "../../utils/dateUtils.js";

const ProfilePage = () => {
    const { user: authUser, isAdmin } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);

    const [profileData, setProfileData] = useState({
        fullName: authUser?.name || "Member Name",
        jobRole: authUser?.role || "Staff Member",
        email: authUser?.email || "member@avseco.com",
        phone: authUser?.phone || "Not Set",
        empId: authUser?.empId || "EMP-000000",
        department: authUser?.department || "General",
        profileImage: authUser?.profileImage || null,
        address: authUser?.address || "Not Set",
        joinDate: authUser?.joinDate || "Not Set"
    });

    // Sync with authUser when it changes
    useEffect(() => {
        if (authUser) {
            setProfileData({
                fullName: authUser.name,
                jobRole: authUser.role,
                email: authUser.email,
                phone: authUser.phone || "Not Set",
                empId: authUser.empId,
                department: authUser.department,
                profileImage: authUser.profileImage,
                address: authUser.address || "Not Set",
                joinDate: authUser.joinDate
            });
        }
    }, [authUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData({
            ...profileData,
            [name]: value
        });
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = () => {
        setIsEditing(false);
        // Here you would typically call an API to update the profile
        console.log("Profile saved:", profileData);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const getInitials = (name) => {
        if (!name) return "AV";
        return name
            .split(" ")
            .filter(Boolean)
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="profile-page-modern">
            {/* Header Section */}
            <div className="profile-hero-section">
                <div className="hero-content">
                    <div className="profile-avatar-wrapper">
                        {profileData.profileImage ? (
                            <img src={profileData.profileImage} alt={profileData.fullName} className="hero-avatar" />
                        ) : (
                            <div className="hero-avatar-initials">{getInitials(profileData.fullName)}</div>
                        )}
                        <div className="status-indicator online"></div>
                    </div>
                    <div className="hero-text">
                        <h1 className="hero-name">{profileData.fullName}</h1>
                        <p className="hero-role-badge">{profileData.jobRole}</p>
                    </div>
                </div>
                
                {isAdmin && (
                    <div className="hero-actions">
                        {!isEditing ? (
                            <button className="glass-btn edit-btn" onClick={handleEditToggle}>
                                <span className="material-symbols-outlined">edit_square</span>
                                Edit Profile
                            </button>
                        ) : (
                            <div className="edit-group">
                                <button className="glass-btn save-btn" onClick={handleSave}>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Save Changes
                                </button>
                                <button className="glass-btn cancel-btn" onClick={handleCancel}>
                                    <span className="material-symbols-outlined">cancel</span>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Info Grid */}
            <div className="profile-info-grid">
                {/* ID Card / Quick Info */}
                <div className="info-card personal-details">
                    <div className="card-header">
                        <span className="material-symbols-outlined">person</span>
                        <h3>Personal Information</h3>
                    </div>
                    <div className="card-body">
                        <div className="detail-item">
                            <label>Full Name</label>
                            {isEditing ? (
                                <input name="fullName" value={profileData.fullName} onChange={handleInputChange} className="profile-input" />
                            ) : (
                                <span>{profileData.fullName}</span>
                            )}
                        </div>
                        <div className="detail-item">
                            <label>Employee ID</label>
                            <span>{profileData.empId}</span>
                        </div>
                        <div className="detail-item">
                            <label>Department</label>
                            <span>{profileData.department}</span>
                        </div>
                        <div className="detail-item">
                            <label>Joining Date</label>
                            <span>{formatDate(profileData.joinDate)}</span>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="info-card contact-details">
                    <div className="card-header">
                        <span className="material-symbols-outlined">contact_emergency</span>
                        <h3>Contact Details</h3>
                    </div>
                    <div className="card-body">
                        <div className="detail-item">
                            <label>Email Address</label>
                            {isEditing ? (
                                <input name="email" type="email" value={profileData.email} onChange={handleInputChange} className="profile-input" />
                            ) : (
                                <span>{profileData.email}</span>
                            )}
                        </div>
                        <div className="detail-item">
                            <label>Phone Number</label>
                            {isEditing ? (
                                <input name="phone" value={profileData.phone} onChange={handleInputChange} className="profile-input" />
                            ) : (
                                <span>{profileData.phone}</span>
                            )}
                        </div>
                        <div className="detail-item">
                            <label>Residential Address</label>
                            {isEditing ? (
                                <textarea name="address" value={profileData.address} onChange={handleInputChange} className="profile-input area" />
                            ) : (
                                <p className="address-text">{profileData.address}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Permissions Section (Read Only) */}
                <div className="info-card status-details">
                    <div className="card-header">
                        <span className="material-symbols-outlined">verified_user</span>
                        <h3>System Access</h3>
                    </div>
                    <div className="card-body">
                        <div className="access-info">
                            <div className="status-pill active-status">
                                <span className="dot"></span>
                                Account Active
                            </div>
                            <div className="role-label">
                                Role: <strong>{profileData.jobRole}</strong>
                            </div>
                            <button 
                                className="change-pass-profile-btn"
                                onClick={() => setIsPassModalOpen(true)}
                            >
                                <span className="material-symbols-outlined">lock_reset</span>
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ProfilePasswordModal 
                isOpen={isPassModalOpen} 
                onClose={() => setIsPassModalOpen(false)} 
            />
            
            {!isAdmin && (
                <div className="admin-notice">
                    <span className="material-symbols-outlined">info</span>
                    <p>Profile editing is restricted to administrators. Contact HR for any corrections.</p>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;