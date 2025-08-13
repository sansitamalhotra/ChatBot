const mongoose = require('mongoose');


const citySchema = new mongoose.Schema({

    cityName: {
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
    province: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Province',
        required: true,
    },
});

module.exports = mongoose.model('City', citySchema);