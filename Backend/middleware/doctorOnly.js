module.exports = function (req, res, next) {
  if (!req.user || req.user.role !== "doctor") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Doctors only",
    });
  }
  next();
};
