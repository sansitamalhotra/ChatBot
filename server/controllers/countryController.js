const express = require('express');
const Country = require("../models/countryModel");
const slugify = require("slugify");


module.exports = {

    // fetch all countries
    fetchCountries: async (req, res) => {

        try {
            const country = await Country.find().sort({ createdAt: -1 });
            res.status(200).send({ success: true, message: "All Countries Fetched Successfully!!", country });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch All Countries" });
        }
    },

    addCountry: async(req, res) => {
        try {
            const { countryName } = req.body;
            if (!countryName) {
                return res.status(401).send({ message: "Country Name is REQUIRED!!!" });
            }
            const countryExist = await Country.findOne({ countryName });
            if (countryExist) {
                return res.status(200).send({ success: true, message: "Country Name Already EXISTS" });
            }
            const country = await new Country({ countryName, slug: slugify(countryName) }).save();
            res.status(201).send({ success: true, message: "New Country Name is Added Successfully!!!", country })
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong Trying to Add New Country Name, Server Could Not be REACHED AT THIS MOMENT!!!!" });
        }
    },

    // Update Country
    updateCountry: async (req, res) => {

        try {
            const { countryName } = req.body;
            const { id } = req.params;
            const country = await Country.findByIdAndUpdate(id, {countryName, slug: slugify(countryName)}, {new:true})
            res.status(200).send({
                success: true,
                message: "Country Name is Updated Successfully!!!",
                country,
              });
          } catch (error) {
            console.log(error);
            res
              .status(500)
              .send({
                success: false,
                error,
                message:
                  "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT, could not Update Country Name",
              });
          }
    },
    // Fetch Country By ID
    fetchCountryById: async(req, res) => {
        try {
            const country = await Country.findOne({ slug: req.params.slug });
            res.status(200).send({ success: true, message: "Country ID fetched Successfully!!!", country });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch Country Name By ID" });
        }
    },

    // Delete Country By ID
    deleteCountryById: async(req, res) => {
        try {
            const { id } = req.params;
            await Country.findByIdAndDelete(id);
            res
              .status(200)
              .send({ success: true, message: "Country is Successfully Deleted!!!" });
          } catch (error) {
            console.log(error);
            res.status(500).send({
              success: false,
              error,
              message:
                "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not Delete Country By ID",
            });
          }
    },

};