const express = require("express");
const Report = require("../models/Report");
const upload = require("../middleware/upload");

const router = express.Router();

/**
 * SAVE REPORT + IMAGE
 * POST /api/report/save
 */
router.post(
  "/save",
  upload.single("scanImage"),
  async (req, res) => {
    try {
      console.log("📥 Incoming body:", req.body);
      console.log("🖼 Uploaded file:", req.file);

      const {
        patientName = "",
        mobileNumber = "",
        address = "",
        ResNet50,
        VGG16,
        InceptionV3,
        finalCase
      } = req.body;

      //  VALIDATION
      if (!ResNet50 || !VGG16 || !InceptionV3 || !finalCase) {
        return res.status(400).json({
          error: "Missing model results or final case",
        });
      }

      //  Parse model outputs
      const resnet = JSON.parse(ResNet50);
      const vgg = JSON.parse(VGG16);
      const inception = JSON.parse(InceptionV3);

      const report = new Report({
        patientName,
        mobileNumber,
        address,

        resnet50: {
          case: resnet.case,
          confidence: resnet.confidence,
        },

        vgg16: {
          case: vgg.case,
          confidence: vgg.confidence,
        },

        inceptionv3: {
          case: inception.case,
          confidence: inception.confidence,
        },

        finalCase: finalCase,

        scanImage: req.file ? `/uploads/${req.file.filename}` : "",
      });

      await report.save();

      return res.json({
        message: "Report and image saved successfully",
      });

    } catch (error) {
      console.error("❌ Save report error:", error);
      return res.status(500).json({
        error: "Failed to save report",
      });
    }
  }
);

module.exports = router;
