const mongoose = require("mongoose");

const WorkModeSchema = new mongoose.Schema(
    {
        workModeName: {
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

module.exports = mongoose.model('WorkMode', WorkModeSchema);