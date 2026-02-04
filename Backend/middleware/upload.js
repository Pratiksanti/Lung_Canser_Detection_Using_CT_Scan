const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage(); // 👈 NO disk storage

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mime = allowed.test(file.mimetype);

    if (ext && mime) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

module.exports = upload;
