const User = require("../models/userModel");
const Applicant = require("../models/applicantModel");
const ApplicantEducation = require("../models/applicantEducationModel");
const ApplicantCountry = require("../models/applicantCountryModel");
const Skill = require("../models/skillModel");
const ApplicantExperience = require("../models/applicantExperienceModel");
const slugify = require("slugify");



module.exports = {

    fetchUserProfile: async (req, res) => {

        try
        {
            //const userId = req.user._id;
            const user = await User.findOne({ userId: req.user._id }).populate(
                'User', [
                    "firstname",
                    "lastname",
                    "email",
                    "phone",
                    "photo",
                    "role",
                    "country",
                    "workAuthorization",
                    "isVerified",
                    "status",
                    "appliedJobs",
                    "registeredDate",
                    "createdAt",
                    "updatedAt"
                ]
            );
            console.log("User Profile: ", user);
            if (!user) {
                res.status(400).send({ success: false, message: 'No User Found!!!' });
              }
          res.status(200).json(user);
        }
        catch (error)
        {
            console.log(error);
            res.status(500).send({ success: false, message: "Something Went Wrong While Fetcing User Profile!!" });
        }

    },

    fetchApplicantProfile: async (req, res) => {
        try 
        {
            const applicant = await Applicant.findOne({ userId: req.user.id });        
            res.json(applicant);        
        } 
        catch (error) 
        {        
        console.error(error);        
        res.status(500).json({ message: 'Error getting applicant profile' });        
        }
    },

    updateApplicantProfile: async (req, res) => {
        
        try
        { 
            //const userId = req.user._id;
            const applicant = await Applicant.findOne({ userId: req.user._id });
            if (!applicant) {
                res.status(404).send({ success: false, message: "Applicant Not FOUND!!!." });
            }
            applicant.github = req.body.github;
            applicant.linkedin = req.body.linkedin;
            applicant.gender = req.body.gender;
            applicant.skills = req.body.skills;
            if (req.file) {
                applicant.profilePhoto = {          
                  data: req.file.buffer,          
                  contentType: req.file.mimetype          
                };          
            }
            applicant.academicQualifications = req.body.academicQualifications;
            applicant.experiences = req.body.experiences;
            await applicant.save();
            console.log("Applicant Profile :", applicant);
            res.status(200).send({ succeess: false, message: "Applicant Profile Updated Successfully!!!", applicant });
        }
        catch (error)
        {
            console.log(error);
            res.status(500).json({ success: false, message: 'Something Went Wrong Trying to Update your Profile!!.' });
        }

    },

    addAcademicQualification: async (req, res) =>  {
        try {
            const userId = req.user._id;
            const user = await User.findById(userId);

            const {
              qualification,
              institution,
              fieldOfStudy,
              startYear,
              finishYear,
              current,
              country
            } = req.body;

            const isCurrent = current === 'true';

            console.log("Institution Name", institution);
            
            const updatedOn = Date.now();
        
            const newApplicantEduData = new ApplicantEducation({
              qualification: qualification,
              institution: institution,
              fieldOfStudy:fieldOfStudy,
              startYear:startYear,
              finishYear:finishYear,
              current:isCurrent,
              country:country,
              updatedOn:updatedOn,
              userId: user,
            });
        
            console.log({ "Updated Applicant Education": newApplicantEduData });
            console.log({ "Updated By Applicant": userId });
            await newApplicantEduData.save();
        
            res.status(201).json(`Applicant Education Qualification by User: ${user.firstname}, is Successfully Updated !!! `);
          } 
          catch (error) 
          {
            console.log(error);
            res.status(500).json({ succeess: false, message: "An Error Occurred While Adding New Education Qualification" });
          }
    },

    fetchApplicationEducation: async (req, res) => {  
        try
        {
            const result = {};
            const userId = req.user._id;
            const user = await User.findById(userId);

            const applicantEducationHistory = await ApplicantEducation.find({ userId })
                .populate("userId")
                .populate("qualification")
                .populate("institution")
                .populate("fieldOfStudy")
                .populate("startYear")
                .populate("finishYear")
                .populate("current")
                .populate("country")
                .populate("updatedOn").sort({ updatedOn: -1 });

            console.log({ 'Applicant': user }); // check if the logged in
            console.log({ 'Applicant Education History': applicantEducationHistory }); // check if the logged in

            result.result = applicantEducationHistory;
            result.user = user;

            res.status(200).json(result);
        }
        catch (error) 
          {
            console.log(error);
            res.status(500).json({ success: false, message: "An Error Occurred While Fetching Applicant Education Qualification" });
          }
    },

    // fetch all countries
   fetchApplicantCountries: async (req, res) => {
    try {
      const sort = { name: 1 };
      const country = await ApplicantCountry.find().sort(sort);
      res.status(200).send({
        success: true,
        message: "All Applicant Countries Fetched Successfully!!",
        country
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        error,
        message:
          "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch All Applicant Countries"
      });
    }
  },

    fetchEducation: async (req, res) => {
        try {
          const applicantEdu = await ApplicantEducation.findById(req.params.id)
            .populate("userId")
            .populate("qualification")
            .populate("institution")
            .populate("fieldOfStudy")
            .populate("startYear")
            .populate("finishYear")
            .populate("current")
            .populate("country")
            .populate("updatedOn");
      
          res.status(200).send({ success: true, message: "Applicant Education Found", applicantEdu });
        } catch (error) {
          console.log(error);
          res.status(500).send({
            success: false,
            message: "Something Went Wrong Trying to Fetch This Applicant Education From Database",
            error,
          });
        }
    },

    // delete Application Education
    deleteApplicationEducation: async (req, res) => {
        try {
            const userId = req.user._id;
            const user = await User.findById(userId);
            const deleteEducation = await ApplicantEducation.findOneAndDelete({ userId: user});
    
            if (!deleteEducation) {
                return res.status(404).send({ success: false, message: "Education record not found" });
            }
            console.log("Delete Education :", deleteEducation);
    
            res.status(200).send({ success: true, message: "Applicant Education deleted successfully", deleteEducation });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, message: "Error while deleting Applicant Education", error });
        }
    },

     //  ================= Find LoggedIn User By Id Starts ========== //
     fetchLoggedInUserById: async (req, res) => {
        try {
            const { _id: userId } = req.user;
            const userDetails = await User.findById(userId).populate([
                "firstname",
                "lastname",
                "email",
                "phone",
                "isVerified",
                "isBlocked",
                "photo",
                "country",
                "status",
                "role",
                "workAuthorization",
                "jobsPostedBy",
                "registeredDate",
                "appliedJobs"
            ]);
            res.status(200).send({ success: true, message: "User Detail Found", user: userDetails });
        }  catch (error) {
            console.log(error);
            res.status(500).send({ success: false, message: "Error while Fetching User By ID", error });
        }
    },

    updateUserPhoto: async (req, res) => {
        try {
          const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User Not Authenticated Yet, Kindly Login or Register !!!"
            });
        }
    
        const updatedUser = await User.findByIdAndUpdate(user._id, { photo: req.file.path }, { new: true });
    
        res.status(200).send({ success: true, message: "User Photo Updated Successfully!!.", updatedUser });
      } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
      }
    },  
    //  ================= Find LoggedIn User By Id Ends ========== //


  addApplicantSkills: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);
      console.log("User ID :", user);
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }  
      const skills = Array.isArray(req.body.skills)? req.body.skills : [req.body.skills];
      const newSkills = [];  
      for (const name of skills) {
        const slug = slugify(name.trim());
        const existingSkill = await Skill.findOne({ slug, user });
        if (existingSkill) {
          return res.status(400).send({ message: 'Skill Already Exists' });
        }  
        if (user.skills.length >= 15) {
          return res.status(400).json({ message: 'You have reached the Maximum Number of Skills' });
        }  
        const newSkill = new Skill({ name: name.trim(), userId: user._id, slug });
        newSkills.push(newSkill);
      }  
      await Promise.all(newSkills.map(skill => skill.save()));
      user.skills.push(...newSkills);
      await user.save();
  
      res.status(201).send({ success: true, message: `New Skills are Successfully Added By ${user.firstname}!`, newSkills });
      } catch (error) {
        console.log(error);
        return res.status(500).send({ success: false, message: "An Error Occurred While Adding New Skill" });
      }
    },
    

    fetchApplicantSkills: async (req, res) => {
      try {
        const result = {};
        const userId = req.user._id;
        const user = await User.findById(userId);
        const applicantSkillSet = await Skill.find({ userId }).sort({ updatedOn: -1 });

        console.log({ 'Applicant User ID': user }); // check if the logged in
        console.log({ 'Applicant Skills': applicantSkillSet }); // check if the logged in

        result.result = applicantSkillSet;
        result.user = user;

        res.status(200).json(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "An Error Occurred While Fetching Applicant Skills" });
      }
    },

    fetchApplicantSkill: async (req, res) => {
      try {
        const applicantSkill = await Skill.findById(req.params.id)
          .populate("userId")
          .populate("name")
          .populate("updatedOn");
    
        res.status(200).send({ success: true, message: "Applicant Skill Found", applicantSkill });
      } catch (error) {
        console.log(error);
        res.status(500).send({
          success: false,
          message: "Something Went Wrong Trying to Fetch This Applicant Skill From Database",
          error,
        });
      }
    },

    deleteApplicantSkill: async (req, res) => {
      try {

          const { id } = req.params;
          const userId = req.user._id;
          const user = await User.findById(userId);
          const deleteSkill = await Skill.findOneAndDelete({ userId, _id: id });
          user.skills.pull(deleteSkill._id);
          await user.save();  
          if (!deleteSkill) {
              return res.status(404).send({ success: false, message: "Skill record not found" });
          }
          console.log("Deleted Applicant Skill :", deleteSkill);  
          res.status(200).send({ success: true, message: "Applicant Skill deleted successfully", deleteSkill });
      } catch (error) {
          console.log(error);
          res.status(500).send({ success: false, message: "Error while deleting Applicant Skill", error });
      }
  },

  addApplicantWorkExperience: async (req, res) =>  {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        const {
          designation,
          company,
          responsibilities,
          startYear,
          finishYear,
          current,
          country
        } = req.body;

        const isCurrent = current === 'true';

        console.log("Institution Name", designation);
        
        const updatedOn = Date.now();
    
        const newApplicantExpData = new ApplicantExperience({
          designation: designation,
          company: company,
          responsibilities:responsibilities,
          startYear:startYear,
          finishYear:finishYear,
          current:isCurrent,
          country:country,
          updatedOn:updatedOn,
          userId: user,
        });
    
        console.log({ "New Applicant Job Experience": newApplicantExpData });
        console.log({ "Updated By Applicant": userId });
        await newApplicantExpData.save();
    
        res.status(200).send({ success: true, message: `Applicant Job Experience by User: ${user.firstname}, is Successfully Updated !!! `});
      } 
      catch (error) 
      {
        console.log(error);
        res.status(500).json({ succeess: false, message: "An Error Occurred While Adding New Job Experience" });
      }
  },
  fetchApplicantExperience: async (req, res) => {  
        try
        {
            const result = {};
            const userId = req.user._id;
          const user = await User.findById(userId);

            const applicantExperience = await ApplicantExperience.find({ userId })
                .populate("userId")
                .populate("designation")
                .populate("company")
                .populate("responsibilities")
                .populate("startYear")
                .populate("finishYear")
                .populate("current")
                .populate("country")
                .populate("updatedOn").sort({ updatedOn: -1 });

            console.log({ 'Applicant Experience': user }); // check if the logged in
            console.log({ 'Applicant Job Experience': applicantExperience }); // check if the logged in

            result.result = applicantExperience;
            result.user = user;

            res.status(200).json(result);
        }
        catch (error) 
          {
            console.log(error);
            res.status(500).json({ succeess: false, message: "An Error Occurred While Fetching Applicant Job Experience" });
          }
    },
    fetchApplicantExperienceById: async (req, res) => {
      try {
        const applicantExp = await ApplicantExperience.findById(req.params.id)
          .populate("userId")
          .populate("designation")
          .populate("company")
          .populate("responsibilities")
          .populate("startYear")
          .populate("finishYear")
          .populate("current")
          .populate("country")
          .populate("updatedOn");
    
        res.status(200).send({ success: true, message: "Applicant Job Experience Found", applicantExp });
      } catch (error) {
        console.log(error);
        res.status(500).send({
          success: false,
          message: "Something Went Wrong Trying to Fetch This Applicant Job Experience From Database",
          error,
        });
      }
  },
  deleteApplicationExperience: async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const deleteExperience = await ApplicantExperience.findOneAndDelete({ userId: user});

        if (!deleteExperience) {
            return res.status(404).send({ success: false, message: "Experience record not found" });
        }
        console.log("Deleted Job Experience :", deleteExperience);

        res.status(200).send({ success: true, message: "Applicant Job Experience deleted successfully", deleteExperience });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error while deleting Applicant Job Experience", error });
    }
  },
};
