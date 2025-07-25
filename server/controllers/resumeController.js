const User = require("../models/userModel");
const Resume = require("../models/resumeModel");
const fs = require('fs');
const path = require('path');
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

module.exports = {
    uploadResume: async (req, res) => {
        try
        {
            const { path: resume } = req.files["resume"][0];
            const userId = req.user._id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(401).json({ message: "User is not Authenticated Yet, Kindly Login or Register !!!" });
            }
            // if (user.resumes.length >= 3) {
            //     return res.status(400).json({ message: 'You have reached the Maximum Number of Resumes' });
            // }
            const newResume = new Resume({ userId: user._id, resume });
            await newResume.save();
            user.resumes.push(newResume._id);
            await user.save();

            // Set up the Nodemailer transporter
            const transporter = nodemailer.createTransport(
                smtpTransport({
                  service: "gmail",
                  host: "smtp.gmail.com",
                  port: 465,
                  secure: true,
                  auth: {
                    user: process.env.EMAIL_NOTIFICATION_USER,
                    pass: process.env.EMAIL_NOTIFICATION_PASS,
                  }
                })
            );
            const mailOptions = {
                from: 'ProsoftSynergies <hrpspl@prosoftsynergies.com>',
                //to: ['kenny.offor@thethinkbeyond.com', 'hrpspl@prosoftsynergies.com'],
                to: ['hrpspl@prosoftsynergies.com'],
                subject: 'New Resume Uploaded on PSPL',
                text: `A new resume has been uploaded by ${user.firstname} ${user.lastname} on PSPL Website. \nBelow is ${user.firstname} ${user.lastname}'s Newly Uploaded Resume File Attachment`,
                attachments: [
                    {
                        filename: req.files["resume"][0].originalname, // Use original file name
                        path: resume,
                    },
                ],
            };
    
            // Send email
            await transporter.sendMail(mailOptions);
    
            res.status(201).json({
                success: true,
                message: `Resume uploaded successfully by ${user.firstname} ${user.lastname}!!!`,
                newResume
            });
        }
        catch (error)
        {
            console.log(error);
            res.status(500).json({ success: false, message: "Error Uploading Resume "});
        }
    },
    fetchResumes: async (req, res) => {
        try
        {
            const result = {};
            const userId = req.user._id;
            const user = await User.findById(userId);

            const applicantResume = await Resume.find({ userId })
                .populate("userId")
                .populate("resume")
                .populate("uploadedOn").sort({ uploadedOn: -1 });
            console.log({ 'LoggedIn User': user }); // check if the logged in
            console.log({ 'Applicant Resumes': applicantResume });

            result.result = applicantResume;
            result.user = user;
            res.status(200).json(result);
        }
        catch (error)
        {
            console.log(error);
            res.status(500).json({ success: false, message: "An Error Occurred While Fetching Applicant Resumes" });
        }
    },

    fetchResume: async (req, res) => {
        try {
          const applicantResume = await Resume.findById(req.params.id)
            .populate("userId")
            .populate("resume")
            .populate("uploadedOn")
      
          res.status(200).send({ success: true, message: "Applicant Resume Found", applicantResume });
        } catch (error) {
          console.log(error);
          res.status(500).send({
            success: false,
            message: "Something Went Wrong Trying to Fetch This Applicant Resume From Database",
            error,
          });
        }
    },

    deleteResume: async (req, res) => {
        try {
            const userId = req.user._id;
            const user = await User.findById(userId);
            const deleteResume = await Resume.findOneAndDelete({ userId: user});

            // Assuming the file attachment is stored in a 'file' field in the task document
            const resumePath = deleteResume.resume;
            if (resumePath) {
                // Use a library like fs to delete the file
                const fs = require('fs');
                fs.unlinkSync(resumePath);
            }
    
            if (!deleteResume) {
                return res.status(404).send({ success: false, message: "Resume record not found" });
            }
            

            console.log("Deleted Resume :", deleteResume);
            
            user.resumes.pop(deleteResume._id);
            await user.save();
    
            res.status(200).send({ success: true, message: "Applicant Resume deleted successfully", deleteResume });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, message: "Error while deleting Applicant Resume", error });
        }
    },

};

