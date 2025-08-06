const multer = require("multer");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const ApplicantJobApplication = require("../models/applicantJobApplicationModel");
const ActivitySession = require('../models/activitySessionModel');
const mongoose = require('mongoose');
const { getClientIP } = require('../services/socketService');
const { logWithIcon } = require('../services/consoleIcons');

const VALID_USER_STATUSES = ['offline', 'online', 'active', 'idle', 'away'];
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
      // Fetch ALL admin users (role 1), not just online ones
      const admins = await User.find({ 
        role: 1
      })
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();
      
      const adminsWithSession = await Promise.all(admins.map(async (admin) => {
        // Find latest session (active or ended)
        const session = await ActivitySession.findOne({ 
          userId: new mongoose.Types.ObjectId(admin._id)
        }).sort({ loginTime: -1 }).lean();
        
        // FIXED: Validate currentStatus against correct enum values
        let validatedStatus = admin.currentStatus;
        if (!validatedStatus || !VALID_USER_STATUSES.includes(validatedStatus)) {
          // Check if user has an active session to determine if they should be online
          if (session && session.sessionStatus === 'active') {
            validatedStatus = 'active';
          } else {
            validatedStatus = 'offline';
          }
        }
        
        return {
          ...admin,
          loginLatestSession: session,
          currentStatus: validatedStatus,
          sessionId: session?._id // Add session ID for tracking
        };
      }));
      
      logWithIcon.statistics(`Fetched ${adminsWithSession.length} admins with sessions`);
      
      res.status(200).json({ 
        success: true, 
        admins: adminsWithSession,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching admins with session info:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching admins with session info",
        error: error.message,
      });
    }
  },
  getAdminStatusSummary: async (req, res) => {
    try {
      const statusCounts = await User.aggregate([
        { $match: { role: 1 } },
        { 
          $group: {
            _id: "$currentStatus",
            count: { $sum: 1 }
          }
        }
      ]);
      const summary = {
        total: 0,
        active: 0,
        idle: 0,
        away: 0,
        offline: 0
      };
      statusCounts.forEach(status => {
        const statusKey = VALID_USER_STATUSES.includes(status._id) ? status._id : 'offline';
        summary[statusKey] = status.count;
        summary.total += status.count;
      });
      res.status(200).json({
        success: true,
        summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching admin status summary:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching admin status summary",
        error: error.message,
      });
    }
  },
  logUserActivityFromBeacon: async (req, res) => {
    try {

      const ipAddress = getClientIP({
        handshake: {
          headers: req.headers,
          address: req.ip || req.connection.remoteAddress
        }
      });

      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Invalid beacon data format"
        });
      }

      const { type, data } = req.body;
      
      if (type !== 'user_logout') {
        return res.status(400).json({
          success: false,
          message: "Invalid beacon type"
        });
      }

      const activityData = data;
      logWithIcon.inbox(`Received beacon activity:`, activityData);

      const newLog = new ActivityLog({
        userId: activityData.userId,
        email: activityData.userInfo?.email || 'unknown@email.com',
        sessionId: activityData.sessionId || null,
        activityType: 'page_unload',
        timestamp: new Date(activityData.timestamp),
        ipAddress, // Use detected IP
        metadata: {
          ...activityData.metadata,
          beacon: true,
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });

      await newLog.save();
      
      res.status(200).json({
        success: true,
        message: "Beacon activity logged"
      });
      
    } catch (error) {
      console.error("Error logging beacon activity:", error);
      res.status(500).json({
        success: false,
        message: "Error logging beacon activity",
        error: error.message
      });
    }
  }
}
