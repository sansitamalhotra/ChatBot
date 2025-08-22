//server/models/userModel.js
const mongoose = require("mongoose");
const { model, Schema, Document } = require("mongoose");
const { omit } = require("ramda");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  lastname: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  phone: {
    type: String,
    required: true,
  },
  sector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sector",
  },
  role: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  registeredDate: {
    type: Date,
    default: Date.now,
  },
  photo: {
    type: String,
    default: "https://img.freepik.com/premium-vector/account-icon-user-icon-vector-graphics_292645-552.jpg?w=300",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    required: true,
  },
  workAuthorization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkAuthorization",
    required: true,
  },
  jobsPostedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
  skills: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
    },
  ],
  
  appliedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApplicantJobApplication",
    },
  ],
  resumes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }],
  status: {
    type: String,
    enum: ['register', 'login', 'logout', 'blocked'],
    default: 'register'
  },
  currentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ActivitySession",
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // currentStatus: {
  //   type: String,
  //   enum: ['offline', 'online', 'active', 'idle', 'away'],
  //   default: 'offline'
  // },
  currentStatus: {
    type: String,
    enum: ['offline', 'online', 'active', 'idle', 'away'],
    default: 'offline',
    validate: {
      validator: function(v) {
        return ['offline', 'online', 'active', 'idle', 'away'].includes(v);
      },
      message: 'Status must be one of: offline, online, active, idle, away'
    }
  },
  totalWorkTime: {
    type: Number, // Total work time in milliseconds
    default: 0
  },
  violationCount: {
    type: Number,
    default: 0
  },
  lastViolation: {
    type: Date,
    default: null
  },
  lastKnownIP: {
    type: String,
    default: 'unknown'
  },
  socketId: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
  });
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token (private key) and save to database
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expire date
  this.resetPasswordExpire = Date.now() + 10 * (60 * 1000); // Ten Minutes

  return resetToken;
};
const User = mongoose.model("User", userSchema);
module.exports = User;
