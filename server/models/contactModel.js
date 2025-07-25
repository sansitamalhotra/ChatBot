const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    sentConfirmationEmailToUser: { type: Boolean, default: false },
    receivedEmailFromContactForm: { type: Boolean, default: false }
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;