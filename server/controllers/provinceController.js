const express = require('express');
const slugify = require("slugify");
const Province = require("../models/provinceModel");



module.exports = {

    addProvince: async (req, res) => {
        try {
          const { provinceName, slug, country } = req.body;
      
          // Validations
          const requiredFields = ["provinceName", "country"];
          const missingFields = requiredFields.filter((field) => !req.body[field]);
      
          if (missingFields.length > 0) {
            return res.send({
              success: false,
              message: `${missingFields.join(", ")} is Required!!`,
            });
          }
      
          // Check if Province Slug Already Exists
          const provinceExist = await Province.findOne({ slug });
      
          if (provinceExist) {
            return res.status(200).json({
              success: false,
              message: "Province Name Already Exists, Kindly Choose a Different Province Name",
            });
          }
      
          // Save to Database
          const newProvince = await new Province({ provinceName, slug: slugify(provinceName), country }).save();
      
          res.status(201).send({
            success: true,
            message: `A New ${newProvince.provinceName} Province Has Been Added Successfully.`,
            newProvince,
          });
        } catch (error) {
          console.log(error);
          res.status(500).send({ message: "Something Went Wrong, Server Unable to Process Your Request at this Moment!", error });
        }
    },
      

    fetchAllProvinces: async (req, res) => {

        try
        {
            const provinces = await Province.find({ country: req.params.countryId });
            res.status(201).send({ success: true, message: "All Province Fetched Successfully!!!", provinces });
        }
        catch (error)
        {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    

    fetchProvinces: async (req, res) => {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
    
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const result = {};

        try
        {
            const totalProvinces = await Province.countDocuments();
            numProvincesInDB = await Province.countDocuments();

            const provinces = await Province.find({ _id: { $ne: req.provinceId } }).populate("country", "countryName").lean().sort({ createdAt: -1 }).limit(limit).skip(startIndex);

            console.log(provinces);

            if (endIndex < numProvincesInDB) {
                result.next = { page: page + 1, limit: limit };
            }
            if (startIndex > 0) {
                result.previous = { page: page - 1, limit: limit };
            }

            result.result = provinces;
            result.numProvincesInDB = numProvincesInDB;
            result.totalProvinces = totalProvinces;
            res.status(200).json(result);
        }
        catch (error)
        {
            console.log(error);
            res.status(500).send({ success: false, message: "Something Went Wrong Trying to Fetch All Province/ States From Database", error: error.message });
        }
    },

    getallProvince: async (req, res) => {
      try
        {
            const provinces = await Province.find().sort({ createdAt: -1 });
            res.status(201).send({ success: true, message: "All Province Fetched Successfully!!!", provinces });
        }
        catch (error)
        {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
  },
  updateProvince: async (req, res) => {
        try {
            const { id } = req.params;
            const { provinceName } = req.body;
            
            // Validation
            if (!provinceName) {
                return res.status(400).json({
                    success: false,
                    message: "Province name is required"
                });
            }
            
            // Check if province exists
            const province = await Province.findById(id);
            if (!province) {
                return res.status(404).json({
                    success: false,
                    message: "Province not found"
                });
            }
            
            // Check if another province with same name exists (excluding current one)
            const existingProvince = await Province.findOne({ 
                provinceName: provinceName,
                _id: { $ne: id }
            });
            
            if (existingProvince) {
                return res.status(400).json({
                    success: false,
                    message: "Province name already exists"
                });
            }
            
            // Update province
            const updatedProvince = await Province.findByIdAndUpdate(
                id,
                { 
                    provinceName: provinceName,
                    slug: slugify(provinceName)
                },
                { new: true }
            ).populate("country", "countryName");
            
            res.status(200).json({
                success: true,
                message: `Province has been updated successfully to ${provinceName}`,
                province: updatedProvince
            });
            
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                message: "Something went wrong while updating the province",
                error: error.message
            });
        }
    },
    
    deleteProvinceById: async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log(`Attempting to delete province with ID: ${id}`); // Debug log
            
            // Validate ObjectId format
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid province ID format"
                });
            }
            
            // Check if province exists
            const province = await Province.findById(id);
            if (!province) {
                return res.status(404).json({
                    success: false,
                    message: "Province not found"
                });
            }
            
            // Store province name for response message
            const provinceName = province.provinceName;
            
            console.log(`Deleting province: ${provinceName}`); // Debug log
            
            // Delete the province
            await Province.findByIdAndDelete(id);
            
            res.status(200).json({
                success: true,
                message: `Province "${provinceName}" has been deleted successfully`
            });
            
        } catch (error) {
            console.log("Delete error:", error);
            res.status(500).json({
                success: false,
                message: "Something went wrong while deleting the province",
                error: error.message
            });
        }
    }
};
