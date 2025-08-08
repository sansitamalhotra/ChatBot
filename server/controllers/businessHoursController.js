//server/controllers/businessHoursController.js
const BusinessHours = require('../models/businessHoursModel');
const { businessHoursUtil } = require('../utils/businessHours'); // Fixed import
const moment = require('moment-timezone');

class BusinessHoursController {
    // For Fetching Active Business Hours Configuration
    static async fetchBusinessHours(req, res) {
        try {
            const businessHours = await BusinessHours.getActive();
            if (!businessHours) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No Active Business Hours Configurations Found!!!' 
                });
            }
            
            // Use utility methods for consistency
            const currentStatus = await businessHoursUtil.isWithinBusinessHours();
            const nextAvailable = await businessHoursUtil.getNextBusinessHour();
            const isNearClosingTime = await businessHoursUtil.isNearClosing();

            res.status(200).json({
                success: true, 
                data: {
                    businessHours,
                    status: {
                        isOpen: currentStatus,
                        isNearClosing: isNearClosingTime,
                        nextAvailable: nextAvailable,
                        currentTime: businessHoursUtil.getCurrentESTTime()
                    }
                }
            });
        }
        catch (error) {
            console.error('Error fetching business hours:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching business hours configuration', 
                error: error.message 
            });
        }
    }

    // For Adding Business Hours Configuration
    static async addBusinessHours(req, res) {
        try {
            const { timezone, workingHours, workingDays, holidays, outsideHoursMessage, outsideHoursOptions, settings } = req.body;
            const createdBy = req.user?.id; // Safe access in case user is undefined

            // Validate configuration before saving
            const validationErrors = businessHoursUtil.validateConfig(req.body);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            // Optionally Deactivate Existing Active Business Hours Configuration
            await BusinessHours.updateMany({ isActive: true }, { isActive: false });
            
            const businessHours = new BusinessHours({
                timezone,
                workingHours,
                workingDays,
                holidays: holidays || [],
                outsideHoursMessage,
                outsideHoursOptions: outsideHoursOptions || [],
                settings: settings || {},
                createdBy,
                isActive: true
            });

            await businessHours.save();
            
            // Clear cache after adding new configuration
            businessHoursUtil.clearCache();
            
            res.status(201).json({
                success: true,
                message: 'Business Hours Configuration Added Successfully!!',
                data: businessHours
            });

        }
        catch (error) {
            console.error('Error Adding Business Hours:', error);
            res.status(500).json({
                success: false,
                message: 'Error Adding Business Hours Configuration',
                error: error.message
            });
        }
    }

    // For Updating Business Hours Configuration
    static async updateBusinessHours(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate configuration before updating
            const validationErrors = businessHoursUtil.validateConfig(updateData);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            const businessHours = await BusinessHours.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() }, 
                { new: true, runValidators: true }
            );
            
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }
            
            // Clear cache after update
            businessHoursUtil.clearCache();
            
            res.json({
                success: true,
                message: 'Business Hours Configuration Updated Successfully !!!',
                data: businessHours
            });
        }
        catch (error) {
            console.error('Something Went Wrong Updating Business Hours Configuration:', error);
            res.status(500).json({
                success: false,
                message: 'Something Went Wrong Updating Business Hours Configuration',
                error: error.message
            });
        }
    }

    // For Checking if Current Time is Within Business Hours
    static async checkBusinessHoursStatus(req, res) {
        try {
            const businessHours = await BusinessHours.getActive();
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }
            
            // Use utility methods for consistency
            const isOpen = await businessHoursUtil.isWithinBusinessHours();
            const isNearClosingTime = await businessHoursUtil.isNearClosing();
            const nextAvailable = await businessHoursUtil.getNextBusinessHour();
            const allowNewChats = await businessHoursUtil.allowNewChats();
            const minutesUntilClosing = await businessHoursUtil.getMinutesUntilClosing();

            res.json({
                success: true,
                data: {
                    isOpen,
                    isNearClosing: isNearClosingTime,
                    allowNewChats,
                    minutesUntilClosing,
                    nextAvailable,
                    currentTime: businessHoursUtil.getCurrentESTTime(),
                    timezone: businessHours.timezone,
                    workingHours: businessHoursUtil.getFormattedBusinessHours(businessHours),
                    outsideHoursMessage: isOpen ? null : await businessHoursUtil.getOutsideHoursMessage(req.user || {}),
                    outsideHoursOptions: isOpen ? null : businessHours.outsideHoursOptions
                }
            });
        }
        catch (error) {
            console.error('Something Went Wrong While Checking Business Hours Status:', error);
            res.status(500).json({
                success: false,
                message: 'Something Went Wrong While Checking Business Hours Status',
                error: error.message
            });
        }
    }

    // For Adding Important/Emergency/Special Hours for Specific Dates
    static async addSpecialHours(req, res) {
        try { 
            const { date, hours, isClosed, reason } = req.body;
            
            // Validate date
            if (!date || !moment(date).isValid()) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid date is required'
                });
            }

            const businessHours = await BusinessHours.getActive();
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }

            businessHours.specialHours.push({
                date: new Date(date),
                hours: hours || {},
                isClosed: isClosed || false,
                reason: reason || ''
            });

            await businessHours.save();
            
            // Clear cache after adding special hours
            businessHoursUtil.clearCache();

            res.json({
                success: true,
                message: 'Special Business Hours Added Successfully!!!',
                data: businessHours.specialHours
            });
        }
        catch (error) {
            console.error('Something Went Wrong Adding Special Hours:', error);
            res.status(500).json({
                success: false,
                message: 'Something Went Wrong Adding Special Hours',
                error: error.message
            });
        }
    }

    // For Adding Holidays
    static async addHoliday(req, res) {
        try { 
            const { date, name, description, recurring } = req.body;
            
            // Validate required fields
            if (!date || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Date and name are required for holidays'
                });
            }

            if (!moment(date).isValid()) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid date is required'
                });
            }

            const businessHours = await BusinessHours.getActive();
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }

            businessHours.holidays.push({
                date: new Date(date),
                name,
                description: description || '',
                recurring: recurring || false
            });

            await businessHours.save();
            
            // Clear cache after adding holiday
            businessHoursUtil.clearCache();

            res.json({
                success: true,
                message: 'Holiday Added Successfully !!!',
                data: businessHours.holidays
            });
        }
        catch (error) {
            console.error('Something Went Wrong Adding Holiday:', error);
            res.status(500).json({
                success: false,
                message: 'Something Went Wrong Adding Holiday',
                error: error.message
            });
        }
    }

    // Fetch Forthcoming Holidays and Special Hours
    static async fetchForthComingSchedule(req, res) {
        try { 
            const businessHours = await BusinessHours.getActive();
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }

            const now = moment().tz(businessHours.timezone);
            const thirtyDaysFromNow = now.clone().add(30, 'days');

            // Filter Forthcoming Holidays
            const forthcomingHolidays = businessHours.holidays.filter(holiday => {
                const holidayDate = moment(holiday.date);
                if (holiday.recurring) {
                    // For recurring holidays, check if the holiday occurs in the next 30 days
                    const thisYearHoliday = now.clone().month(holidayDate.month()).date(holidayDate.date());
                    const nextYearHoliday = thisYearHoliday.clone().add(1, 'year');
                    return (thisYearHoliday.isAfter(now) && thisYearHoliday.isBefore(thirtyDaysFromNow)) ||
                           (nextYearHoliday.isAfter(now) && nextYearHoliday.isBefore(thirtyDaysFromNow));
                }
                return holidayDate.isAfter(now) && holidayDate.isBefore(thirtyDaysFromNow);
            }).sort((a, b) => new Date(a.date) - new Date(b.date));

            // Filter Forthcoming Special Hours
            const forthcomingSpecialHours = businessHours.specialHours.filter(special => {
                const specialDate = moment(special.date);
                return specialDate.isAfter(now) && specialDate.isBefore(thirtyDaysFromNow);
            }).sort((a, b) => new Date(a.date) - new Date(b.date));

            res.json({
                success: true,
                data: {
                    holidays: forthcomingHolidays,
                    specialHours: forthcomingSpecialHours,
                    regularHours: {
                        workingHours: businessHours.workingHours,
                        workingDays: businessHours.workingDays,
                        timezone: businessHours.timezone,
                        formattedHours: businessHoursUtil.getFormattedBusinessHours(businessHours)
                    }
                }
            });
        }
        catch (error) {
            console.error('Something Went Wrong Fetching Forthcoming Schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Something Went Wrong Fetching Forthcoming Schedule',
                error: error.message
            });
        }
    }

    // For Adding Default Business Hours Configuration
    static async addDefaultBusinessHoursConfiguration(req, res) {
        try { 
            const createdBy = req.user?.id; // Safe access

            // Check if there's an Active existing Business Hours Configuration
            const existingConfig = await BusinessHours.getActive();
            if (existingConfig) {
                return res.status(400).json({
                    success: false,
                    message: 'There is Already An Existing Active Business Hours Configuration'
                });
            }

            const defaultBusinessHours = await BusinessHours.createDefault(createdBy);
            
            // Clear cache after creating default
            businessHoursUtil.clearCache();

            res.status(201).json({
                success: true,
                message: 'Default Business Hours Configuration Added Successfully !!!',
                data: defaultBusinessHours
            });
        }
        catch (error) {
            console.error('Something Went Wrong Adding Default Business Hours Configuration:', error);
            res.status(500).json({
                success: false,
                message: 'Something Went Wrong Adding Default Business Hours Configuration',
                error: error.message
            });
        }
    }

    // For Validating Business Hours Middleware
    static async validateBusinessHours(req, res, next) {
        try { 
            const businessHours = await BusinessHours.getActive();
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }
            
            // Use utility methods for consistency
            req.businessHours = businessHours;
            req.isBusinessHours = await businessHoursUtil.isWithinBusinessHours();
            req.isNearClosing = await businessHoursUtil.isNearClosing();
            req.allowNewChats = await businessHoursUtil.allowNewChats();
            
            next();
        }
        catch (error) {
            console.error('Something Went Wrong While Validating Business Hours Middleware:', error);
            res.status(500).json({
                success: false,
                message: 'Something Went Wrong While Validating Business Hours Middleware',
                error: error.message
            });
        }
    }

    // Additional utility method to check specific date/time
    static async checkSpecificDateTime(req, res) {
        try {
            const { dateTime } = req.query;
            
            if (!dateTime || !moment(dateTime).isValid()) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid dateTime parameter is required'
                });
            }

            const isWithinHours = await businessHoursUtil.isDateTimeWithinBusinessHours(dateTime);
            
            res.json({
                success: true,
                data: {
                    dateTime,
                    isWithinBusinessHours: isWithinHours,
                    formattedDateTime: moment(dateTime).format('dddd, MMMM Do YYYY, h:mm A z')
                }
            });
        }
        catch (error) {
            console.error('Error checking specific date/time:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking specific date/time',
                error: error.message
            });
        }
    }
}

module.exports = BusinessHoursController;
