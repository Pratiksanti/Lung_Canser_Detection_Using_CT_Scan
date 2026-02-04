// Research.jsx
import React, { useState } from "react";
import "./Research.css";

const tabs = ["Overview", "Dataset", "Model", "Results", "Future"];

export default function Research() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="research-root">
      {/* HERO */}
      <header className="research-hero-new">
        <h1>LungCare</h1>
        <p>
          Lung Cancer Detection using Hybrid Deep Learning and MERN Architecture
        </p>
      </header>

      {/* GLASS PANEL */}
      <section className="research-panel">
        {/* TABS */}
        <nav className="research-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={tab === activeTab ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* CONTENT */}
        <div className="research-content-new">
          {activeTab === "Overview" && <Overview />}
          {activeTab === "Dataset" && <Dataset />}
          {activeTab === "Model" && <Model />}
          {activeTab === "Results" && <Results />}
          {activeTab === "Future" && <Future />}
        </div>
      </section>
    </div>
  );
}

/* ---------------- TAB SECTIONS ---------------- */

function Overview() {
  return (
    <>
      <h2>Project Overview</h2>
      <p>
        Lung cancer is one of the leading causes of cancer-related deaths due to
        late diagnosis. Manual interpretation of CT scans is time-consuming and
        prone to error.
      </p>
      <p>
        <strong>LungCare</strong> is a deep learning–based decision support system
        that automatically classifies lung CT scan images into
        <strong> Normal</strong>, <strong>Benign</strong>, and
        <strong> Malignant</strong> categories using a hybrid CNN approach.
      </p>

      <div className="highlight-box">
        <span>Technology Stack</span>
        <ul>
          <li>Deep Learning: Python, TensorFlow/Keras</li>
          <li>Frontend: React.js</li>
          <li>Backend: Node.js & Express</li>
          <li>Database: MongoDB</li>
        </ul>
      </div>
    </>
  );
}

function Dataset() {
  return (
    <>
      <h2>Dataset & Preprocessing</h2>
      <p>
        The system uses the <strong>IQ-OTH-NCCD</strong> lung cancer dataset,
        collected from the Iraq Oncology Teaching Hospital.
      </p>

      <div className="timeline">
        <div className="step">
          <span>01</span>
          <p>CT scan image collection</p>
        </div>
        <div className="step">
          <span>02</span>
          <p>Resize images to 224 × 224</p>
        </div>
        <div className="step">
          <span>03</span>
          <p>Normalization & augmentation</p>
        </div>
        <div className="step">
          <span>04</span>
          <p>Train–validation split</p>
        </div>
      </div>
    </>
  );
}

function Model() {
  return (
    <>
      <h2>Hybrid Model Architecture</h2>
      <p>
        The proposed system uses a <strong>hybrid CNN architecture</strong> that
        combines the strengths of multiple pretrained models.
      </p>

      <div className="model-grid">
        <div className="model-card">
          <h3>VGG16</h3>
          <p>Extracts low-level spatial features</p>
        </div>
        <div className="model-card">
          <h3>ResNet50</h3>
          <p>Deep residual learning for complex patterns</p>
        </div>
        <div className="model-card">
          <h3>InceptionV3</h3>
          <p>Multi-scale feature extraction</p>
        </div>
      </div>

      <p className="note">
        Extracted features are fused and passed to fully connected layers for
        final classification.
      </p>
    </>
  );
}

function Results() {
  return (
    <>
      <h2>Experimental Results</h2>

      <div className="results-grid">
        <div>
          <span>Accuracy</span>
          <strong>92%</strong>
        </div>
        <div>
          <span>Precision</span>
          <strong>90%</strong>
        </div>
        <div>
          <span>Recall</span>
          <strong>89%</strong>
        </div>
        <div>
          <span>F1-Score</span>
          <strong>89.5%</strong>
        </div>
      </div>

      <p className="note">
        The hybrid model outperforms single CNN models such as VGG-only networks
        in classification accuracy.
      </p>
    </>
  );
}

function Future() {
  return (
    <>
      <h2>Limitations & Future Work</h2>

      <ul className="future-list">
        <li>System is not a replacement for clinical diagnosis</li>
        <li>Performance depends on CT image quality</li>
        <li>Requires large-scale clinical validation</li>
      </ul>

      <div className="highlight-box">
        <span>Future Enhancements</span>
        <ul>
          <li>3D CNN-based volumetric CT analysis</li>
          <li>Grad-CAM explainability for clinicians</li>
          <li>Multi-hospital dataset integration</li>
        </ul>
      </div>
    </>
  );
}
