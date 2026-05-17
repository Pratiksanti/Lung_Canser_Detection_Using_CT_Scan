const express = require("express");
const Report  = require("../models/Report");
const User    = require("../models/User");
const upload  = require("../middleware/upload");
const auth    = require("../middleware/auth");

const router = express.Router();

router.post("/save", auth, upload.single("scanImage"), async (req, res) => {
  try {
    const { patientName = "", mobileNumber = "", address = "",
            ResNet50, VGG16, InceptionV3, HybridModel, finalCase } = req.body;

    if (!ResNet50 || !VGG16 || !InceptionV3 || !HybridModel || !finalCase) {
      return res.status(400).json({ error: "Missing model results or final case" });
    }

    const resnet    = JSON.parse(ResNet50);
    const vgg       = JSON.parse(VGG16);
    const inception = JSON.parse(InceptionV3);
    const hybrid    = JSON.parse(HybridModel);

    const report = new Report({
      doctorId: req.user._id,
      patientName,
      mobileNumber,
      address,
      resnet50:    { case: resnet.case,    confidence: resnet.confidence },
      vgg16:       { case: vgg.case,       confidence: vgg.confidence },
      inceptionv3: { case: inception.case, confidence: inception.confidence },
      advancedcnn: { case: hybrid.case,    confidence: hybrid.confidence },
      finalCase,
      scanImage: req.file ? `/uploads/${req.file.filename}` : "",
    });

    await report.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        scanHistory: {
          date: new Date(),
          result: {
            diagnosis:   finalCase,
            patientName,
            resnet50:    resnet.case,
            vgg16:       vgg.case,
            inceptionv3: inception.case,
            advancedcnn: hybrid.case,
          },
        },
      },
    });

    return res.json({ message: "Report saved successfully" });

  } catch (error) {
    console.error("❌ Save report error:", error);
    return res.status(500).json({ error: "Failed to save report" });
  }
});

module.exports = router;