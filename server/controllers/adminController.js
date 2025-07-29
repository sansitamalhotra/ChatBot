const multer = require("multer");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const ApplicantJobApplication = require("../models/applicantJobApplicationModel");
const ActivitySession = require('../models/activitySessionModel');
const mongoose = require('mongoose');

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
  
  fetchAdminWithSession: async (req, res) => {
    try {
      // Find all Admins with Role: 1 (get ALL admins, not just those with active sessions)
      const admins = await User.find({ role: 1 }).select('-password').lean();
      
      // For each Admin, find their latest session (active or ended)
      const adminsWithSession = await Promise.all(admins.map(async (admin) => {
        // Find Latest Session for Admin User (both active and ended), sorted by LoginTime in Descending Order
        const loginLatestSession = await ActivitySession.findOne({
          userId: new mongoose.Types.ObjectId(admin._id),
        }).sort({ loginTime: -1 }).lean();
        
        // Return admin with session info and current status
        return { 
          ...admin, 
          loginLatestSession,
          // Ensure currentStatus is included (fallback to 'offline' if not set)
          currentStatus: admin.currentStatus || 'offline'
        };
      }));
      
      console.log(`Fetched ${adminsWithSession.length} admin users with session info`);
      res.status(200).json({ success: true, admins: adminsWithSession });
    }
    catch (error) {
      console.error("Error fetching admins with session info:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching admins with session info",
        error: error.message,
      });
    }
  },
}
