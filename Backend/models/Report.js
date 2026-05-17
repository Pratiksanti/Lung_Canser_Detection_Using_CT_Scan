const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patientName: { type: String, default: "" },
  mobileNumber: { type: String, default: "" },
  address: { type: String, default: "" },
  resnet50:    { case: String, confidence: Number },
  vgg16:       { case: String, confidence: Number },
  inceptionv3: { case: String, confidence: Number },
  advancedcnn: { case: String, confidence: Number },
  finalCase: { type: String },
  scanImage: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", reportSchema);