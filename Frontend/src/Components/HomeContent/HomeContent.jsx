import {
  FaStar,
  FaMapMarkerAlt,
  FaLungs,
  FaHeartbeat,
  FaShieldAlt,
} from "react-icons/fa";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import "./HomeContent.css";
import doctorImage from "../images/Doctor-Image.png";
import wiinsHospital from "../images/wiins-hospital.jpg";
import sanjivaniHospital from "../images/sanjivani-cancer-centre.jpg";
import curalifeHospital from "../images/curalife-cancer-centre.jpg";
import kolhapurCancerHospital from "../images/kolhapur-cancer-centre.jpg";
import naliniHospital from "../images/nalini-clinic.jpg";


const hospitalData = [
  {
    id: 1,
    name: "Wiins Hospital",
    address: "Main Road, Nagala Park, Kolhapur",
    rating: 4.7,
    status: "Open 24 Hrs",
    statusType: "open",
    image: wiinsHospital,
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Wiins+Hospital+Kolhapur",
  },

  {
    id: 2,
    name: "Sanjivani Cancer Centre",
    address: "Rajarampuri, Kolhapur",
    rating: 5.0,
    status: "Open 24 Hrs",
    statusType: "open",
    image: sanjivaniHospital,
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Sanjivani+Cancer+Centre+Kolhapur",
  },

  {
    id: 3,
    name: "Curalife Cancer Centre",
    address: "8th Lane, Rajarampuri",
    rating: 5.0,
    status: "Available till 8:00 PM",
    statusType: "limited",
    image: curalifeHospital,
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Curalife+Cancer+Centre+Kolhapur",
  },

  {
    id: 4,
    name: "Kolhapur Cancer Centre",
    address: "NH4 Highway, Kolhapur",
    rating: 4.5,
    status: "Open 24 Hrs",
    statusType: "open",
    image: kolhapurCancerHospital,
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Kolhapur+Cancer+Centre",
  },

  {
    id: 5,
    name: "Nalini Superspeciality Clinic",
    address: "6th Lane, Rajarampuri",
    rating: 4.9,
    status: "Available till 8:00 PM",
    statusType: "limited",
    image: naliniHospital,
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Nalini+Superspeciality+Clinic+Kolhapur",
  },
];

const services = [
  {
    icon: <FaLungs />,
    title: "Symptoms",
    desc: "Recognize early warning signs before it's too late.",
    color: "service-blue",
  },
  {
    icon: <FaShieldAlt />,
    title: "Prevention",
    desc: "Build strong habits for lasting lung health.",
    color: "service-pink",
  },
  {
    icon: <FaHeartbeat />,
    title: "Support",
    desc: "Compassionate care at every stage of your journey.",
    color: "service-teal",
  },
];

const causes = [
  { icon: "🚬", label: "Smoking", color: "cause-red" },
  { icon: "🏭", label: "Pollution", color: "cause-gray" },
  { icon: "🧬", label: "Genetics", color: "cause-purple" },
  { icon: "☢️", label: "Radiation", color: "cause-orange" },
];

const steps = [
  { number: "01", label: "Screening", desc: "Regular CT scan checks" },
  { number: "02", label: "Diagnosis", desc: "Biopsy & imaging tests" },
  { number: "03", label: "Treatment", desc: "Personalized care plan" },
  { number: "04", label: "Recovery", desc: "Ongoing support & rehab" },
];

function StarRating({ rating }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar
          key={s}
          className={s <= Math.round(rating) ? "star filled" : "star empty"}
        />
      ))}
      <span className="rating-value">{rating}</span>
    </div>
  );
}

function HomeContent() {
  return (
    <section className="home">
      {/* FLOATING BLOBS */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* ── HERO ── */}
      <header className="hero">
        <div className="hero-text">
          <span className="eyebrow">
            <MdOutlineHealthAndSafety className="eyebrow-icon" /> LungCare
          </span>
          <h1>
            <span className="title-blue">Lung Cancer</span>
            <br />
            <span className="title-pink">Awareness</span>
          </h1>
          <p className="subtitle">
            Early detection saves lives. Discover symptoms, prevention tips, and
            the best care centers near you.
          </p>
          <div className="btn-group">
            <button className="primary-btn">
              <span>Learn More</span>
            </button>
            <button className="secondary-btn">Free Assessment</button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">85%</span>
              <span className="stat-label">Survival with early detection</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">2M+</span>
              <span className="stat-label">Cases diagnosed yearly</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">24/7</span>
              <span className="stat-label">Support available</span>
            </div>
          </div>
        </div>

        <div className="hero-image-wrap">
          <div className="hero-image-ring" />
          <div className="hero-image">
            <img src={doctorImage} alt="Doctor" />
          </div>
          <div className="hero-badge badge-top">
            <FaHeartbeat className="badge-icon" />
            <div>
              <p className="badge-title">Heart Rate</p>
              <p className="badge-value">
                98 <span>bpm</span>
              </p>
            </div>
          </div>
          <div className="hero-badge badge-bottom">
            <FaLungs className="badge-icon" />
            <div>
              <p className="badge-title">Lung Capacity</p>
              <p className="badge-value">Normal</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── SERVICES ── */}
      <section className="services">
        <div className="section-header">
          <span className="section-tag">What We Offer</span>
          <h2>Our Services</h2>
          <p className="section-sub">
            Everything you need to understand, prevent, and fight lung cancer.
          </p>
        </div>
        <div className="service-grid">
          {services.map((s, i) => (
            <div key={i} className={`service-card ${s.color}`}>
              <div className="service-icon-wrap">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <div className="service-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CAUSES ── */}
      <section className="causes">
        <div className="section-header">
          <span className="section-tag">Risk Factors</span>
          <h2>Main Causes</h2>
          <p className="section-sub">
            Understanding risk factors is the first step to prevention.
          </p>
        </div>
        <div className="cause-list">
          {causes.map((c, i) => (
            <div key={i} className={`cause-card ${c.color}`}>
              <span className="cause-emoji">{c.icon}</span>
              <p className="cause-label">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="steps">
        <div className="section-header">
          <span className="section-tag">How It Works</span>
          <h2>Early Detection Path</h2>
          <p className="section-sub">
            A clear path from screening to recovery.
          </p>
        </div>
        <div className="step-container">
          {steps.map((s, i) => (
            <div key={i} className="step-box">
              <span className="step-number">{s.number}</span>
              <h3 className="step-label">{s.label}</h3>
              <p className="step-desc">{s.desc}</p>
              {i < steps.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <span className="cta-tag">Take Action Today</span>
          <h2>Your Lungs Matter</h2>
          <p>
            Don't wait for symptoms. A free assessment takes less than 2
            minutes.
          </p>
          <button className="cta-btn">
            <span>Take Free Test</span>
            <span className="cta-arrow">→</span>
          </button>
        </div>
      </section>

      {/* ── HOSPITALS ── */}
      <section className="doctors-section">
        <div className="section-header">
          <span className="section-tag">Find Care Near You</span>
          <h2>Nearby Cancer Hospitals</h2>
          <p className="section-sub">
            Top-rated centres in Kolhapur ready to help.
          </p>
        </div>
        <div className="doctor-grid">
          {hospitalData.map((h) => (
            <div key={h.id} className="doctor-card">
              <div className="doctor-photo">
                <img src={h.image} alt={h.name} className="doctor-photo-img" />
                <div className="hospital-glow" />
              </div>
              <div className="doctor-content">
                <h3>{h.name}</h3>
                <p className="address">
                  <FaMapMarkerAlt className="addr-icon" /> {h.address}
                </p>
                <StarRating rating={h.rating} />
                <span
                  className={`status-badge ${h.statusType === "open" ? "status-open" : "status-limited"}`}
                >
                  <span className="status-dot" /> {h.status}
                </span>

                <a
                  href={h.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="direction-btn"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

export default HomeContent;