import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../LoginContext/LoginContext";
import "./Login.css";

import { API_BASE } from "./../Config/config";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [role, setRole] = useState("user"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useLogin();

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("user");
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) newErrors.email = "Email is required";
    if (!password.trim()) newErrors.password = "Password is required";

    if (isRegister) {
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = "Confirm your password";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const endpoint = isRegister
        ? `${API_BASE}/auth/register`
        : `${API_BASE}/auth/login`;

      const payload = isRegister
        ? { email, password, confirmPassword, role }
        : { email, password };

      const res = await axios.post(endpoint, payload);
      const { user, token } = res.data;

      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);

      login(user, token);

      await Swal.fire({
        icon: "success",
        title: isRegister ? "Registered Successfully!" : "Login Successful!",
      });

      // Role-based redirect
      if (user.role === "doctor") {
        navigate("/lung-scan");
      } else {
        navigate("/");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-container ${darkMode ? "dark" : ""}`}>
      <form className="form-box" onSubmit={handleSubmit}>
        <h2>{isRegister ? "Register" : "Login"}</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="error">{errors.email}</p>}

        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete={isRegister ? "new-password" : "current-password"}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="error">{errors.password}</p>}

        {isRegister && (
          <>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && (
              <p className="error">{errors.confirmPassword}</p>
            )}

            {/*  RADIO BUTTONS BELOW CONFIRM PASSWORD */}
            <div className="role-box">
              <label>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                />
                User
              </label>

              <label>
                <input
                  type="radio"
                  name="role"
                  value="doctor"
                  checked={role === "doctor"}
                  onChange={() => setRole("doctor")}
                />
                Doctor
              </label>
            </div>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        <p>
          {isRegister ? "Already have an account?" : "New user?"}
          <span onClick={toggleForm} style={{ cursor: "pointer" }}>
            {isRegister ? " Login" : " Register"}
          </span>
        </p>

        <p onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </p>
      </form>
    </div>
  );
}

export default Login;
