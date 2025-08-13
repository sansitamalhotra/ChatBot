// server/models/activitySessionModel.js
const mongoose = require('mongoose');

const activitySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
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
  totalWorkTime: {
    type: Number,
    default: 0
  },
  totalIdleTime: {
    type: Number,
    default: 0
  },
  idleStartTime: {
    type: Date,
    default: null
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
    required: false,
    default: null
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
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

activitySessionSchema.index({ userId: 1, loginTime: -1 });
activitySessionSchema.index({ sessionStatus: 1 });
activitySessionSchema.index({ createdAt: -1 });

activitySessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ActivitySession", activitySessionSchema);
