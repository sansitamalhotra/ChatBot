const mongoose = require("mongoose");

const activitySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", //ref User Model
    required: true,
    index: true
  },
  loginTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  totalActiveTime: {
    type: Number, // in milliseconds
    default: 0
  },
  totalIdleTime: {
    type: Number, // in milliseconds
    default: 0
  },
  sessionStatus: {
    type: String,
    enum: ['active', 'idle', 'ended'],
    default: 'active'
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String,
    screen: {
      width: Number,
      height: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
activitySessionSchema.index({ userId: 1, loginTime: -1 });
activitySessionSchema.index({ sessionStatus: 1 });
activitySessionSchema.index({ createdAt: -1 });

// Update updatedAt on save
activitySessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ActivitySession", activitySessionSchema)
