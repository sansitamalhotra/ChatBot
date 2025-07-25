const fs = require('fs');
const { errorResponse, successResponse } = require("../configs/appResponse");
const path = require("path");
const User = require("../models/userModel");
const ApplicantJobApplication = require("../models/applicantJobApplicationModel");
const Job = require("../models/jobModel");


module.exports = {
     fetchRegUsers: async (req, res) => {        

        try
        {
            const users = await User.find();
            const userCount = await User.countDocuments();
           res.status(200).json({ users, userCount });
        }
        catch (error)
        {
            console.error(error);
            res.status(500).send({ success: false, message: "Something Went Wrong Trying to Fetch All Registered Users From Database", error: error.message });
        }

     },
    //  ==================== Controller method to get Registered User Details by ID inside Admin Dashboard
    fetchUserById: async (req, res) => {

        try
        {
            // check if user exists
            const user = await User.findById(req.params.id);

            if (!user) {
                res.status(404).json(errorResponse(4, 'No Registered User Found or User Does not Exist.'));
            }
            res.status(200).json(successResponse(0, 'SUCCESS!!!', 'Successfully Fetch All Registered Users Details', {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.phone,
                photo: process.env.BACKEND_BASE_URL + user.photo,
                role: user.role,
                country: user.country,
                workAuthorization: user.workAuthorization,
                isVerified: user.isVerified,
                status: user.status,
                registeredDate: user.registeredDate,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }));
        }
        catch (error)
        {
            res.status(500).json(errorResponse(2, 'Something Went Wrong Trying to Fetch Registered User By Id.', error));
        }
    },

    // Controller to Update User Details
    updateRegUser: async (req, res) => {

        try
        {
            const { user } = req;

            const { firstname, lastname,  phone, country, workAuthorization } = req.body;

            if (!user) {
                res.status(404).json(errorResponse(4, 'No Registered User Found or User Does not Exist.'));
            }
        }
        catch(error)
        {
            res.status(500).json(errorResponse(2, 'Something Went Wrong Trying to Update User By Id.', error))
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
    fetchRegisteredUsers: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const result = {};

    try {
      const totalRegUsers = await User.countDocuments();
      const numRegUsersInDB = await User.countDocuments();

      const users = await User.find({ _id: { $ne: req.userId } })
        .populate([
          "firstname",
          "lastname",
          "email",
          "phone",
          "isVerified",
          {
            path: "country",
            select: "countryName"
          },
          "status",
          "role",
          {
            path: "country",
            select: "countryName"
          }
        ])
        .lean()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(startIndex);

      if (endIndex < numRegUsersInDB) {
        result.next = { page: page + 1, limit: limit };
      }
      if (startIndex > 0) {
        result.previous = { page: page - 1, limit: limit };
      }

      result.result = users;
      result.numRegUsersInDB = numRegUsersInDB;
      result.totalRegUsers = totalRegUsers;

      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message:
          "Something Went Wrong Trying to Fetch All Registered Users From Database",
        error: error.message
      });
    }
  },
  fetchRegUserById: async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId).populate([
        "firstname",
        "lastname",
        "email",
        "phone",
        "photo",
        "role",
        "country",
        "isVerified",
        "isBlocked",
        "workAuthorization",
        "jobsPostedBy",
        "status",
        "registeredDate",
        "createdAt",
        "updatedAt",
        "appliedJobs"
      ]);

      res
        .status(201)
        .json({
          message:
            "Successfully Fetch Registered User Details with Details By ID!!!",
          user
        });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Something Went Wrong Trying to Fetch Registered User By Id",
        error
      });
    }
  },
};

