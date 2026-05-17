require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// ROUTES
const authRoutes = require("./routes/auth");
const predictRoutes = require("./routes/Prediction");
const contactRoutes = require("./routes/Contact");
const scanRoutes = require("./routes/Scan");
const reportRoutes = require("./routes/reportRoutes");
const profileRoute = require("./routes/profile");

const app = express();

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// BODY PARSER
app.use(express.json());

// SERVE UPLOADS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MOUNT ROUTES
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/predict", predictRoutes);
app.use("/api/v1/scan", scanRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/v1/profile", profileRoute); 

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI not set in .env");
  process.exit(1);
}

async function startServer() {
  try {
    console.log("👉 Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});