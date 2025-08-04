
const mongoose = require("mongoose");

const idleTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ActivitySession",
    required: true
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
  metadata: { // ADDED: For storing instance IDs and other tracking data
    instanceId: String,
    endInstanceId: String,
    logoutInstanceId: String,
    additionalData: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries - FIXED: Removed duplicate index definitions
idleTrackingSchema.index({ userId: 1, idleStartTime: -1 });
idleTrackingSchema.index({ sessionId: 1 });
idleTrackingSchema.index({ idleEndTime: 1 }); // For finding open idle sessions

module.exports = mongoose.model("IdleTracking", idleTrackingSchema);
