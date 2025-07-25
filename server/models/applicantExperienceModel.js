const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const applicantExperienceSchema = new mongoose.Schema({

    userId: {
        type: ObjectId,
        required: true,
        ref: "User",
    },   
    designation: {    
        type: String,
        required: true,   
    },    
    company: {    
        type: String,
        required: true,  
    }, 
    responsibilities: { 
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

module.exports = mongoose.model("ApplicantExperience", applicantExperienceSchema)
