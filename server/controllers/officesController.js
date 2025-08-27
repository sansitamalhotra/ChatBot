const OurOffices = require("../models/officeModel");

// Controller to manage office locations
module.exports = {
    fetchAllOffices: async (req, res) => {
        try {
            const offices = await OurOffices.find()
            .populate({
                path: 'businessHours',
                select: 'timezone workingHours workingDays holidays specialHours'
            });
            res.status(200).json({
                success: true,
                message: "All offices fetched successfully",
                offices
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    addOffice: async (req, res) => {
        try {
            const { location, phone, email } = req.body;
            
            // Validate required location fields
            if (!location || !location.address || !location.city || !location.state || !location.postalCode || !location.country) {
                return res.status(400).json({
                    success: false,
                    message: "Location with address, city, state, postalCode, and country are required"
                });
            }
            
            // Check if the office already exists
            const existingOffice = await OurOffices.findOne({ "location.city": location.city, "location.state": location.state, "location.postalCode": location.postalCode, "location.country": location.country });
            if (existingOffice) {
                return res.status(400).json({
                    success: false,
                    message: "Office already exists"
                });
            }

            // Create a new office
            const newOffice = new OurOffices({
                location,
                phone,
                email
            });
            await newOffice.save();
            res.status(201).json({
                success: true,
                message: "Office created successfully",
                office: newOffice
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error",
                message: error.message 
            });
        }
    },

    updateOffice: async (req, res) => {
        try {
            const { id } = req.params;
            const { location, phone, email } = req.body;

            // Validate required location fields if location is provided
            if (location && (!location.address || !location.city || !location.state || !location.postalCode || !location.country)) {
                return res.status(400).json({
                    success: false,
                    message: "When updating location, address, city, state, postalCode, and country are required"
                });
            }

            // Check if the office exists
            const office = await OurOffices.findById(id);
            if (!office) {
                return res.status(404).json({
                    success: false,
                    message: "Office not found"
                });
            }

            // Update office details
            if (location) office.location = location;
            if (phone) office.phone = phone;
            if (email) office.email = email;

            await office.save();
            res.status(200).json({
                success: true,
                message: "Office updated successfully",
                office
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false,
                error: "Internal server error",
            });
        }
    },

    deleteOffice: async (req, res) => {
        try {
            const { id } = req.params;

            // Check if the office exists
            const office = await OurOffices.findById(id);
            if (!office) {
                return res.status(404).json({
                    success: false,
                    message: "Office not found"
                });
            }

            // Delete the office
            await office.remove();
            res.status(200).json({
                success: true,
                message: "Office deleted successfully"
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                error: "Internal server error"
            });
        }
    }
}