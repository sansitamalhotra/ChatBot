//server/models/activityLogModel.js
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
      'session_pause',
      'tab_hidden',
      'tab_visible',
      'connection_lost',
      'reconnected',
      'page_focus',
      'page_blur',
      'mouse_activity',
      'keyboard_activity',
      'manual_override',
      'page_unload',
      'component_unmount',
      
      'status_update_online',
      'status_update_offline', 
      'status_update_active',
      'status_update_idle',
      'status_update_away',
      
      'general'
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
  email: { 
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ sessionId: 1, timestamp: -1 });
activityLogSchema.index({ activityType: 1, timestamp: -1 });
activityLogSchema.index({ email: 1 }); 

module.exports = mongoose.model("ActivityLog", activityLogSchema);
