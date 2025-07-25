const mongoose = require("mongoose");

const QualificationSchema = new mongoose.Schema(
    {
        qualificationName: {
            type: String,
            required: true,
            maxlength: 255,
        },
        slug: {
          type: String,
          lowercase: true,
        }, 
    }, { timestamps: true }
);

module.exports = mongoose.model('Qualification', QualificationSchema);