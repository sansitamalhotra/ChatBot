const mongoose = require("mongoose");

const applicantJobApplicationSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },

  jobPostedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  salary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salary",
    required: true,
  },
  rate: {
    type: String,
    required: true,
  },
  resume: {
    type: String,
    required: true,
  },
  
  jobMatrix: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Applied", "Shortlisted", "Rejected"],
    default: "Applied",
  },
  appliedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  applicationDate: {
    type: Date,
    default: Date.now,
  },
});

const ApplicantJobApplication = mongoose.model(
  "ApplicantJobApplication",
  applicantJobApplicationSchema
);
module.exports = ApplicantJobApplication;
