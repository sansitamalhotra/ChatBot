const mongoose = require('mongoose');

const guestUserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // To track if they became a registered user later
  registeredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Index for faster lookups
guestUserSchema.index({ email: 1 }, { unique: true });
guestUserSchema.index({ createdAt: -1 });

const GuestUser = mongoose.model('GuestUser', guestUserSchema);

module.exports = GuestUser;
