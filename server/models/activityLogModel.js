const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivitySession',
    required: false
  },
  activityType: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'idle_start',
      'idle_end',
      'auto_logout',
      'session_start',
      'session_end',
      'session_resume',
      'tab_hidden',
      'tab_visible',
      'connection_lost',
      'reconnected'
    ],
    default: 'login'
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true,
    default: 'unknown'
  },
  email: { // Add email field for direct tracking
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ sessionId: 1, timestamp: -1 });
activityLogSchema.index({ activityType: 1, timestamp: -1 });
activityLogSchema.index({ email: 1 });  // NEW: Index for email
module.exports = mongoose.model("ActivityLog", activityLogSchema);
