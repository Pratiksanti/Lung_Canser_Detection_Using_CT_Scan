const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    patientName: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    address: { type: String, default: "" },

    resnet50: {
      case: { type: String, required: true },
      confidence: { type: Number, required: true }
    },

    vgg16: {
      case: { type: String, required: true },
      confidence: { type: Number, required: true }
    },

    inceptionv3: {
      case: { type: String, required: true },
      confidence: { type: Number, required: true }
    },

    finalCase: {
      type: String,
      required: true
    },

    scanImage: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);

