const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  slackId: {
    type: String,
    required: true,
    unique: true,
  },
  teamId: {
    type: String,
    required: true,
  },
  realName: String,
  displayName: String,
  email: String,
  role: String,
  company: String,
  channels: [{
    type: String, // Channel IDs
  }],
  isOptedOut: {
    type: Boolean,
    default: false,
  },
  lastMatched: {
    type: Date,
    default: null,
  },
  profilePicture: String,
  previousMatches: [{
    userId: String,
    timestamp: Date,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
