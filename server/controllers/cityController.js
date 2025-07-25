const express = require('express');
const slugify = require("slugify");
const City = require("../models/cityModel");


module.exports = {

    addCity: async (req, res) => {
        try {
          const { cityName, slug, province } = req.body;
      
          // Validations
          const requiredFields = ["cityName", "province"];
          const missingFields = requiredFields.filter((field) => !req.body[field]);
      
          if (missingFields.length > 0) {
            return res.send({
              success: false,
              message: `${missingFields.join(", ")} is Required!!`,
            });
          }
      
          // Check if City Slug Already Exists
          const cityExist = await City.findOne({ slug });
      
          if (cityExist) {
            return res.status(200).json({
              success: false,
              message: "City Name Already Exists, Kindly Choose a Different City Name",
            });
          }
      
          // Save to Database
          const newCity = await new City({ cityName, slug: slugify(cityName), province }).save();
      
          res.status(201).send({
            success: true,
            message: `A New ${newCity.cityName} City Has Been Added Successfully.`,
            newCity,
          });
        } catch (error) {
          console.log(error);
          res.status(500).send({ message: "Something Went Wrong, Server Unable to Process Your Request at this Moment!", error });
        }
    },

    fetchAllCities: async (req, res) => {

        try
        {
            const cities = await City.find({ province: req.params.cityId });
            res.status(201).send({ success: true, message: "All Cities Fetched Successfully!!!", cities });
        }
        catch (error)
        {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    fetchCities: async (req, res) => {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
    
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const result = {};

        try
        {
            const totalCities = await City.countDocuments();
            numCitiesInDB = await City.countDocuments();

            const cities = await City.find({ _id: { $ne: req.cityId } }).populate("province", "provinceName").lean().limit(limit).skip(startIndex).sort({ createdAt: -1 });

            console.log(cities);

            if (endIndex < numCitiesInDB) {
                result.next = { page: page + 1, limit: limit };
            }
            if (startIndex > 0) {
                result.previous = { page: page - 1, limit: limit };
            }

            result.result = cities;
            result.numCitiesInDB = numCitiesInDB;
            result.totalCities = totalCities;
            res.status(200).json(result);
        }
        catch (error)
        {
            console.log(error);
            res.status(500).send({ success: false, message: "Something Went Wrong Trying to Fetch All Cities From Database", error: error.message });
        }
    },

    getAllCities: async (req, res) => {

      try
        {
            const cities = await City.find().sort({ createdAt: -1 });
            res.status(201).send({ success: true, message: "All City Fetched Successfully!!!", cities });
        }
        catch (error)
        {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }

    },
};