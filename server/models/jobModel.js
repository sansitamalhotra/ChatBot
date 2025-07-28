const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const jobSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },
  description: { type: String, required: true },
  
  slug: { type: String, unique: true, required: true },
  
  qualification: {
    type: ObjectId,
    ref: "Qualification",
    required: true,
  },
  workExperience: {
    type: ObjectId,
    ref: "WorkExperience",
    required: true,
  },
  workMode: {
    type: ObjectId,
    ref: "WorkMode",
    require: true,
  },
  filePath: {
    type: String,
    default: null,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true,
  },
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Province',
    required: true,
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
    ref: "User"
  },  
  jobPostDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  deadlineDate: {
    type: Date,
    required: true,
  },
},
{
  timestamps: true
}
);

module.exports = mongoose.model('Job', jobSchema);