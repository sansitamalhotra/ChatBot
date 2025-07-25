const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const applicantResumeSchema = new mongoose.Schema({

    userId: {
        type: ObjectId,
        required: true,
        ref: "User",
    }, 
    resume: {
        type: String,
        required: true,
    },
    uploadedOn: {
        type: Date,
        default: Date.now,
      },
});
module.exports = mongoose.model("Resume", applicantResumeSchema)