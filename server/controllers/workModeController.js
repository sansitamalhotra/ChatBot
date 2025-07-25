const express = require('express');
const WorkMode = require("../models/workModeModel");
const slugify = require("slugify");


module.exports = {

    // fetch all Work Modes
    fetchWorkModes: async (req, res) => {

        try {
            const workModes = await WorkMode.find().sort({ createdAt: -1 });
            res.status(200).send({ success: true, message: "All Work Modes Fetched Successfully!!", workModes });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch All Work Modes" });
        }
    },

    // Add Work Mode
    addWorkMode: async(req, res) => {
        try {
            const { workModeName } = req.body;
            if (!workModeName) {
                return res.status(401).send({ message: "Work Mode Name is REQUIRED!!!" });
            }
            const workModeExist = await WorkMode.findOne({ workModeName });
            if (workModeExist) {
                return res.status(200).send({ success: true, message: "Work Mode Already EXISTS" });
            }
            const workMode = await new WorkMode({ workModeName, slug: slugify(workModeName) }).save();
            res.status(201).send({ success: true, message: "New Work Mode is Added Successfully!!!", workMode })
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong Trying to Add New Work Mode Name, Server Could Not be REACHED AT THIS MOMENT!!!!" });
        }
    },

    // Update Work Mode
    updateWorkMode: async (req, res) => {

        try 
        {
            const { workModeName } = req.body;
            const { id } = req.params;
            const workMode = await WorkMode.findByIdAndUpdate(id, {workModeName, slug: slugify(workModeName)}, {new:true})
            res.status(200).send({ success: true, message: "Work Mode Name is Updated Successfully!!!",
                workMode });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT, could not Update Work Mode Name" });
        }
    },

    // Fetch Work Mode By ID
    fetchWorkModeById: async(req, res) => {
        try {
            const workMode = await WorkMode.findOne({ slug: req.params.slug });
            res.status(200).send({ success: true, message: "Work Mode ID fetched Successfully!!!", workMode });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch Work Mode By ID" });
        }
    },

    // Delete Work Mode By ID
    deleteWorkModeById: async(req, res) => {
        try 
        {
            const { id } = req.params;
            await WorkMode.findByIdAndDelete(id);
            res.status(200).send({ success: true, message: "Work Mode is Successfully Deleted!!!" });
        } 
        catch (error) 
        {
            console.log(error);
            res.status(500).send({ success: false, error, message:
                "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not Delete Work Mode By ID",
            });
        }
    },
};