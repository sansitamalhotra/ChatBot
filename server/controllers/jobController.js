const { validationResult } = require("express-validator");
const slugify = require("slugify");
const path = require("path");
const Job = require("../models/jobModel");
const ApplicantJobApplication = require("../models/applicantJobApplicationModel");
const Sector = require("../models/sectorModel");
const WorkMode = require("../models/workModeModel");
const WorkExperience = require("../models/workExperience");
const fs = require("fs");
const User = require("../models/userModel");
const Country = require("../models//countryModel");
const Province = require("../models/provinceModel");
const City = require("../models/cityModel");
const {
  sendJobNotificationEmail,
} = require("../services/SendNewJobNotification");

/**
 * Utility functions to improve reusability and code organization
 */
const buildPaginationResult = (
  page,
  limit,
  startIndex,
  endIndex,
  totalCount
) => {
  const result = {};

  if (endIndex < totalCount) {
    result.next = { page: page + 1, limit };
  }

  if (startIndex > 0) {
    result.previous = { page: page - 1, limit };
  }

  return result;
};

/**
 * Generic error handler for controllers
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 * @param {string} operation - Description of the operation that failed
 */
const handleControllerError = (error, res, operation) => {
  console.error(`Error in ${operation}:`, error);
  return res.status(500).json({
    success: false,
    message: `Failed to ${operation}`,
    error: error.message || "An unknown error occurred",
  });
};

/**
 * Job Controller functions for managing job-related operations
 */

module.exports = {
  postJob: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("User lol ID:", userId);
      const user = await User.findById(userId);
      console.log("This is321 user", user.toObject()); // prints the full object

      const {
        title,
        description,
        qualification,
        workExperience,
        workMode,
        country,
        province,
        sector,
        deadlineDate,
      } = req.body;

      const jobPostedById = user;
      const jobPostDate = Date.now();
      const slug = slugify(title);
      const filePath = req.file ? req.file.path : null;

      const newJobData = {
        title: title || null,
        slug: slug ? slugify(title, { lower: true, strict: true }) : null,
        description: description || null,
        qualification: qualification || null,
        workExperience: workExperience || null,
        workMode: workMode || null,
        filePath: filePath || null,
        country: country || null,
        province: province || null,
        sector: sector || null,
        jobPostDate: jobPostDate || new Date(),
        jobPostedById: jobPostedById || null,
        deadlineDate: deadlineDate || null,
      };

      const newJob = new Job(newJobData);
      await newJob.save();
      //Get the job array
      console.log(userId);

      if (!Array.isArray(user.jobsPostedBy)) {
        user.jobsPostedBy = [];
      }
      user.jobsPostedBy.push(newJob._id);
      await user.save();

      try {
        await sendJobNotificationEmail(newJob);
      } catch (emailError) {
        console.error("Email notification failed:", emailError.message);
        // Consider adding error monitoring here
      }

      res
        .status(201)
        .json(`New Job: ${newJob.title}, is Successfully Added !!! `);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "An Error Occurred While Creating New Job" });
    }
  },

  addNewJob: async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    try {
      const {
        title,
        description,
        qualification,
        workExperience,
        workMode,
        country,
        province,
        sector,
        deadlineDate,
      } = req.body;

      console.log("Job Title", title);

      if (!title) {
        return res.status(400).json({ error: "Job title is required Here." });
      }
      const jobPostedById = user;
      const jobPostDate = Date.now();

      const slug = slugify(title, { lower: true });
      console.log("Job Slug URL", slug);
      //const slug = sluggo(title); req.file ? req.file.path : null;
      const filePath = req.file ? req.file.path : null;

      const newJobData = {
        title,
        description,
        slug,
        qualification,
        workExperience,
        workMode,
        filePath,
        //file_mimetype: mimetype,
        country,
        province,
        sector,
        jobPostDate,
        deadlineDate,
        jobPostedById,
      };

      console.log({ "New Post Job": newJobData });
      console.log({ "Job Slug": slug });
      console.log({ "Job Poster": user });

      const newJob = new Job(newJobData);

      await newJob.save();
      user.jobsPostedBy.push(newJob._id);
      await user.save();

      try {
        await sendJobNotificationEmail(newJob);
      } catch (emailError) {
        console.error("Email notification failed:", emailError.message);
        // Consider adding error monitoring here
      }

      res
        .status(201)
        .json(`New Job: ${newJob.title}, is Successfully Added !!! `);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An Error Occurred While Creating New Job" });
    }
  },

  fetchAllJobs: async (req, res) => {
    try {
      const { search } = req.query;
      const { page = 1, limit = 6 } = req.query;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const query = { deadlineDate: { $gte: new Date() } };
      const { sectors } = req.query;

      const totalJobs = await Job.countDocuments(query);
      const numJobsInDB = await Job.countDocuments(query);
      const totalAppliedApplicant =
        await ApplicantJobApplication.countDocuments(query);

      // Ensure search is a string
      const searchQuery =
        search && typeof search === "string"
          ? { title: { $regex: search, $options: "i" } }
          : {};

      let jobs = await Job.find({
        $or: [searchQuery],
        ...query,
      })
        .populate([
          "description",
          "qualification",
          "workExperience",
          "workMode",
          {
            path: "sector",
            select: "slug sectorName",
          },
          {
            path: "jobApplications",
            select:
              "status user job appliedJobs applicationDate salary rate resume jobMatrix",
          },
          "applicationCount",
          "country",
          "province",
          "jobPostDate",
          "jobPostedById",
          "deadlineDate",
        ])
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(startIndex);

      if (sectors) {
        const selectedSectors = await Sector.find({
          sectorName: { $in: sectors.split(",") },
        });
        jobs = jobs.filter((job) =>
          selectedSectors.some((sector) => sector.slug === job.sector.slug)
        );
      }

      const result = {
        result: jobs,
        numJobsInDB,
        totalJobs,
        totalAppliedApplicant,
      };

      if (endIndex < numJobsInDB) {
        result.next = { page: page + 1, limit };
      }

      if (startIndex > 0) {
        result.previous = { page: page - 1, limit };
      }

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Something Went Wrong Trying to Fetch All Jobs From Database",
        error: error.message,
      });
    }
  },

  fetchAllFiles: async (req, res) => {
    try {
      const files = await Job.find({});
      const sortedByCreationDate = files.sort(
        (a, b) => b.createdAt - a.createdAt
      );
      res.send(sortedByCreationDate);
    } catch (error) {
      console.log(error);
      res
        .status(400)
        .send("Error while getting list of files. Try again later.");
    }
  },

  downloadJobFileById: async (req, res) => {
    try {
      const { fileId } = req.params;
      const file = await Job.findOne({ _id: fileId });

      res.set({ "Content-Type": file.file_mimetype });

      res.sendFile(path.join(__dirname, "..", file.filePath));
      res.download(path.join(__dirname, "..", file.filePath));
    } catch (error) {
      console.error(error);
      res.status(400).send("Error while downloading Job File.");
    }
  },

  fetchCountriesForJobPost: async (req, res) => {
    try {
      const countries = await Country.find();
      res.json(countries);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  fetchProvincesForJobPost: async (req, res) => {
    try {
      const provinces = await Province.find({ country: req.params.countryId });
      console.log(provinces);
      res.json(provinces);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  fetchCitiesForJobPost: async (req, res) => {
    try {
      const cities = await City.find({ province: req.params.provinceId });
      console.log(cities);
      res.json(cities);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  fetchJobsByRecruiter: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const result = {};

    const userId = req.user._id;
    const user = await User.findById(userId);

    try {
      const totalJobs = await Job.countDocuments({
        jobPostedById: user,
        deadlineDate: { $gte: new Date() },
      });

      numJobsInDB = await Job.countDocuments({
        jobPostedById: user,
        deadlineDate: { $gte: new Date() },
      });

      const jobs = await Job.find({
        jobPostedById: user,
        deadlineDate: { $gte: new Date() },
      })
        .populate("description")
        .populate("qualification")
        .populate("workExperience")
        .populate("workMode")
        .populate("sector")
        .populate("country")
        .populate("province")
        .populate("jobPostDate")
        .populate("jobPostedById")
        .populate("deadlineDate")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(startIndex);

      // console.log({ "Total Active Jobs": jobs });

      if (endIndex < numJobsInDB) {
        result.next = { page: page + 1, limit: limit };
      }
      if (startIndex > 0) {
        result.previous = { page: page - 1, limit: limit };
      }

      result.result = jobs;
      result.user = user;
      result.numJobsInDB = numJobsInDB;
      result.totalJobs = totalJobs;
      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Something Went Wrong Trying to Fetch All Jobs From Database",
        error: error.message,
      });
    }
  },

  downloadJobFileByRecruiter: async (req, res) => {
    const { slug } = req.params;
    const jobFile = await Job.findOne({ slug: slug });

    if (!jobFile) {
      return next(new Error("No Matrix File Found"));
    }
    const fileDownload = jobFile.filePath;
    const jobFilePath = path.join(__dirname, `../${fileDownload}`);
    res.download(jobFilePath);
  },

  fetchJobByIdController: async (req, res) => {
    try {
      const { slug } = req.params;

      const job = await Job.findOne({ slug })
        .populate("filePath")
        .populate("qualification")
        .populate("workExperience")
        .populate("workMode")
        .populate("sector")
        .populate("country")
        .populate("province")
        .populate("jobPostDate")
        .populate("jobPostedById")
        .populate("deadlineDate");
      res
        .status(200)
        .send({ success: true, message: "Job Details Found", job });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Something Went Wrong Trying to Fetch This Job From Database",
        error,
      });
    }
  },

  fetchSingleJobController: async (req, res) => {
    try {
      //const { slug } = req.params;

      const job = await Job.findOne({ slug: req.params.slug })
        .populate("qualification")
        .populate("workExperience")
        .populate("workMode")
        .populate("sector")
        .populate("country")
        .populate("province")
        .populate("jobPostDate")
        .populate("jobPostedById")
        .populate("deadlineDate")
        .exec();
      if (!job)
        return res
          .status(404)
          .send({ success: false, message: "Job not found." });
      res
        .status(200)
        .send({ success: true, message: "Job Details Found", job });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Something Went Wrong Trying to Fetch This Job From Database",
        error,
      });
    }
  },

  // get Job Attached File
  fetchJobFileController: async (req, res) => {
    try {
      const job = await Job.findById(req.params.jid).select("filePath");
      if (job.filePath.data) {
        res.set("Content-type", job.filePath.contentType);
        return res.status(200).send(job.filePath.data);
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error in getting Job File",
        error,
      });
    }
  },

  // delete Job
  deleteJobController: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);

      const { slug } = req.params;
      const deletedJob = await Job.findOneAndDelete({ slug: slug }).select(
        "-filePath"
      );

      user.jobsPostedBy.pop(deletedJob._id);
      await user.save();
      res.status(200).send({
        success: true,
        message: "Job deleted successfully",
        deletedJob,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send({ success: false, message: "Error while deleting Job", error });
    }
  },

  updateJobController: async (req, res) => {
    const { title, country, province, ...updateFields } = req.body;

    if (title) {
      updateFields.title = title; // Update title if provided
      updateFields.slug = slugify(title); // Always update slug
    }
    // Add country and province to updateFields
    if (country) {
      updateFields.country = country;
    }
    if (province) {
      updateFields.province = province;
    }
    try {
      const userId = req.user._id;
      // Verify the user
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      }

      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const updatedJob = await Job.findOneAndUpdate(
        { slug: req.params.slug },
        updateFields,
        { new: true }
      );

      if (!updatedJob) {
        return res
          .status(404)
          .json({ success: false, message: "Job not found for update" });
      }

      console.log("Updated Job Id:", updatedJob._id);

      res.status(200).json({
        success: true,
        message: "Job updated successfully!",
        job: updatedJob,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error in updating Job",
        error: error.message,
      });
    }
  },

  fetchJobBySlugController: async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.params.id });
      const { slug } = req.params;
      const job = await Job.findOne({ slug }).populate([
        "title",
        "description",
        "qualification",
        "workExperience",
        "workMode",
        {
          path: "sector",
          select: "slug sectorName",
        },
        {
          path: "jobApplications",
          select:
            "status user job appliedJobs applicationDate salary rate resume jobMatrix",
        },
        "applicationCount",
        "country",
        "province",
        "jobPostDate",
        "jobPostedById",
        "deadlineDate",
      ]);

      console.log({ "User Detail": user });
      console.log({ "Job ID Details": job });

      // check if the loggedIn user Already Applied for This particular Job.
      const totalAppliedApplicant =
        await ApplicantJobApplication.countDocuments({ job: job._id });

      // console.log("Job Applicantion Status: ", applicationStatus);
      console.log("Job Applicantions: ", totalAppliedApplicant);

      res.status(200).send({
        success: true,
        message: "Job Details Found",
        job,
        totalAppliedApplicant,
      });
    } catch (error) {
      console.log(error);
    }
  },

  filterJobsBySector: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const result = {};

    try {
      const sectorIds = await Job.distinct("sector", {
        deadlineDate: { $gte: new Date() },
      })
        .sort("-createdAt")
        .exec();

      const totalSectors = await Sector.countDocuments({
        _id: { $in: sectorIds },
      });
      const numSectorsInDB = await Sector.countDocuments({
        _id: { $in: sectorIds },
      });

      const sectors = await Sector.find({ _id: { $in: sectorIds } })
        .limit(limit)
        .skip(startIndex);

      if (endIndex < numSectorsInDB) {
        result.next = { page: page + 1, limit: limit };
      }
      if (startIndex > 0) {
        result.previous = { page: page - 1, limit: limit };
      }
      console.log(sectors);

      result.result = sectors;
      result.numSectorsInDB = numSectorsInDB;
      result.totalSectors = totalSectors;

      res.json(result);
    } catch (error) {
      console.error("Error fetching sector IDs:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  fetchJobRelatedSectors: async (req, res) => {
    try {
      const skip = parseInt(req.query.skip);
      const limit = parseInt(req.query.limit);

      const sectorIds = await Job.distinct("sector", {
        deadlineDate: { $gte: new Date() },
      })
        .sort("-createdAt")
        .exec();

      const sectors = await Sector.find({ _id: { $in: sectorIds } })
        .skip(skip)
        .limit(limit);

      res.json(sectors);
    } catch (error) {
      res.status(400).json({
        error: "Error fetching items from database",
      });
    }
  },

  filterJobsByWorkMode: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const result = {};
    try {
      const wMIds = await Job.distinct("workMode", {
        deadlineDate: { $gte: new Date() },
      })
        .sort("-createdAt")
        .exec();

      const totalWorkModes = await WorkMode.countDocuments({
        _id: { $in: wMIds },
      });
      const numWorkModesInDB = await WorkMode.countDocuments({
        _id: { $in: wMIds },
      });
      const workModes = await WorkMode.find({
        _id: { $in: wMIds },
      })
        .limit(limit)
        .skip(startIndex);
      if (endIndex < numWorkModesInDB) {
        result.next = { page: page + 1, limit: limit };
      }
      console.log(workModes);
      result.result = workModes;
      result.numWorkModesInDB = numWorkModesInDB;
      result.totalWorkModes = totalWorkModes;
      res.json(result);
    } catch (error) {
      console.error("Error fetching Work Mode IDs:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  filterJobByWorkExperience: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const result = {};
    try {
      const workExperienceIds = await Job.distinct("workExperience", {
        deadlineDate: { $gte: new Date() },
      })
        .sort("-createdAt")
        .exec();

      const totalWorkExperiences = await WorkExperience.countDocuments({
        _id: { $in: workExperienceIds },
      });
      const numWorkExperiencesInDB = await WorkExperience.countDocuments({
        _id: { $in: workExperienceIds },
      });
      const workExperiences = await WorkExperience.find({
        _id: { $in: workExperienceIds },
      })
        .limit(limit)
        .skip(startIndex);
      if (endIndex < numWorkExperiencesInDB) {
        result.next = { page: page + 1, limit: limit };
      }
      console.log(workExperiences);
      result.result = workExperiences;
      result.numWorkExperiencesInDB = numWorkExperiencesInDB;
      result.totalWorkExperiences = totalWorkExperiences;
      res.json(result);
    } catch (error) {
      console.error("Error fetching Work Experience IDs:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  filterJobByCountries: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const result = {};
    try {
      const countryIds = await Job.distinct("country", {
        deadlineDate: { $gte: new Date() },
      })
        .sort("-createdAt")
        .exec();

      const totalCountries = await Country.countDocuments({
        _id: { $in: countryIds },
      });
      const numCountriesInDB = await Country.countDocuments({
        _id: { $in: countryIds },
      });
      const countries = await Country.find({
        _id: { $in: countryIds },
      })
        .limit(limit)
        .skip(startIndex);
      if (endIndex < numCountriesInDB) {
        result.next = { page: page + 1, limit: limit };
      }
      console.log(countries);
      result.result = countries;
      result.numCountriesInDB = numCountriesInDB;
      result.totalCountries = totalCountries;
      res.json(result);
    } catch (error) {
      console.error("Error fetching Country IDs:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  filterJobsByNumber: async (req, res) => {
    const FIRST_BATCH = 20;
    const SECOND_BATCH = 50;
    const THIRD_BATCH = 100;
    const ALL = "all";

    try {
      const result = {};

      const query = { deadlineDate: { $gte: new Date() } };

      const populateFields = [
        "title",
        "description",
        "qualification",
        "workExperience",
        "workMode",
        {
          path: "sector",
          select: "slug sectorName",
        },
        {
          path: "jobApplications",
          select:
            "status user job appliedJobs applicationDate salary rate resume jobMatrix",
        },
        "applicationCount",
        "country",
        "province",
        "jobPostDate",
        "jobPostedById",
        "deadlineDate",
      ];

      const totalJobs = await Job.countDocuments(query);
      const numJobsInDB = await Job.countDocuments(query);
      const totalAppliedApplicant =
        await ApplicantJobApplication.countDocuments();

      const jobs = await Job.find(query).populate(populateFields).lean().exec();

      result.result = jobs;
      result.FIRST_BATCH = FIRST_BATCH;
      result.SECOND_BATCH = SECOND_BATCH;
      result.THIRD_BATCH = THIRD_BATCH;
      result.ALL = ALL;

      result.numJobsInDB = numJobsInDB;
      result.totalJobs = totalJobs;
      result.totalAppliedApplicant = totalAppliedApplicant;

      res.json(result);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Something Went Wrong While Filtering Jobs By Number" });
    }
  },
  /**
   * Fetch all jobs applied by applicants with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Paginated list of applied jobs
   */
  fetchAllAppliedJobsByApplicants: async (req, res) => {
    try {
      console.log("Fetching applied jobs...");
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      // Get total number of applied jobs
      const totalAppliedApplicant =
        await ApplicantJobApplication.countDocuments({
          status: "Applied",
        });

      // Fetch applied jobs with pagination and population
      const applicantAppliedJobs = await ApplicantJobApplication.find({
        status: "Applied",
      })
        .populate([
          {
            path: "user",
            select: "firstname lastname email phone",
          },
          {
            path: "job",
            select: "_id title slug description",
          },
          {
            path: "salary",
            select: "salaryName",
          },
          "rate",
          "jobMatrix",
          "status",
          {
            path: "appliedJobs",
            select:
              "status user job appliedJobs applicationDate salary rate resume jobMatrix",
          },
        ])
        .sort({ applicationDate: -1 })
        .limit(limit)
        .skip(startIndex);

      // Build pagination result
      const result = buildPaginationResult(
        page,
        limit,
        startIndex,
        endIndex,
        totalAppliedApplicant
      );

      // Add applied jobs and count to result
      result.result = applicantAppliedJobs;
      result.totalAppliedApplicant = totalAppliedApplicant;

      console.log("All Active Applicant Count:", totalAppliedApplicant);

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res, "fetch applied jobs");
    }
  },
  /**
   * Fetch all registered users with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Paginated list of users
   */
  fetchRegisteredUsers: async (req, res) => {
    try {
      console.log("Fetching registered users...");
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      // Get total registered users count (use once and reuse)
      const totalRegUsers = await User.countDocuments();

      // Build user query with population
      const users = await User.find({})
        .populate([
          "firstname",
          "lastname",
          "email",
          "phone",
          "isVerified",
          "isBlocked",
          "photo",
          {
            path: "country",
            select: "countryName",
          },
          "status",
          "role",
          "workAuthorization",
          {
            path: "jobsPostedBy",
            select:
              "title country province provinceFile sector expiryDate applicationCount jobApplications startDate",
          },
          "registeredDate",
          {
            path: "appliedJobs",
            select:
              "status user job appliedJobs applicationDate salary rate resume jobMatrix",
          },
        ])
        .lean()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(startIndex);

      // Build pagination result
      const result = buildPaginationResult(
        page,
        limit,
        startIndex,
        endIndex,
        totalRegUsers
      );

      // Add users to result
      result.result = users;
      result.numRegUsersInDB = totalRegUsers; // Use the same count for both values
      result.totalRegUsers = totalRegUsers;

      console.log("Registered Users List retrieved successfully");

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res, "fetch registered users");
    }
  },
  /**
   * Fetch all jobs with filtering and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Paginated list of jobs
   */
  fetchAllPostedJobs: async (req, res) => {
    try {
      console.log("Fetching all posted jobs...");
      const { search, sectors, page = 1, limit = 6 } = req.query;
      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      const startIndex = (parsedPage - 1) * parsedLimit;
      const endIndex = parsedPage * parsedLimit;

      // Base query for active jobs
      const query = { deadlineDate: { $gte: new Date() } };

      // Add search filter if provided
      if (search) {
        query.title = { $regex: search, $options: "i" };
      }

      // Get total counts - executed in parallel
      const [totalJobs, totalAppliedApplicant] = await Promise.all([
        Job.countDocuments(query),
        ApplicantJobApplication.countDocuments(),
      ]);

      // Fetch jobs with pagination and population
      let jobs = await Job.find(query)
        .populate([
          "description",
          "qualification",
          "workExperience",
          "workMode",
          {
            path: "sector",
            select: "slug sectorName",
          },
          {
            path: "jobApplications",
            select:
              "status user job appliedJobs applicationDate salary rate resume jobMatrix",
          },
          "applicationCount",
          "country",
          "province",
          "jobPostDate",
          "jobPostedById",
          "deadlineDate",
        ])
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .skip(startIndex);

      // Filter by sectors if provided
      if (sectors) {
        const selectedSectors = await Sector.find({
          sectorName: { $in: sectors.split(",") },
        });

        jobs = jobs.filter((job) =>
          selectedSectors.some((sector) => sector.slug === job.sector?.slug)
        );
      }

      // Build pagination result
      const result = buildPaginationResult(
        parsedPage,
        parsedLimit,
        startIndex,
        endIndex,
        totalJobs
      );

      // Add jobs and counts to result
      result.result = jobs;
      result.numJobsInDB = totalJobs;
      result.totalJobs = totalJobs;
      result.totalAppliedApplicant = totalAppliedApplicant;

      console.log(`Found ${totalJobs} active jobs`);
      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res, "fetch jobs");
    }
  },
};
