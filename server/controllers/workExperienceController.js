const express = require('express');
const WorkExperience = require("../models/workExperience");
const slugify = require("slugify");


module.exports = {

    // fetch all Work Experience
    fetchWorkExperiences: async (req, res) => {

        try 
        {
            const workExperiences = await WorkExperience.find().sort({ createdAt: -1 });
            res.status(200).send({ success: true, message: "All Work Experiences Fetched Successfully!!", workExperiences });
        } 
        catch (error) 
        {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch All Work Experiences" });
        }
    },

    // Add Work Experience
    addWorkExperience: async(req, res) => {
        try {
            const { workExperienceName } = req.body;
            if (!workExperienceName) {
                return res.status(401).send({ message: "Work Experience Name is REQUIRED!!!" });
            }
            const workExperienceExist = await WorkExperience.findOne({ workExperienceName });
            if (workExperienceExist) {
                return res.status(200).send({ success: true, message: "Work Experience Already EXISTS" });
            }
            const workExperience = await new WorkExperience({ workExperienceName, slug: slugify(workExperienceName) }).save();
            res.status(201).send({ success: true, message: "New Work Experience is Added Successfully!!!", workExperience })
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong Trying to Add New Work Experience, Server Could Not be REACHED AT THIS MOMENT!!!!" });
        }
    },

    // Update Work Experience
    updateWorkExperience: async (req, res) => {

        try 
        {
            const { workExperienceName } = req.body;
            const { id } = req.params;
            const workExperience = await WorkExperience.findByIdAndUpdate(id, {workExperienceName, slug: slugify(workExperienceName)}, {new:true})
            res.status(200).send({ success: true, message: "Work Experience Name is Updated Successfully!!!",
            workExperience });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT, could not Update Work Experience" });
        }
    },

    // Fetch Work Experience By ID
    fetchWorkExperienceById: async(req, res) => {
        try {
            const workExperience = await WorkExperience.findOne({ slug: req.params.slug });
            res.status(200).send({ success: true, message: "Work Experience ID fetched Successfully!!!", workExperience });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch Work Experience By ID" });
        }
    },

    // Delete Work Experience By ID
    deleteWorkExperienceById: async(req, res) => {
        try 
        {
            const { id } = req.params;
            await WorkExperience.findByIdAndDelete(id);
            res.status(200).send({ success: true, message: "Work Experience is Successfully Deleted!!!" });
        } 
        catch (error) 
        {
            console.log(error);
            res.status(500).send({ success: false, error, message:
                "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not Delete WorkExperience By ID",
            });
        }
    },
    
};