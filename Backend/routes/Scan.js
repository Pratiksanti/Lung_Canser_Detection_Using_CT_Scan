const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const doctorOnly = require("../middleware/doctorOnly");

// Doctor-only lung scan endpoint
router.post("/analyze", auth, doctorOnly, async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Doctor authorized. Lung scan access granted.",
      doctor: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (err) {
    console.error("Scan route error:", err);
    return res.status(500).json({
      success: false,
      message: "Error while processing lung scan",
    });
  }
});

module.exports = router;
