import React from "react";
import { Navigate } from "react-router-dom";

const DoctorRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "doctor") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default DoctorRoute;
