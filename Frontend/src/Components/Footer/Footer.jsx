import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section">
          <h3>LungCare</h3>
          <p>
            Spreading awareness and knowledge about lung cancer. 
            Together, we can fight and prevent it with the power of information.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Symptoms</a></li>
            <li><a href="#">Prevention</a></li>
            <li><a href="#">Research</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>Email: dyp@lungcare.org</p>
          <p>Phone: +91 7666247188</p>
          <p>Location: DYPCET KOLHAPUR, India</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} LungCare. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
