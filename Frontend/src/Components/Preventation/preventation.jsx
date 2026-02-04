import React from "react";
import "./Prevention.css"; // <-- import CSS file

const Prevention = () => {
  const tips = [
    {
      title: "Quit Smoking",
      desc: "Avoid smoking completely or seek professional help to quit. Even exposure to secondhand smoke increases risk.",
      icon: "🚭",
    },
    {
      title: "Eat Healthy",
      desc: "Include colorful fruits, vegetables, and whole grains to boost lung health and immunity.",
      icon: "🥦",
    },
    {
      title: "Exercise Regularly",
      desc: "Physical activity improves lung capacity and overall strength.",
      icon: "🏃‍♂",
    },
    {
      title: "Test for Radon Gas",
      desc: "Have your home tested for radon, a natural radioactive gas linked to lung cancer.",
      icon: "🏠",
    },
    {
      title: "Protect at Work",
      desc: "Use masks and protective gear if you’re exposed to dust, chemicals, or fumes.",
      icon: "🧤",
    },
    {
      title: "Get Regular Checkups",
      desc: "Consult a doctor if you experience respiratory symptoms or have a family history of cancer.",
      icon: "👨‍⚕",
    },
  ];

  return (
    <div className="prevention-container">
      <section className="prevention-section">
        <h1 className="prevention-title">Prevention of Lung Cancer</h1>
        <p className="prevention-subtitle">
          Prevention is better than cure — simple lifestyle choices can make a big difference.
        </p>

        <div className="prevention-grid">
          {tips.map((item, index) => (
            <div key={index} className="prevention-card">
              <div className="prevention-icon">{item.icon}</div>
              <h3 className="prevention-heading">{item.title}</h3>
              <p className="prevention-desc">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="learn-more">
          <a href="/contact" className="learn-more-btn">
            Learn More & Stay Protected
          </a>
        </div>
      </section>
    </div>
  );
};

export default Prevention;