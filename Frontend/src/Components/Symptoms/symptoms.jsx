import React from "react";
import "./Symptoms.css";

const Symptoms = () => {
  const symptoms = [
    {
      title: "Persistent Cough",
      desc: "A long-lasting cough that worsens over time may be one of the earliest signs of lung cancer.",
      icon: "💨",
    },
    {
      title: "Chest Pain",
      desc: "Pain or discomfort in the chest, especially when breathing deeply, coughing, or laughing.",
      icon: "❤‍🔥",
    },
    {
      title: "Shortness of Breath",
      desc: "Even light activities can cause you to feel winded or out of breath.",
      icon: "🌬",
    },
    {
      title: "Coughing Up Blood",
      desc: "Small amounts of blood or rust-colored sputum can be a warning sign.",
      icon: "🩸",
    },
    {
      title: "Hoarseness",
      desc: "A change in your voice or constant hoarseness may indicate pressure on vocal nerves.",
      icon: "🗣",
    },
    {
      title: "Frequent Infections",
      desc: "Recurring bronchitis or pneumonia can sometimes be linked to underlying lung problems.",
      icon: "🦠",
    },
  ];

  return (
    <div className="symptoms-container">
      <section className="symptoms-section">
        <h1 className="symptoms-title">Symptoms of Lung Cancer</h1>
        <p className="symptoms-subtitle">
          Early detection saves lives. Know the signs and act quickly.
        </p>

        <div className="symptoms-grid">
          {symptoms.map((item, index) => (
            <div key={index} className="symptom-card">
              <div className="symptom-icon">{item.icon}</div>
              <h3 className="symptom-heading">{item.title}</h3>
              <p className="symptom-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Symptoms;