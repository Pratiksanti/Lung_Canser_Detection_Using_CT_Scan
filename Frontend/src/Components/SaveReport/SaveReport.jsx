import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SaveReport.css";

function SaveReport() {
  const [results, setResults] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [scanImageBase64, setScanImageBase64] = useState(null);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("modelResults");
    if (raw) {
      const parsed = JSON.parse(raw);
      console.log("🔍 Model Results Keys:", parsed); // CHECK THIS IN CONSOLE
      setResults(parsed);
    }

    const savedImage = localStorage.getItem("uploadedScanImage");
    if (savedImage) setScanImageBase64(savedImage);
  }, []);

  const base64ToFile = (base64, filename) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleSave = async () => {
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

    if (!scanImageBase64) {
      setMessage("❌ No scan image found. Please upload again.");
      return;
    }

    //  Log exactly what keys exist before validation
    console.log("🔍 results object:", results);
    console.log("🔍 results keys:", results ? Object.keys(results) : "null");

    if (!results) {
      setMessage("❌ Model data missing. Please run prediction again.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      //  Detect the correct hybrid model key automatically
      const hybridKey = results["Hybrid Model"] ? "Hybrid Model" : null;

      console.log("🔍 Hybrid key found:", hybridKey);

      if (!hybridKey) {
        setMessage(
          "❌ Model data missing. Keys: " + Object.keys(results).join(", "),
        );
        return;
      }

      const formData = new FormData();
      formData.append("patientName", patientName);
      formData.append("mobileNumber", mobileNumber);
      formData.append("address", address);

      const imageFile = base64ToFile(scanImageBase64, "scan.jpg");
      formData.append("scanImage", imageFile);

      formData.append("ResNet50", JSON.stringify(results.ResNet50));
      formData.append("VGG16", JSON.stringify(results.VGG16));
      formData.append("InceptionV3", JSON.stringify(results.InceptionV3));
      formData.append("HybridModel", JSON.stringify(results[hybridKey]));
      formData.append("finalCase", results.final_case);

     const res = await fetch("https://lungcanser-backend.onrender.com/api/report/save", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error:", text);
        setMessage("❌ Backend error: " + text);
        return;
      }

      const resData = await res.json();
      console.log("✅ Success:", resData);

      localStorage.removeItem("uploadedScanImage");
      localStorage.removeItem("modelResults");

      setMessage("✅ Report saved successfully!");
      setTimeout(() => navigate("/doctor-profile"), 1500);
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

      {scanImageBase64 && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
            CT Scan Image
          </p>
          <img
            src={scanImageBase64}
            alt="CT Scan"
            style={{
              width: "200px",
              height: "200px",
              objectFit: "cover",
              borderRadius: "10px",
              border: "2px solid #ccc",
            }}
          />
        </div>
      )}

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
          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
        />

        <textarea
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

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
