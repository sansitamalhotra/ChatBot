const mongoose = require("mongoose");

const WorkExperienceSchema = new mongoose.Schema(
    {
        workExperienceName: {
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

module.exports = mongoose.model('WorkExperience', WorkExperienceSchema);