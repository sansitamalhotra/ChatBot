//server/controllers/businessHoursController.js
const BusinessHours = require('../models/businessHoursModel');
const { businessHoursUtil } = require('../utils/businessHours');
const moment = require('moment-timezone');

class BusinessHoursController {
    // For Fetching Active Business Hours Configuration
    static async fetchBusinessHours(req, res) {
        try {
            const businessHours = await BusinessHours.findOne({ isActive: true });
            if (!businessHours) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No Active Business Hours Configurations Found!!!' 
                });
            }
            
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
            const createdBy = req.user?.id;

            const validationErrors = businessHoursUtil.validateConfig(req.body);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

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
            const businessHours = await BusinessHours.findOne({ isActive: true });
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }
            
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
            
            if (!date || !moment(date).isValid()) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid date is required'
                });
            }

            const businessHours = await BusinessHours.findOne({ isActive: true });
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

            const businessHours = await BusinessHours.findOne({ isActive: true });
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

    // FIXED: Fetch Forthcoming Holidays and Special Hours - ENSURE DESCRIPTIONS ARE INCLUDED
    static async fetchForthComingSchedule(req, res) {
        try { 
            const businessHours = await BusinessHours.findOne({ isActive: true });
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }

            const now = moment().tz(businessHours.timezone);
            const thirtyDaysFromNow = now.clone().add(30, 'days');

            console.log('=== FETCHFORTHCOMINGSCHEDULE DEBUG ===');
            console.log('Current time:', now.format());
            console.log('End time:', thirtyDaysFromNow.format());
            console.log('Total holidays in DB:', businessHours.holidays.length);
            
            // Log all holidays with their descriptions
            businessHours.holidays.forEach((holiday, index) => {
                console.log(`Holiday ${index}:`, {
                    name: holiday.name,
                    date: holiday.date,
                    description: holiday.description || 'No description',
                    recurring: holiday.recurring
                });
            });

            // FIXED: Enhanced holiday filtering with better logging and description preservation
            const forthcomingHolidays = businessHours.holidays
                .filter(holiday => {
                    if (!holiday.date || !holiday.name) {
                        console.log('Invalid holiday data:', holiday);
                        return false;
                    }

                    const holidayDate = moment(holiday.date);
                    if (!holidayDate.isValid()) {
                        console.log('Invalid holiday date:', holiday.date);
                        return false;
                    }

                    if (holiday.recurring) {
                        // Handle recurring holidays
                        const thisYearHoliday = now.clone()
                            .year(now.year())
                            .month(holidayDate.month())
                            .date(holidayDate.date())
                            .hour(0).minute(0).second(0).millisecond(0);
                        
                        const nextYearHoliday = thisYearHoliday.clone().add(1, 'year');
                        
                        const isThisYearValid = thisYearHoliday.isSameOrAfter(now.startOf('day')) && 
                                            thisYearHoliday.isSameOrBefore(thirtyDaysFromNow.endOf('day'));
                        const isNextYearValid = nextYearHoliday.isSameOrAfter(now.startOf('day')) && 
                                            nextYearHoliday.isSameOrBefore(thirtyDaysFromNow.endOf('day'));
                        
                        console.log(`Recurring holiday ${holiday.name}:`, {
                            thisYear: thisYearHoliday.format(),
                            nextYear: nextYearHoliday.format(),
                            isThisYearValid,
                            isNextYearValid
                        });
                        
                        return isThisYearValid || isNextYearValid;
                    }
                    
                    // Non-recurring holidays
                    const isInRange = holidayDate.isSameOrAfter(now.startOf('day')) && 
                                     holidayDate.isSameOrBefore(thirtyDaysFromNow.endOf('day'));
                    
                    console.log(`Non-recurring holiday ${holiday.name}:`, {
                        date: holidayDate.format(),
                        isInRange,
                        description: holiday.description
                    });
                    
                    return isInRange;
                })
                .map(holiday => {
                    const holidayObj = {
                        _id: holiday._id,
                        name: holiday.name,
                        date: holiday.date,
                        description: holiday.description || '',
                        recurring: holiday.recurring || false
                    };
                    
                    console.log('Mapped holiday object:', holidayObj);
                    return holidayObj;
                })
                .sort((a, b) => {
                    const dateA = moment(a.date);
                    const dateB = moment(b.date);
                    return dateA.diff(dateB);
                });

            console.log('Final forthcoming holidays:', forthcomingHolidays.length);
            console.log('Forthcoming holidays with descriptions:', forthcomingHolidays.map(h => ({
                name: h.name,
                description: h.description
            })));

            // FIXED: Enhanced special hours filtering
            const forthcomingSpecialHours = businessHours.specialHours
                .filter(special => {
                    if (!special.date) return false;
                    const specialDate = moment(special.date);
                    if (!specialDate.isValid()) return false;
                    
                    return specialDate.isSameOrAfter(now.startOf('day')) && 
                           specialDate.isSameOrBefore(thirtyDaysFromNow.endOf('day'));
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            // FIXED: Return complete data structure with descriptions
            const responseData = {
                holidays: forthcomingHolidays, // This now includes descriptions
                specialHours: forthcomingSpecialHours,
                regularHours: {
                    workingHours: businessHours.workingHours,
                    workingDays: businessHours.workingDays,
                    timezone: businessHours.timezone,
                    formattedHours: businessHoursUtil.getFormattedBusinessHours(businessHours)
                }
            };

            console.log('=== RESPONSE DATA BEING SENT ===');
            console.log('Holidays count:', responseData.holidays.length);
            console.log('Holidays with descriptions:', responseData.holidays.map(h => ({ 
                name: h.name, 
                hasDescription: !!h.description,
                description: h.description 
            })));

            res.json({
                success: true,
                data: responseData
            });
        }
        catch (error) {
            console.error('Error fetching forthcoming schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching forthcoming schedule',
                error: error.message
            });
        }
    }

    static async holidaysMoreThan30Days(req, res) {
        try {
            const businessHours = await BusinessHours.findOne({ isActive: true });
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'No business hours configuration found'
                });
            }

            const now = moment().tz(businessHours.timezone);
            const thirtyDaysFromNow = now.clone().add(30, 'days');
            
            console.log('=== HOLIDAYS MORE THAN 30 DAYS DEBUG ===');
            console.log('Current time:', now.format());
            console.log('30 days from now:', thirtyDaysFromNow.format());
            console.log('Total holidays in database:', businessHours.holidays.length);

            // FIXED: Enhanced holiday processing with description preservation
            const processedHolidays = businessHours.holidays.map((holiday, index) => {
                const holidayDate = moment(holiday.date);
                const isValid = holidayDate.isValid();
                const daysFromNow = isValid ? holidayDate.diff(now.startOf('day'), 'days') : null;
                
                let isWithinRange = false;
                if (isValid) {
                    if (holiday.recurring) {
                        // Check both this year and next year for recurring holidays
                        const thisYearHoliday = now.clone()
                            .year(now.year())
                            .month(holidayDate.month())
                            .date(holidayDate.date())
                            .startOf('day');
                        
                        const nextYearHoliday = thisYearHoliday.clone().add(1, 'year');
                        
                        isWithinRange = (thisYearHoliday.isSameOrAfter(now.startOf('day')) && 
                                        thisYearHoliday.isSameOrBefore(thirtyDaysFromNow.endOf('day'))) ||
                                       (nextYearHoliday.isSameOrAfter(now.startOf('day')) && 
                                        nextYearHoliday.isSameOrBefore(thirtyDaysFromNow.endOf('day')));
                    } else {
                        isWithinRange = holidayDate.isSameOrAfter(now.startOf('day')) && 
                                       holidayDate.isSameOrBefore(thirtyDaysFromNow.endOf('day'));
                    }
                }

                // FIXED: Ensure description is included in the response
                const processedHoliday = {
                    index,
                    name: holiday.name || 'Unnamed Holiday',
                    date: holiday.date,
                    formattedDate: isValid ? holidayDate.format('YYYY-MM-DD') : 'Invalid Date',
                    description: holiday.description || '', // ENSURE DESCRIPTION IS PRESERVED
                    recurring: holiday.recurring || false,
                    isValid,
                    daysFromNow,
                    isWithinRange
                };

                console.log(`Processed holiday ${index}:`, processedHoliday);
                return processedHoliday;
            });

            const withinRangeCount = processedHolidays.filter(h => h.isWithinRange).length;
            const beyondRangeCount = processedHolidays.filter(h => !h.isWithinRange && h.isValid).length;

            console.log('Within 30 days:', withinRangeCount);
            console.log('Beyond 30 days:', beyondRangeCount);

            const debugInfo = {
                totalHolidays: businessHours.holidays.length,
                currentTime: now.format(),
                thirtyDaysFromNow: thirtyDaysFromNow.format(),
                timezone: businessHours.timezone,
                filteredHolidays: withinRangeCount,
                beyondThirtyDays: beyondRangeCount,
                holidays: processedHolidays // This now includes descriptions
            };

            console.log('=== FINAL DEBUG RESPONSE ===');
            console.log('Holidays with descriptions:', processedHolidays.map(h => ({
                name: h.name,
                hasDescription: !!h.description,
                description: h.description
            })));

            res.json({
                success: true,
                data: debugInfo
            });
        } catch (error) {
            console.error('Error in holidaysMoreThan30Days:', error);
            res.status(500).json({
                success: false,
                message: 'Debug error',
                error: error.message
            });
        }
    }

    // For Adding Default Business Hours Configuration
    static async addDefaultBusinessHoursConfiguration(req, res) {
        try { 
            const createdBy = req.user?.id;

            const existingConfig = await BusinessHours.findOne({ isActive: true });
            if (existingConfig) {
                return res.status(400).json({
                    success: false,
                    message: 'There is Already An Existing Active Business Hours Configuration'
                });
            }

            const defaultBusinessHours = await BusinessHours.createDefault(createdBy);
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
            const businessHours = await BusinessHours.findOne({ isActive: true });
            if (!businessHours) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Hours Configuration NOT FOUND'
                });
            }
            
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
