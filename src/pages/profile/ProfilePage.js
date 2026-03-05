import React, { useState } from "react";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: "Arjun Kumar",
    jobRole: "Senior Production Supervisor",
    email: "arjun.kumar@avseco.com",
    // Keep profileImage in state just in case it's needed later or for initials logic
    profileImage: null
  });

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
    console.log("Profile saved:", profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return "AK";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="profile-page-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-left">
          <h1 className="profile-title">Employee Profile</h1>
        </div>

        <div className="profile-header-actions">
          {!isEditing ? (
            <button className="edit-profile-btn" onClick={handleEditToggle}>
              <span className="material-symbols-outlined">edit</span>
              Edit Profile
            </button>
          ) : (
            <>
              <button className="save-profile-btn" onClick={handleSave}>
                <span className="material-symbols-outlined">save</span>
                Save
              </button>
              <button className="cancel-profile-btn" onClick={handleCancel}>
                <span className="material-symbols-outlined">close</span>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Simplified Profile Content - Centered */}
      <div className="profile-main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div className="profile-avatar-card" style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center' }}>

          {/* Avatar */}
          <div className="profile-avatar" style={{ margin: '0 auto 24px' }}>
            {profileData.profileImage ? (
              <img
                src={profileData.profileImage}
                alt={profileData.fullName}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-initials-circle" style={{ width: '100px', height: '100px', fontSize: '36px' }}>
                {getInitials(profileData.fullName)}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="info-field" style={{ marginBottom: '20px' }}>
            <label className="field-label" style={{ display: 'block', marginBottom: '8px', color: '#64748b' }}>Full Name</label>
            {isEditing ? (
              <input
                type="text"
                name="fullName"
                value={profileData.fullName}
                onChange={handleInputChange}
                className="field-input"
                style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
              />
            ) : (
              <h2 className="profile-name" style={{ margin: 0, fontSize: '24px' }}>{profileData.fullName}</h2>
            )}
          </div>

          {/* Position */}
          <div className="info-field" style={{ marginBottom: '20px' }}>
            <label className="field-label" style={{ display: 'block', marginBottom: '8px', color: '#64748b' }}>Position</label>
            {isEditing ? (
              <input
                type="text"
                name="jobRole"
                value={profileData.jobRole}
                onChange={handleInputChange}
                className="field-input"
                style={{ textAlign: 'center', fontSize: '16px' }}
              />
            ) : (
              <p className="profile-role" style={{ margin: 0, fontSize: '18px', color: '#006A4E' }}>{profileData.jobRole}</p>
            )}
          </div>

          {/* Email */}
          <div className="info-field">
            <label className="field-label" style={{ display: 'block', marginBottom: '8px', color: '#64748b' }}>Email Address</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                className="field-input"
                style={{ textAlign: 'center' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b' }}>
                <span className="material-symbols-outlined">mail</span>
                <span>{profileData.email}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;