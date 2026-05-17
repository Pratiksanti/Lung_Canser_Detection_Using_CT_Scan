const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  result: {
    diagnosis:   { type: String, default: "" },
    patientName: { type: String, default: "" },
    resnet50:    { type: String, default: "" },
    vgg16:       { type: String, default: "" },
    inceptionv3: { type: String, default: "" },
    advancedcnn: { type: String, default: "" },
  }
});

const userSchema = new mongoose.Schema({
  name:         { type: String, default: null },
  email:        { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  username:     { type: String, default: "" },
  bio:          { type: String, default: "" },
  profileImage: { type: String, default: null },
  scanHistory:  { type: [scanSchema], default: [] },
  role: {
    type: String,
    enum: ["user", "doctor"],
    default: "user",
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.toSafeObject = function () {
  return {
    id:           this._id,
    name:         this.name,
    email:        this.email,
    username:     this.username,
    bio:          this.bio,
    profileImage: this.profileImage,
    scanHistory:  this.scanHistory,
    role:         this.role,
    createdAt:    this.createdAt
  };
};

module.exports = mongoose.model("User", userSchema);