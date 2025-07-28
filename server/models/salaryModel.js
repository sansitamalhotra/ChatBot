const mongoose = require('mongoose');


const salarySchema = new mongoose.Schema({
    
    salaryName: {
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


module.exports = mongoose.model('Salary', salarySchema);