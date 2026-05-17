const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Auth Middleware ──────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id || decoded._id || decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ── Multer Setup (profile image upload) ─────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `profile_${req.userId}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// ── GET /api/profile ─────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      _id: user._id,
      username: user.username || user.name || user.email.split("@")[0],
      email: user.email,
      bio: user.bio || "",
      profileImage: user.profileImage || null,
      scanHistory: user.scanHistory || [],
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error("GET /profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT /api/profile ─────────────────────────────────────────
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { username, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { username, bio },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage,
      scanHistory: user.scanHistory,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error("PUT /profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/profile/upload-image ──────────────────────────
router.post("/upload-image", authMiddleware, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const imagePath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { profileImage: imagePath },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ profileImage: user.profileImage });
  } catch (err) {
    console.error("POST /profile/upload-image error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// Add this inside routes/profile.js
const bcrypt = require("bcrypt");

router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
