import React, { useState } from "react";
import axios from "axios";
import { useLogin } from "../LoginContext/LoginContext";
import { API_BASE } from "../Config/config";
import "./User.css";

function UserProfile() {
  const { user, logout } = useLogin();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async () => {
    setMessage("");
    setError("");

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/profile/change-password`,
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Password changed successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile-container">
      <div className="user-profile-card">

        {/* Avatar */}
        <div className="user-avatar-wrap">
          <div className="user-avatar-circle">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="user-role-badge">User</span>
        </div>

        {/* Email */}
        <div className="user-info-section">
          <h2>My Profile</h2>
          <div className="user-info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{user?.email || "Not available"}</span>
          </div>
          <div className="user-info-row">
            <span className="info-label">Role</span>
            <span className="info-value">User</span>
          </div>
        </div>

        {/* Change Password */}
        <div className="user-password-section">
          <h3>Change Password</h3>

          {message && <p className="success-msg">{message}</p>}
          {error && <p className="error-msg">{error}</p>}

          <div className="user-form-row">
            <label>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
            />
          </div>

          <div className="user-form-row">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
            />
          </div>

          <div className="user-form-row">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
            />
          </div>

          <button
            onClick={handlePasswordChange}
            className="user-btn-primary"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* Sign out */}
        <button onClick={logout} className="user-btn-secondary">
          Sign out
        </button>

      </div>
    </div>
  );
}

export default UserProfile;
