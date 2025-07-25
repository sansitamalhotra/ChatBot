const express = require('express');
const WorkAuthorization =  require('../models/workauthorizationModel');
const slugify = require("slugify");


module.exports = {

   // fetch all WorkAuthorizations
    fetchWorkAuthorizations: async (req, res) => {

        try {
            const workAuthorization = await WorkAuthorization.find().sort({ createdAt: -1 });
            res.status(200).send({ success: true, message: "All WorkAuthorization Fetched Successfully!!", workAuthorization });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch All WorkAuthorization" });
        }
    },

    // Add WorkAuthorization
    addWorkAuthorization: async (req, res) => {

        try {
            const { workAuthorizationName } = req.body;
            if (!workAuthorizationName) {
                return res.status(401).send({ message: "WorkAuthorization Name is REQUIRED!!!" });
            }

            const workAuthorizationExist = await WorkAuthorization.findOne({ workAuthorizationName });

            if (workAuthorizationExist) {
                return res.status(200).send({ success: true, message: "WorkAuthorization Already EXISTS" });
            }



            const workAuthorization = await new WorkAuthorization({ workAuthorizationName, slug: slugify(workAuthorizationName) }).save();

            res.status(201).send({ success: true, message: "New WorkAuthorization is Added Successfully!!!", workAuthorization })
        } 
        catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong Trying to Add New WorkAuthorization, Server Could Not be REACHED AT THIS MOMENT!!!!" });
        }
    },
    // Update WorkAuthorization
    updateWorkAuthorization: async (req, res) => {

        try {
            const { workAuthorizationName } = req.body;
            const { id } = req.params;
            const workAuthorization = await WorkAuthorization.findByIdAndUpdate(id, {workAuthorizationName, slug: slugify(workAuthorizationName)}, {new: true})
            res.status(200).send({
                success: true,
                message: "Work Authorization is Updated Successfully!!!",
                workAuthorization,
              });
          } catch (error) {
            console.log(error);
            res
              .status(500)
              .send({
                success: false,
                error,
                message:
                  "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT, could not Update Work Authorization",
              });
          }
    },
     // Fetch WorkAuthorization By ID
     fetchWorkAuthorizationById: async(req, res) => {
        try {
            const workAuthorization = await WorkAuthorization.findOne({ slug: req.params.slug });

            res.status(200).send({ success: true, message: "WorkAuthorization ID fetched Successfully!!!", workAuthorization });

        } 
        catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch WorkAuthorization By ID" });
        }
    },
    // Delete WorkAuthorization By ID
    deleteWorkAuthorizationById: async(req, res) => {
        try {
            const { id } = req.params;
            await WorkAuthorization.findByIdAndDelete(id);
            res
              .status(200)
              .send({ success: true, message: "WorkAuthorization is Successfully Deleted!!!" });
          } catch (error) {
            console.log(error);
            res.status(500).send({
              success: false,
              error,
              message:
                "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not Delete WorkAuthorization By ID",
            });
          }
    },
};