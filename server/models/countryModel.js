const mongoose = require('mongoose');


const countrySchema = new mongoose.Schema({
    countryName: {
        type: String,
        trim: true,
        required: true,
        maxlength: 255,
    },
    slug: {
        type: String,
        lowercase: true,
        unique: true
    },
}, { timestamps: true });


module.exports = mongoose.model('Country', countrySchema);