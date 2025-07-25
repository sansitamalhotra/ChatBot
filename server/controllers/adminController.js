const multer = require("multer");
const fs = require("fs");
const path = require("path");

const User = require("../models/userModel");
const ApplicantJobApplication = require("../models/applicantJobApplicationModel");


module.exports = 
{
    fetchRegisteredUsers: async(req, res) => {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
    
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const result = {};

        try
        {
            const totalRegUsers = await User.countDocuments();
            const numRegUsersInDB = await User.countDocuments();

            const users = await User.find({ _id: { $ne: req.userId } }).populate([
                "firstname",
                "lastname",
                "email",
                "phone",
                "isVerified",
                "isBlocked",
                "photo",
                {
                  path: "country",
                  select: "countryName"
                },
                "status",
                "role",
                {
                    path: "country",
                    select: "countryName"
                },
                "workAuthorization",
                {
                    path: 'jobsPostedBy',
                    select: 'title country province provinceFile sector expiryDate applicationCount jobApplications startDate'
                  },
                  'registeredDate',
                  {
                    path: 'appliedJobs',
                    select: 'status user job appliedJobs applicationDate salary rate resume jobMatrix'
                  }
            ]).lean().sort({ createdAt: -1 }).limit(limit).skip(startIndex);

            if (endIndex < numRegUsersInDB) {
                result.next = { page: page + 1, limit: limit };
            }
            if (startIndex > 0) {
                result.previous = { page: page - 1, limit: limit };
            }

            result.result = users;
            result.numRegUsersInDB = numRegUsersInDB;
            result.totalRegUsers = totalRegUsers;

            console.log("Registered Users List :", result);

            res.status(200).json(result);
        }
        catch (error)
        {
            console.log(error);
            res.status(500).send({ success: false, message: "Something Went Wrong Trying to Fetch All Registered Users From Database", error: error.message });
        }
    },

  fetchRegisteredUserById: async (req, res) => {
      try {
        const user = await User.findById(req.params.id)
          .select('-password -confirmpassword')
          .populate([
              "firstname",
              "lastname",
              "email",
              "phone",
              "isVerified",
              "isBlocked",
              "photo",
            {
              path: 'country',
              select: 'countryName'
            },
            'status',
            {
              path: 'jobsPostedBy',
              select: 'title country province provinceFile sector expiryDate applicationCount jobApplications startDate'
            },
            'registeredDate',
            {
              path: 'appliedJobs',
              select: 'status user job appliedJobs applicationDate salary rate resume jobMatrix'
            }
          ]);
    
        console.log({ 'User Detail': user }); // check if the logged in
    
        res.status(200).send({ success: true, message: 'Registered User Details Found', user });
      } catch (error) {
        console.error('Error Fetching Registered User By Id:', error);
        res.status(500).send({
          success: false,
          message: 'Something went wrong while trying to fetch registered user by ID',
          error
        });
      }
  },
  fetchAllAppliedJobsByApplicants: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const startIndex = (page - 1) * limit;

      const result = {};

      const totalAppliedApplicant =
        await ApplicantJobApplication.countDocuments();

      const applicantAppliedJobs = await ApplicantJobApplication.find({
        status: "Applied"
      })
        .populate([
          {
            path: "user",
            select: "firstname lastname email phone"
          },
          {
            path: "job",
            select: "_id title slug description"
          },
          {
            path: "salary",
            select: "salaryName"
          },
          "rate",
          "jobMatrix",
          "status",
          {
            path: "appliedJobs",
            select:
              "status user job appliedJobs applicationDate salary rate resume jobMatrix"
          }
        ])
        .sort({ applicationDate: -1 })
        .limit(limit)
        .skip(startIndex);

      console.log({ "Total Active Applicants": applicantAppliedJobs });

      if (startIndex > 0) {
        result.previous = { page: page - 1, limit };
      }

      if (startIndex + applicantAppliedJobs.length < totalAppliedApplicant) {
        result.next = { page: page + 1, limit };
      }

      result.result = applicantAppliedJobs;
      result.totalAppliedApplicant = totalAppliedApplicant;

      console.log("All Active Applicant Count: ", totalAppliedApplicant);

      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message:
          "Something Went Wrong Trying to Fetch All Applicants Applied Jobs From Database",
        error: error.message
      });
    }
  },
    
}
