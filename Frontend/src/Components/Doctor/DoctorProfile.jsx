import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLogin } from "../LoginContext/LoginContext";
import { API_BASE } from "../Config/config";
import "../Profile/Profile.css";
import "./ReportModal.css";

const BASE_URL = "http://localhost:5000";

function ReportModal({ scan, index, onClose }) {
 const handlePrint = () => {
  const printContent = document.getElementById("printable-report").innerHTML;
  const printWindow = window.open("", "_blank", "width=800,height=900");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>LungCare Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Inter, sans-serif;
            color: #0d3741;
            padding: 48px;
            background: white;
          }
          .report-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e4fbf6;
          }
          .report-logo {
            font-size: 1.8rem;
            font-weight: 800;
            color: #0d9488;
          }
          .report-meta p {
            margin: 4px 0;
            font-size: 0.88rem;
            color: #556973;
          }
          .report-section {
            margin-bottom: 28px;
          }
          .report-section h3 {
            margin: 0 0 14px;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 0.78rem;
            font-weight: 700;
          }
          .report-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .report-grid div {
            background: #f1fffc;
            border: 1px solid rgba(13,148,136,0.2);
            border-radius: 12px;
            padding: 16px 18px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .report-grid span {
            font-size: 0.75rem;
            color: #556973;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .report-grid strong {
            font-size: 1.1rem;
            color: #0d3741;
            font-weight: 700;
          }
          .diagnosis { color: #0d9488 !important; }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(13,148,136,0.2);
          }
          .report-table th {
            background: #0d9488;
            color: white;
            padding: 13px 18px;
            text-align: left;
            font-size: 0.88rem;
          }
          .report-table td {
            padding: 13px 18px;
            border-bottom: 1px solid rgba(13,148,136,0.08);
            color: #0d3741;
            font-size: 0.95rem;
          }
          .report-table tr:nth-child(even) td { background: #f7fffc; }
          .report-table tr:last-child td { border-bottom: none; }
          .report-footer {
            margin-top: 24px;
            padding: 14px 18px;
            background: #fef9f0;
            border-radius: 10px;
            border-left: 4px solid #f59e0b;
          }
          .report-footer p {
            font-size: 0.84rem;
            color: #78716c;
            line-height: 1.7;
          }
        </style>
      </head>
      <body>${printContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Lung Cancer Report</h2>
            <p>Scan #{index + 1} &nbsp;|&nbsp; {new Date(scan.date).toLocaleString()}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" id="printable-report">
          <div className="report-top">
            <div className="report-logo">🫁 LungCare</div>
            <div className="report-meta">
              <p><b>Date:</b> {new Date(scan.date).toLocaleString()}</p>
              <p><b>Report No:</b> #{index + 1}</p>
            </div>
          </div>

          <div className="report-section">
            <h3>Patient Information</h3>
            <div className="report-grid">
              <div><span>Patient Name</span><strong>{scan.result?.patientName || "N/A"}</strong></div>
              <div><span>Final Diagnosis</span><strong className="diagnosis">{scan.result?.diagnosis || "N/A"}</strong></div>
            </div>
          </div>

          <div className="report-section">
            <h3>AI Model Results</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Prediction</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>ResNet50</td><td>{scan.result?.resnet50 || "N/A"}</td></tr>
                <tr><td>VGG16</td><td>{scan.result?.vgg16 || "N/A"}</td></tr>
                <tr><td>InceptionV3</td><td>{scan.result?.inceptionv3 || "N/A"}</td></tr>
                <tr><td>Hybrid Model</td><td>{scan.result?.advancedcnn || "N/A"}</td></tr>
              </tbody>
            </table>
          </div>

          {/* <div className="report-footer">
            <p>This report was generated by the LungCare AI System. Please consult a medical professional for final diagnosis.</p>
          </div> */}
        </div>

        <div className="modal-actions">
          <button className="btn-print" onClick={handlePrint}>🖨️ Print / Save as PDF</button>
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function DoctorProfile() {
  const { logout } = useLogin();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ username: "", bio: "" });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setError("Please log in again."); setLoading(false); return; }
      const res = await axios.get(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setFormData({ username: res.data.username || "", bio: res.data.bio || "" });
    } catch (fetchError) {
      setError(fetchError.response?.data?.error || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_BASE}/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setEditing(false);
    } catch {
      setError("Unable to save profile changes.");
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    const uploadForm = new FormData();
    uploadForm.append("profileImage", imageFile);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/profile/upload-image`, uploadForm, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setProfile({ ...profile, profileImage: res.data.profileImage });
      setImageFile(null);
    } catch {
      setError("Unable to upload image.");
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <span>Loading clinical profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <section className="profile-container">
        <div className="profile-header"><div><p className="eyebrow">Clinical Dashboard</p><h1>Doctor profile unavailable</h1></div></div>
        <div className="notification-card"><p>{error || "Unable to load profile."}</p></div>
      </section>
    );
  }

  const totalScans = profile.scanHistory?.length || 0;
  const professionalTitle = profile.bio || "Pulmonary Radiologist";
  const joinedDate = new Date(profile.createdAt).toLocaleDateString();

  return (
    <section className="profile-container">
      {/* Report Modal */}
      {selectedScan && (
        <ReportModal
          scan={selectedScan}
          index={selectedIndex}
          onClose={() => { setSelectedScan(null); setSelectedIndex(null); }}
        />
      )}

      <div className="profile-header">
        <div>
          <p className="eyebrow">Clinical Dashboard</p>
          <h1>{profile.username || profile.email}</h1>
          <p className="subtitle">Medical profile for managing CT scan history, patient insights, and clinical activity.</p>
        </div>
        <div className="hero-card">
          <span>Profile activated</span>
          <strong>{joinedDate}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <aside className="profile-card">
          <div className="avatar-wrap">
            <img
              src={profile.profileImage ? `${BASE_URL}${profile.profileImage}` : "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=250&q=80"}
              alt="Doctor Profile"
              className="profile-avatar"
            />
            <span className="avatar-badge">Doctor</span>
          </div>

          <div className="profile-summary">
            <h2>{profile.username || profile.email}</h2>
            <p className="title">{professionalTitle}</p>
            <p className="email">{profile.email}</p>
          </div>

          <div className="stat-block">
            <div><span>Total CT scans</span><strong>{totalScans}</strong></div>
            <div><span>Predictions recorded</span><strong>{totalScans}</strong></div>
          </div>

          <div className="action-group">
            <label className="upload-label">
              Update profile photo
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            </label>
            {imageFile && (
              <button onClick={handleImageUpload} className="button button-primary">Upload Image</button>
            )}
            <button onClick={() => setEditing(!editing)} className="button button-outline">
              {editing ? "Cancel edit" : "Edit profile"}
            </button>
            <button onClick={logout} className="button button-secondary">Sign out</button>
          </div>
        </aside>

        <main className="main-panel">
          <div className="metric-grid">
            <div className="metric-card">
              <h3>Clinical Activity</h3>
              <p className="metric-value">{totalScans}</p>
              <span>Recent CT scans processed</span>
            </div>
            <div className="metric-card">
              <h3>Patient Cases</h3>
              <p className="metric-value">{totalScans}</p>
              <span>Cases logged this month</span>
            </div>
            <div className="metric-card">
              <h3>Current Status</h3>
              <p className="metric-value">Active</p>
              <span>Available for consultations</span>
            </div>
          </div>

          {editing && (
            <section className="edit-panel">
              <div className="panel-header">
                <h2>Edit Profile</h2>
                <p>Update your clinician details and professional summary.</p>
              </div>
              <div className="form-row">
                <label>Full name
                  <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </label>
              </div>
              <div className="form-row">
                <label>Specialization / Bio
                  <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
                </label>
              </div>
              <button onClick={handleUpdate} className="button button-primary">Save changes</button>
            </section>
          )}

          <section className="history-panel">
            <div className="panel-header">
              <h2>CT Scan History</h2>
              <p>Click any scan to view the full report.</p>
            </div>
            {totalScans === 0 ? (
              <div className="empty-state">
                <p>No scan history available. Upload the first CT scan to begin tracking clinical outcomes.</p>
              </div>
            ) : (
              <ul className="history-list">
                {profile.scanHistory.map((scan, index) => (
                  <li
                    key={index}
                    className="history-item clickable"
                    onClick={() => { setSelectedScan(scan); setSelectedIndex(index); }}
                  >
                    <div>
                      <strong>{new Date(scan.date).toLocaleString()}</strong>
                      <p>
                        <b>Patient:</b> {scan.result?.patientName || "Unknown"} &nbsp;|&nbsp;
                        <b>Diagnosis:</b> {scan.result?.diagnosis || "N/A"}
                      </p>
                      <p style={{ fontSize: "0.85em", color: "#888" }}>
                        ResNet50: {scan.result?.resnet50} &nbsp;|&nbsp;
                        VGG16: {scan.result?.vgg16} &nbsp;|&nbsp;
                        InceptionV3: {scan.result?.inceptionv3} &nbsp;|&nbsp;
                        Hybrid: {scan.result?.advancedcnn}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <span>Scan #{totalScans - index}</span>
                      <span className="view-btn">View Report →</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </section>
  );
}

export default DoctorProfile;