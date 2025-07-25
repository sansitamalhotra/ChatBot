const express = require('express');
const Salary = require("../models/salaryModel");
const slugify = require("slugify");


module.exports = {

    // fetch all Salary Types
    fetchSalaries: async (req, res) => {

        try {
            const salary = await Salary.find().sort({ createdAt: -1 });
            res.status(200).send({ success: true, message: "All Salary Types Fetched Successfully!!", salary });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch All Salary Types" });
        }
    },

    addSalary: async(req, res) => {
        try {
            const { salaryName } = req.body;
            if (!salaryName) {
                return res.status(401).send({ message: "Salary Type Name is REQUIRED!!!" });
            }
            const salaryExist = await Salary.findOne({ salaryName });
            if (salaryExist) {
                return res.status(200).send({ success: true, message: "Salary Type Name Already EXISTS" });
            }
            const salary = await new Salary({ salaryName, slug: slugify(salaryName) }).save();
            res.status(201).send({ success: true, message: "New Salary Type Name is Added Successfully!!!", salary })
            
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong Trying to Add New Salary Type Name, Server Could Not be REACHED AT THIS MOMENT!!!!" });
        }
    },

    // Update Salary Type
    updateSalary: async (req, res) => {

        try {
            const { salaryName } = req.body;
            const { id } = req.params;
            const salary = await Salary.findByIdAndUpdate(id, {salaryName, slug: slugify(salaryName)}, {new:true})
            res.status(200).send({
                success: true,
                message: "Salary Type Name is Updated Successfully!!!",
                salary,
              });
          } catch (error) {
            console.log(error);
            res
              .status(500)
              .send({
                success: false,
                error,
                message:
                  "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT, could not Update Salary Type Name",
              });
          }
    },
    // Fetch Salary Type By ID
    fetchSalaryById: async(req, res) => {
        try {
            const salary = await Salary.findOne({ slug: req.params.slug });
            res.status(200).send({ success: true, message: "Salary Type ID fetched Successfully!!!", salary });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch Salary Type By ID" });
        }
    },

    // Delete Salary Type By ID
    deleteSalaryById: async(req, res) => {
        try {
            const { id } = req.params;
            await Salary.findByIdAndDelete(id);
            res
              .status(200)
              .send({ success: true, message: "Salary Type is Successfully Deleted!!!" });
          } catch (error) {
            console.log(error);
            res.status(500).send({
              success: false,
              error,
              message:
                "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not Delete Salary Type By ID",
            });
          }
    },

};