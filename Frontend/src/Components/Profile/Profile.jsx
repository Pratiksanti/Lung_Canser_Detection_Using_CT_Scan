import React from "react";
import { Navigate } from "react-router-dom";
import DoctorProfile from "../Doctor/DoctorProfile"; // ✅ fixed
import UserProfile from "./User";

function Profile() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role === "doctor") {
    return <DoctorProfile />;
  }

  return <UserProfile />;
}

export default Profile;