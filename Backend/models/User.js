const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: null },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },

 
  role: {
    type: String,
    enum: ['user', 'doctor'],
    default: 'user',
  },

  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,       
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
