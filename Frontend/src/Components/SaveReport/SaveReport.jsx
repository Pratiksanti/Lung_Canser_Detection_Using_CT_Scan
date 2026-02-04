import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SaveReport.css";

function SaveReport() {
  const [results, setResults] = useState(null);

  const [patientName, setPatientName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [scanImage, setScanImage] = useState(null);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem("modelResults");
    if (data) {
      setResults(JSON.parse(data));
    }
  }, []);

  const handleSave = async () => {
    // ✅ VALIDATION
    if (!patientName.trim()) {
      setMessage("❌ Please enter patient name");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setMessage("❌ Enter a valid 10-digit mobile number");
      return;
    }

    if (!address.trim()) {
      setMessage("❌ Please enter address");
      return;
    }

    if (!scanImage) {
      setMessage("❌ Please upload CT scan image");
      return;
    }

    try {
      // ✅ FormData (REQUIRED for image upload)
      const formData = new FormData();
      formData.append("patientName", patientName);
      formData.append("mobileNumber", mobileNumber);
      formData.append("address", address);
      formData.append("scanImage", scanImage);

      // Model results as strings
     formData.append("ResNet50", JSON.stringify(results.ResNet50));
     formData.append("VGG16", JSON.stringify(results.VGG16));
     formData.append("InceptionV3", JSON.stringify(results.InceptionV3));
     formData.append("finalCase", results.final_case);

      const res = await fetch("http://localhost:5000/api/report/save", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        setMessage("❌ Backend error");
        return;
      }

      const data = await res.json();
      setMessage("✅ Report and image saved successfully");
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error while saving report");
    }
  };

  if (!results) {
    return <h2 style={{ textAlign: "center" }}>No result data found</h2>;
  }

  return (
    <div className="save-report-page">
      <h1>Save Lung Cancer Report</h1>

      <div className="save-form">
        <input
          type="text"
          placeholder="Patient Name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Mobile Number"
          value={mobileNumber}
          maxLength={10}
          onChange={(e) =>
            setMobileNumber(e.target.value.replace(/\D/g, ""))
          }
        />

        <textarea
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        {/* IMAGE UPLOAD */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setScanImage(e.target.files[0])}
        />
      </div>

      {/* BUTTONS */}
      <div className="action-buttons">
        <button className="back-btn" onClick={() => navigate(-1)}>
          Back to Results
        </button>

        <button className="save-btn" onClick={handleSave}>
          Save Report
        </button>
      </div>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
}

export default SaveReport;
