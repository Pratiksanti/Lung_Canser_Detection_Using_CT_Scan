import React from "react";
import "./HomeContent.css";
import lungImage from "../images/Lung.jpg";
import Symptoms from "../Symptoms/symptoms";
import Prevention from "../Preventation/preventation";

function HomeContent() {
  return (
    <>
      <section className="home">

        {/* -------- HERO SECTION -------- */}
        <header className="hero">
          <div className="hero-text">
            <h1>Lung Cancer Awareness</h1>
            <p>
              Lung cancer is one of the leading causes of cancer-related deaths worldwide.
              Spreading awareness, encouraging early diagnosis, and supporting research
              can save countless lives.
            </p>

            <button className="learn-btn">Learn More</button>
          </div>

          <div className="hero-image">
            <img 
              src={lungImage}
              alt="Lung Cancer Awareness Illustration"
            />
          </div>
        </header>

        {/* -------- INFO CARDS SECTION -------- */}
        <main className="info-cards">

          {/* Symptoms Section */}
          <article id="symptoms" className="card">
            <h3>Symptoms</h3>
            <p>
              Persistent cough, chest pain, shortness of breath, and unexplained weight loss
              are early warning signs of lung cancer.
            </p>
          </article>

          {/* Prevention Section */}
          <article id="prevention" className="card">
            <h3>Prevention</h3>
            <p>
              Avoid smoking, minimize exposure to air pollution, and maintain a balanced
              diet and regular exercise routine to lower your risk.
            </p>
          </article>

          {/* Support Section */}
          <article className="card">
            <h3>Support</h3>
            <p>
              Early screening, proper medical consultation, and emotional support from
              family and friends play a key role in recovery.
            </p>
          </article>

        </main>
      </section>

      {/* Render full detailed pages below section */}
      <Symptoms />
      <Prevention />
    </>
  );
}

export default HomeContent;
