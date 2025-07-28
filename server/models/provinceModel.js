const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({

    provinceName: {
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
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },

  }, { timestamps: true });

module.exports = mongoose.model('Province', provinceSchema);