const mongoose = require("mongoose");

const securityViolationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  violationType: {
    type: String,
    enum: [
      'manipulation_attempt', 
      'multiple_sessions', 
      'suspicious_activity',
      'time_discrepancy',
      'invalid_heartbeat'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolved: {
    type: Boolean,
    default: false
  },
  adminNotified: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
securityViolationSchema.index({ userId: 1, timestamp: -1 });
securityViolationSchema.index({ violationType: 1, resolved: 1 });
securityViolationSchema.index({ severity: 1, resolved: 1 });

module.exports = mongoose.model("SecurityViolation", securityViolationSchema);
