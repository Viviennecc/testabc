import React, { useState, useEffect } from "react";
import { encryptData } from "./utils/encryption";

const Profile = ({ isOpen, onClose, onSave }) => {
  const [profileData, setProfileData] = useState({
    loginName: "",
    username: "",
    email: "",
    password: "",
    dateOfBirth: "",
    bgValue: "",
    hasChangedUsername: false, // Tracking the one-time change
  });

  // Load current user data from localStorage on open
  useEffect(() => {
    if (isOpen) {
      const currentUserName = localStorage.getItem("currentUser");
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userData = users.find((u) => u.username === currentUserName);

      if (userData) {
        setProfileData({
          ...userData,
          password: "", // Don't show the encrypted password in the input
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const currentUserName = localStorage.getItem("currentUser");

    const userIndex = users.findIndex((u) => u.username === currentUserName);

    if (userIndex !== -1) {
      const updatedUser = { ...users[userIndex] };

      // Update basic info
      updatedUser.email = profileData.email;
      updatedUser.dateOfBirth = profileData.dateOfBirth;

      // Logic: One-time username change
      if (
        profileData.username !== updatedUser.username &&
        !updatedUser.hasChangedUsername
      ) {
        updatedUser.username = profileData.username;
        updatedUser.hasChangedUsername = true;
        localStorage.setItem("currentUser", updatedUser.username); // Update session
      }

      // Logic: Update password if provided
      if (profileData.password && profileData.password.length >= 4) {
        updatedUser.password = await encryptData(profileData.password);
      }

      users[userIndex] = updatedUser;
      localStorage.setItem("users", JSON.stringify(users));
      alert("Profile updated successfully!");
      if (onSave) onSave(updatedUser);
      onClose();
    }
  };

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modal: {
      backgroundColor: "#fff",
      padding: "2rem",
      borderRadius: "8px",
      maxWidth: "450px",
      width: "100%",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    },
    input: {
      width: "100%",
      padding: "10px",
      marginTop: "5px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      boxSizing: "border-box",
    },
    field: { marginBottom: "15px" },
    label: { fontWeight: "bold", fontSize: "0.9rem" },
    readOnly: {
      backgroundColor: "#f9f9f9",
      color: "#666",
      cursor: "not-allowed",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ textAlign: "center" }}>User Profile</h2>

        {/* Login Name - Always Read Only */}
        <div style={styles.field}>
          <label style={styles.label}>Login ID (Permanent)</label>
          <input
            type="text"
            value={profileData.loginName}
            style={{ ...styles.input, ...styles.readOnly }}
            disabled
          />
        </div>

        {/* Username - One time change logic */}
        <div style={styles.field}>
          <label style={styles.label}>Display Username</label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) =>
              setProfileData({ ...profileData, username: e.target.value })
            }
            style={
              profileData.hasChangedUsername
                ? { ...styles.input, ...styles.readOnly }
                : styles.input
            }
            disabled={profileData.hasChangedUsername}
          />
          {profileData.hasChangedUsername && (
            <small style={{ color: "orange" }}>
              Username can only be changed once.
            </small>
          )}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData({ ...profileData, email: e.target.value })
            }
            style={{ ...styles.input, ...styles.readOnly }}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Date of Birth</label>
          <input
            type="date"
            value={profileData.dateOfBirth}
            onChange={(e) =>
              setProfileData({ ...profileData, dateOfBirth: e.target.value })
            }
            style={{ ...styles.input, ...styles.readOnly }}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            New Password (Leave blank to keep current)
          </label>
          <input
            type="password"
            placeholder="Min 4 characters"
            onChange={(e) =>
              setProfileData({ ...profileData, password: e.target.value })
            }
            style={styles.input}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "10px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            style={{
              flex: 2,
              padding: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
