//server/models/jobModel.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: { type: String },

    slug: { type: String, unique: true },

    qualification: {
      type: ObjectId,
      ref: "Qualification",
    },
    workExperience: {
      type: ObjectId,
      ref: "WorkExperience",
    },
    workMode: {
      type: ObjectId,
      ref: "WorkMode",
    },
    filePath: {
      type: String,
      default: null,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
    },
    province: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Province",
    },
    sector: {
      type: ObjectId,
      ref: "Sector",
    },
    jobApplications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApplicantJobApplication",
      },
    ],
    applicationCount: {
      type: Number,
      default: 0,
    },
    jobPostedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    jobPostDate: {
      type: Date,
      default: Date.now,
    },
    deadlineDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Job', jobSchema);
