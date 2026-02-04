// Contact.jsx
import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../LoginContext/LoginContext";
import { API_BASE } from "../Config/config";
import "./Contact.css";

export default function Contact() {
  const { isAuthenticated, authHeaders } = useLogin();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // showError toggles when user submits invalid form — controls inline error messages
  const [showError, setShowError] = useState(false);

  const isValidEmail = (value) => {
    // simple email regex — good for most use-cases
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validate = () => {
    const errs = {
      name: !name.trim(),
      emailEmpty: !email.trim(),
      emailInvalid: email.trim() ? !isValidEmail(email.trim()) : false,
      message: !message.trim(),
    };

    const hasError =
      errs.name || errs.emailEmpty || errs.emailInvalid || errs.message;

    return { errs, hasError };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // if user not authenticated, ask them to login
    if (!isAuthenticated) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Login required",
        text: "You must be logged in to send a message. Go to login page?",
        showCancelButton: true,
        confirmButtonText: "Yes, login",
        cancelButtonText: "Cancel",
      });
      if (result.isConfirmed) navigate("/login");
      return;
    }

    // validate locally and show inline errors if any
    const { errs, hasError } = validate();
    if (hasError) {
      setShowError(true);
      // show a lightweight toast to complement the inline messages
      Swal.fire({
        icon: "info",
        title: "Validation",
        text: "Please fix the highlighted fields.",
        timer: 1600,
        showConfirmButton: false,
      });
      return;
    }

    setShowError(false);
    setLoading(true);

    try {
      const headers =
        typeof authHeaders === "function"
          ? authHeaders()
          : { Authorization: `Bearer ${localStorage.getItem("token")}` };

      const payload = { name: name.trim(), email: email.trim(), message: message.trim() };

      const res = await axios.post(`${API_BASE}/contact`, payload, { headers });

      if (res.data?.success) {
        Swal.fire("Sent", res.data.message || "Your message was sent.", "success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        Swal.fire("Error", res.data?.message || "Could not send message.", "error");
      }
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || err.message || "Server error.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // validation states used to add error classes and show messages
  const { errs } = validate();
  const nameError = showError && errs.name;
  const emailEmptyError = showError && errs.emailEmpty;
  const emailInvalidError = showError && errs.emailInvalid;
  const messageError = showError && errs.message;

  return (
    <div className="contact-shell">
      <div className="contact-card" role="region" aria-labelledby="contact-heading">
        <div className="contact-header">
          <h2 id="contact-heading">Contact Support</h2>
          <p className="contact-sub">Have questions? Send us a message — we’ll reply soon.</p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="field-row">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (showError) setShowError(false); // clear inline errors while typing
              }}
              aria-invalid={nameError ? "true" : "false"}
              className={nameError ? "error" : ""}
            />
            {nameError && <div className="error-message">Please fill this</div>}
          </div>

          {/* Email */}
          <div className="field-row">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (showError) setShowError(false);
              }}
              aria-invalid={emailEmptyError || emailInvalidError ? "true" : "false"}
              className={emailEmptyError || emailInvalidError ? "error" : ""}
            />
            {emailEmptyError && <div className="error-message">Please fill this</div>}
            {!emailEmptyError && emailInvalidError && (
              <div className="error-message">Please enter a valid email address</div>
            )}
          </div>

          {/* Message */}
          <div className="field-row">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="Explain your question or issue..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (showError) setShowError(false);
              }}
              aria-invalid={messageError ? "true" : "false"}
              className={messageError ? "error" : ""}
            />
            {messageError && <div className="error-message">Please fill this</div>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setName("");
                setEmail("");
                setMessage("");
                setShowError(false);
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
