const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true,
    unique: true,
  },
  teamId: {
    type: String,
    required: true,
  },
  name: String,
  isPrivate: {
    type: Boolean,
    default: false,
  },
  memberCount: {
    type: Number,
    default: 0,
  },
  lastSynced: {
    type: Date,
    default: null,
  },
  members: [{
    type: String, // User IDs
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

channelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Channel', channelSchema);
