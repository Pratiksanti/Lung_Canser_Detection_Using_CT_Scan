// DoctorRoute.jsx — only a route guard, nothing else
import React from "react";
import { Navigate } from "react-router-dom";
import { useLogin } from "../LoginContext/LoginContext";

function DoctorRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "doctor") {
    return <Navigate to="/" replace />;  // ← blocks normal users
  }

  return children;
}

export default DoctorRoute;