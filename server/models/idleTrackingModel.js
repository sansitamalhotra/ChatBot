const mongoose = require("mongoose");

const idleTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ActivitySession",
    required: true,
    index: true
  },
  idleStartTime: {
    type: Date,
    required: true
  },
  idleEndTime: {
    type: Date,
    default: null
  },
  idleDuration: {
    type: Number, // in milliseconds
    default: 0
  },
  screenshotCaptured: {
    type: Boolean,
    default: false
  },
  screenshotPath: {
    type: String,
    default: null
  },
  autoLogout: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
idleTrackingSchema.index({ userId: 1, idleStartTime: -1 });
idleTrackingSchema.index({ sessionId: 1 });

module.exports = mongoose.model("IdleTracking", idleTrackingSchema);
