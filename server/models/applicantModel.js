const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const applicantSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    github: {
        type: String,
        default: null
    },
    linkedin: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Nonbinary', 'Decline to State', 'Other'],
        default: null
    },
    skills: [
        {    
          type: String    
        }    
    ],
    profilePhoto: {
      type: Buffer,  
      contentType: String  
    },
    academicQualifications: [
        {    
          degree: {    
            type: String    
          },    
          school: {    
            type: String    
          }, 
          fieldofstudy: { 
            type: String 
          },   
          startYear: {    
            type: Date    
          },    
          finishYear: {    
            type: Date    
          },    
          current: { type: Boolean, default: false }, 
        }    
    ],
    experiences: [
      {
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String },
        startYear: { type: Date, required: true },
        finishYear: { type: Date },
        current: { type: Boolean, default: false },
        description: { type: String },
      },
    ],
    updatedOn: {
        type: Date,
        default: Date.now,
    },
    country: {
      type: String,
      required: true,
  },
});

module.exports = mongoose.model("Applicant", applicantSchema)