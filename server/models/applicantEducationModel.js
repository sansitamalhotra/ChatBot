const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const applicantEducationSchema = new mongoose.Schema({

    userId: {
        type: ObjectId,
        required: true,
        ref: "User",
    },   
    qualification: {    
        type: ObjectId,
        ref: "Qualification",
        required: true,   
    },    
    institution: {    
        type: String,
        required: true,  
    }, 
    fieldOfStudy: { 
        type: String,
        required: true,
    },   
    startYear: {    
        type: Date,
        required: true,   
    },    
    finishYear: {    
        type: Date,
        default: null,    
    },    
    current: { type: Boolean, default: false }, 
    
    country: {
        type: ObjectId,
        ref: "ApplicantCountry",
        required: true,
    },    
    updatedOn: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("ApplicantEducation", applicantEducationSchema)
