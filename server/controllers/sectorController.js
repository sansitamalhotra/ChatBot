const express = require('express');
const Sector = require("../models/sectorModel");
const slugify = require("slugify");


module.exports = {

   // fetch all Sectors
    fetchSectors: async (req, res) => {

        try {
            const sector = await Sector.find().sort({ createdAt: -1 });
            res.status(200).send({ success: true, message: "All Sectors Fetched Successfully!!", sector });
        } catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch All Sectors" });
        }
    },

    fetchAllSectorsController: async (req, res) => {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
    
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const result = {};

        try
        {
            const totalSectors = await Sector.countDocuments();
            numSectorsInDB = await Sector.countDocuments();

            const sectors = await Sector.find({ _id: { $ne: req.sectorId } }).lean().sort({ createdAt: -1 }).limit(limit).skip(startIndex);

            if (endIndex < numSectorsInDB) {
                result.next = { page: page + 1, limit: limit };
            }
            if (startIndex > 0) {
                result.previous = { page: page - 1, limit: limit };
            }

            result.result = sectors;
            result.numSectorsInDB = numSectorsInDB;
            result.totalSectors = totalSectors;

            res.status(200).json(result);
        }
        catch (error)
        {
            console.log(error);
            res.status(500).send({ success: false, message: "Something Went Wrong Trying to Fetch All Sectors From Database", error: error.message });
        }
        
    },

    // Add Sector
    addSector: async (req, res) => {

        try {
            const { sectorName } = req.body;
            if (!sectorName) {
                return res.status(401).send({ message: "Sector Name is REQUIRED!!!" });
            }

            const sectorExist = await Sector.findOne({ sectorName });

            if (sectorExist) {
                return res.status(200).send({ success: true, message: "Sector Name Already EXISTS" });
            }



            const sector = await new Sector({ sectorName, slug: slugify(sectorName) }).save();

            res.status(201).send({ success: true, message: "New Sector Name is Added Successfully!!!", sector })
        } 
        catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong Trying to Add New Sector Name, Server Could Not be REACHED AT THIS MOMENT!!!!" });
        }
    },
    // Update Sector Name
    updateSector: async (req, res) => {

        try {
            const { sectorName } = req.body;
            const { id } = req.params;
            const sector = await Sector.findByIdAndUpdate(id, { sectorName, slug: slugify(sectorName) }, { new:true });

            res.status(200).send({
                success: true,
                message: "Sector Name is Updated Successfully!!!",
                sector,
              });
          } catch (error) {
            console.log(error);
            res
              .status(500)
              .send({
                success: false,
                error,
                message:
                  "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT, could not Update Sector Name",
              });
          }
    },
     // Fetch Sector By ID
     fetchSectorById: async(req, res) => {
        try {
            const sector = await Sector.findOne({ slug: req.params.slug });

            res.status(200).send({ success: true, message: "Sector ID fetched Successfully!!!", sector });

        } 
        catch (error) {
            console.log(error);
            res.status(500).send({ success: false, error, message: "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not fetch Sector Name By ID" });
        }
    },
    // Delete Sector By ID
    deleteSectorById: async(req, res) => {
        try {
            const { id } = req.params;
            await Sector.findByIdAndDelete(id);
            res
              .status(200)
              .send({ success: true, message: "Sector is Successfully Deleted!!!" });
          } catch (error) {
            console.log(error);
            res.status(500).send({
              success: false,
              error,
              message:
                "Something Went Wrong, Server Could Not be REACHED AT THIS MOMENT!!, Could not Delete Sector By ID",
            });
          }
    },
};