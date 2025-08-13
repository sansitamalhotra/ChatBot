const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const SectorSchema = new mongoose.Schema(
    {
        sectorName: {
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
    }, { timestamps: true }
);

module.exports = mongoose.model('Sector', SectorSchema);