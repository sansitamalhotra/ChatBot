const mongoose = require("mongoose");

const subscriberSchema  = new mongoose.Schema({

    email: { 
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true,
        validate: {
            validator: function (value) {
                // Regular expression to validate email format
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: 'Invalid email address',
        },
    },
    subscribed: { type: Boolean, default: true },
    unsubscribeReason: { type: String, default: null },
    subscriptionDate: {
        type: Date,
        default: Date.now,
    },
    
});
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
module.exports = Subscriber;