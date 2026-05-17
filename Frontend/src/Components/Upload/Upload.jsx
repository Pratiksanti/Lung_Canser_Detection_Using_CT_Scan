import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Upload.css";

function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preprocessImg, setPreprocessImg] = useState(null);
  const [preprocessLoading, setPreprocessLoading] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const uploaded = e.target.files[0];
    if (!uploaded) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(uploaded.type)) {
      setMessage("Only JPG and PNG images are allowed.");
      setFile(null);
      return;
    }

    if (uploaded.size > 5 * 1024 * 1024) {
      setMessage("File too large. Max 5MB allowed.");
      setFile(null);
      return;
    }

    setMessage("");
    setFile(uploaded);

    setPreprocessLoading(true);

    const img = new Image();
    img.src = URL.createObjectURL(uploaded);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 224, 224);

      const processedURL = canvas.toDataURL("image/jpeg");
      setPreprocessImg(processedURL);
      setPreprocessLoading(false);
    };
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("scan", file);

    try {
      setLoading(true);

      const res = await fetch("https://pratiksanti-lung-cancer-python.hf.space/predict",  {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (data.error) {
        setMessage(data.error);
        return;
      }

      // Save results
      localStorage.setItem("modelResults", JSON.stringify(data));

      //  Save image as base64 so SaveReport can use it automatically
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem("uploadedScanImage", reader.result);
        navigate("/result");
      };
      reader.readAsDataURL(file);

    } catch (err) {
      console.error(err);
      setMessage("Server not responding");
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <h1 className="main-title">Lung Cancer Detection System</h1>
      <p className="subtitle">Upload your CT scan for prediction</p>

      <div className="upload-card">
        <h2>Upload CT Scan Image</h2>

        <div className="image-row">
          <div className="img-box">
            <h4>Original Image</h4>
            {file ? (
              <img src={URL.createObjectURL(file)} alt="original" />
            ) : (
              <p>No Image Selected</p>
            )}
          </div>

          <div className="img-box">
            <h4>Preprocessed (224 × 224)</h4>
            {preprocessLoading ? (
              <div className="spinner"></div>
            ) : preprocessImg ? (
              <img src={preprocessImg} alt="processed" />
            ) : (
              <p>No Image</p>
            )}
          </div>
        </div>

        <label className="file-label">
          {file ? file.name : "Choose CT Scan Image"}
          <input
            type="file"
            accept="image/*"
            className="file-input"
            onChange={handleFileChange}
          />
        </label>

        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Processing..." : "Upload & Predict"}
        </button>

        {message && <p className="upload-message">{message}</p>}
      </div>
    </div>
  );
}

export default Upload;