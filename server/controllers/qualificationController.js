const express = require('express');
const Qualification = require("../models/qualificationModel");
const slugify = require("slugify");


module.exports = {

    // fetch all Qualifications
    fetchQualifications: async (req, res) => {

        try 
        {
            const qualifications = await Qualification.find().sort({ createdAt: -1 });
            res.status(200).send({ success: true, message: "All Qualifications Fetched Successfully!!", qualifications });
        } 
        catch (error) 
        {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch All Qualifications" });
        }
    },

    // Add Qualification
    addQualification: async(req, res) => {
        try {
            const { qualificationName } = req.body;
            if (!qualificationName) {
                return res.status(401).send({ message: "Qualification Name is REQUIRED!!!" });
            }
            const qualificationExist = await Qualification.findOne({ qualificationName });
            if (qualificationExist) {
                return res.status(200).send({ success: true, message: "Qualification Already EXISTS" });
            }
            const qualification = await new Qualification({ qualificationName, slug: slugify(qualificationName) }).save();
            console.log(qualification);
            res.status(201).send({ success: true, message: "New Qualification is Added Successfully!!!", qualification })
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong Trying to Add New Qualification, Server Could Not be REACHED AT THIS MOMENT!!!!" });
        }
    },

    // Update Qualification
    updateQualification: async (req, res) => {

        try 
        {
            const { qualificationName } = req.body;
            const { id } = req.params;
            const qualification = await Qualification.findByIdAndUpdate(id, {qualificationName, slug: slugify(qualificationName)}, {new:true})
            res.status(200).send({ success: true, message: "Qualification Name is Updated Successfully!!!",
            qualification });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT, could not Update Qualification" });
        }
    },

    // Fetch Qualification By ID
    fetchQualificationById: async(req, res) => {
        try {
            const qualification = await Qualification.findOne({ slug: req.params.slug });
            res.status(200).send({ success: true, message: "Qualification ID fetched Successfully!!!", qualification });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch Qualification By ID" });
        }
    },

    // Delete Qualification By ID
    deleteQualificationById: async(req, res) => {
        try 
        {
            const { id } = req.params;
            await Qualification.findByIdAndDelete(id);
            res.status(200).send({ success: true, message: "Qualification is Successfully Deleted!!!" });
        } 
        catch (error) 
        {
            console.log(error);
            res.status(500).send({ success: false, error, message:
                "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not Delete Qualification By ID",
            });
        }
    },
    
};