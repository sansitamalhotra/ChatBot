const multer = require("multer");
const ApplicantJobApplication = require("../models/applicantJobApplicationModel");
const User = require("../models/userModel");
const Job = require("../models/jobModel");
const { clearResume, dateFormatter } = require("../utils/helper");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const fs = require('fs');
const path = require('path');


module.exports = {

    applyJobApplication: async (req, res) => {
  
      try {
  
        const { path: resume } = req.files['resume'][0];
        const { path: jobMatrix } = req.files && req.files['jobMatrix'] ? req.files['jobMatrix'][0] : {};
  
        const userId = req.user._id;
        const user = await User.findById(userId);
        const { slug } = req.params;
  
        const job = await Job.findOne({ slug });
  
        console.log({ "User Detail": user });
        console.log({ "Job ID Details": job });
  
        if (!job) {
          return res.status(404).json({ message: "Job Not Found!!!" });
        }
  
        if (!user) {
          return res.status(404).json({
            message: "User Not Authenticated Yet, Kindly Login or Register !!!",
          });
        }
  
        const appliedJob = await ApplicantJobApplication.findOne({
          user: userId,
          job: job,
        });
  
        if (appliedJob) {
          return res
            .status(400)
            .json({ message: "You have already applied for this job!!!" });
        }
  
        const { salary, rate } = req.body;       
  
        const newJobApplication = new ApplicantJobApplication({
          user: user._id,
          job: job._id,
          salary: salary,
          rate: rate,
          resume,
          jobMatrix: jobMatrix || null,
          appliedJobs: user._id,
          applicationDate: Date.now(),
          status: "Applied",
        });
  
        console.log("New Job Application Details: ", newJobApplication);
        await newJobApplication.save();
        user.appliedJobs.push(newJobApplication._id);
        await user.save();
  
        job.jobApplications.push(newJobApplication._id);
        job.applicationCount++;
        await job.save();
  
         // Configure Nodemailer transporter
         const transporter = nodemailer.createTransport(
          smtpTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_NOTIFICATION_USER,
              pass: process.env.EMAIL_NOTIFICATION_PASS,
            },
          })
        );
        //const emailAddresses = ["kenny.offor@thethinkbeyond.com"];
        const emailAddresses = ["hrpspl@prosoftsynergies.com"];
  
        emailAddresses.forEach((emailTo) => {
          // Configure Email Options
          const mailOptions = {
            from: "ProsoftSynergies <hrpspl@prosoftsynergies.com>",
            to: emailTo,
            subject: `New Job Application Received from ${user.firstname}`,
            text: `A New Job Application has been Received from: \n\nApplied Job: ${job.title}\n\nFirst Name: ${user.firstname}\nLast Name: ${user.lastname}\nEmail: ${user.email}\nPhone: ${user.phone}\nApplied On: ${newJobApplication.applicationDate}\n\nRate: ${newJobApplication.rate}\nDownload Resume or Matrix Files below:`,
            attachments: [
              {
                filename: newJobApplication.resume,
                path: newJobApplication.resume,
              },
              {
                filename: newJobApplication.jobMatrix,
                path: newJobApplication.jobMatrix,
              }
            ],
          };
  
          // Send Emails
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("Error occurred while sending emails", error);
              console.log(error);
            } else {
              console.log("Email sent successfully", info.response);
            }
          });
        });
  
         // send Email Notification to Applicant after Job is Applied
         const transporterApplicant = nodemailer.createTransport(
          smtpTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_NOTIFICATION_USER,
              pass: process.env.EMAIL_NOTIFICATION_PASS,
            },
          })
        );
  
        const applicantMailOptions = {
          from: "ProsoftSynergies <hrpspl@prosoftsynergies.com>",
          to: user.email,
          subject: `${user.firstname} Your job application was successfully submitted`,
          text: `${user.firstname} ${user.lastname}\n
          Thanks for applying for this role via ProsoftSynergies Consulting. Your Job application for the role: ${job.title}\n 
          has been received and we will review it as soon as possible.\n
          If your application seems like a good fit for the position we will contact you soon.\n
          Regards,\n
          ProsoftSynergies Consulting`
        };
  
        transporterApplicant.sendMail(applicantMailOptions, (error, info) => {
          if (error) {
            console.log("Error occurred while sending emails", error);
            console.log(error);
          } else {
            console.log("Email sent successfully", info.response);
          }
        }); 
  
        res
          .status(201)
          .json({ message: "Job Application Submitted Successfully!!!", newJobApplication });
      } 
      catch (error) 
      {
        console.log(error);
        res.status(500).json({
          success: false,
          message: "Oppss!! Server Not Reachable at the Moment!!",
          error,
        });
      }
  },
  
    fetchApplicantAppliedJobs: async (req, res, next) => {
      try {
    
        const applicantAppliedJobs = await ApplicantJobApplication.find({ status: "Applied" }).populate(['user', 'job']);
        
  
        res.status(200).json({ message: "Fetched Successfully", applicantAppliedJobs});
      } 
      catch (error) 
      {
        console.log(error);
        res.status(500).send({
          success: false,
          message: "Something Went Wrong Trying to Fetch This Job From Database",
          error,
        });
      }
    },
  
    fetchApplicantAppliedJobsById: async (req, res, next) => {
      try
      {
        const jobsAppliedByApplicant = await ApplicantJobApplication.find({
          status: 'Applied',
          user: req.params.id,
          job: req.params.id
        }).populate(['user', 'job']);
  
        res.json(jobsAppliedByApplicant);
      }
      catch (error)
      {
        console.log(error.message);
        res.status(500).send(`Something Went Wrong Trying to Fetch Applied Jobs By Applicant ID From Database${error.message}`);
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
  
};
