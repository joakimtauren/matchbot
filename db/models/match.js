const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  matchedUserId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  teamId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['suggested', 'accepted', 'rejected', 'expired'],
    default: 'suggested',
  },
  interactionType: {
    type: String,
    enum: ['direct_message', 'calendar', 'none'],
    default: 'none',
  },
  similarityScore: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

matchSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index to ensure we don't duplicate matches
matchSchema.index({ userId: 1, matchedUserId: 1, channelId: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
