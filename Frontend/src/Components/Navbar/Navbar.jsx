// Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiUserCircle } from "react-icons/bi";
import { useLogin } from "../LoginContext/LoginContext"; // adjust path if needed
import "./Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false); // hamburger
  const [menuOpen, setMenuOpen] = useState(false); // user dropdown
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const hideTimeout = useRef(null);
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useLogin();

  const handleLogout = () => {
    try {
      if (typeof logout === "function") logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    setMenuOpen(false);
    navigate("/login");
  };

  // Open immediately (mouse enter or focus)
  const openNow = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setMenuOpen(true);
  };

  // Close with a small delay (gives time to move pointer to the menu)
  const closeWithDelay = (delay = 180) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      setMenuOpen(false);
      hideTimeout.current = null;
    }, delay);
  };

  // Toggle on click (touch friendly)
  const toggleMenu = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setMenuOpen((s) => !s);
  };

  // Click outside or Escape to close
  useEffect(() => {
    function onDocClick(e) {
      const container = menuRef.current;
      const trigger = triggerRef.current;
      if (
        container &&
        !container.contains(e.target) &&
        trigger &&
        !trigger.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            LungCare
          </Link>
        </div>

        <ul className={`nav-links ${isOpen ? "open" : ""}`}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/symptoms">Symptoms</Link></li>
          <li><Link to="/prevention">Prevention</Link></li>
          <li><Link to="/research">Research</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/upload">Lung-Scan</Link></li>
        </ul>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div
              className="user-block"
              onMouseEnter={openNow}
              onMouseLeave={() => closeWithDelay(180)}
            >
              <button
                ref={triggerRef}
                className="user-btn"
                onClick={toggleMenu}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                type="button"
              >
                <BiUserCircle size={20} />
                <span className="user-email">{user?.email}</span>
                <span className={`chev ${menuOpen ? "open" : ""}`}>▾</span>
              </button>

              <div
                ref={menuRef}
                className={`user-dropdown ${menuOpen ? "show" : ""}`}
                role="menu"
                aria-hidden={!menuOpen}
                onMouseEnter={openNow}
                onMouseLeave={() => closeWithDelay(180)}
              >
                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                >
                  Profile
                </Link>
                <button
                  className="dropdown-item logout-btn"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-icon" title="Login">
              <BiUserCircle size={22} />
            </Link>
          )}
        </div>

        <div
          className={`hamburger ${isOpen ? "toggle" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
