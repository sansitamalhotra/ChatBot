//server/services/businessHoursAdapter.js
const { businessHoursUtil } = require('../utils/businessHours');

module.exports = {
    // Let's First Return the Full non-lean but active BusinessHours document if Available
    getActive: async () => {
        try
        { 
            return await businessHoursUtil.getCachedBusinessHours();
        }
        catch (error)
        {
            console.error('Business Hours Adapter getActive() rror: ', error)
            return null;
        }
    },

    // Now Let's return boolean: Check Whether or not We are open now
    isOpenForUsers: async (userTimezone = null) => {
        try
        { 
            // For now, we will rely on util's isWithinBusinessHours (based on configured timezone).
            // But later we will implement a feature per-user timezone behavior, extend businessHoursUtil and call here.
            return await businessHoursUtil.isWithinBusinessHours();
        }
        catch (error)
        {
            console.error('Business Hours Adapter isOpenForUser() error:', error);
            return false;
        }
    },
    // Get next available opening time (string or Date depending on your util)
    getNextAvailableTimeSlot: async () => {
        try
        { 
            return await businessHoursUtil.getNextBusinessHour();
        }
        catch (error)
        {
            console.error('Business Hours Adapter getNextAvailableTime() error:', error);
            return null;
        }
    },
    // Return a detailed status object
    getStatusDetails: async () => {
        try
        {
            return await businessHoursUtil.getDetailedStatus();
        }
        catch (error)
        {
            console.error('Business HoursAdapter getDetailedStatus() error:', error);
            return {
                isOpen: false,
                isConfigured: false
            };
        }
    },
    // Clear/Clean cache control
    clearCache: () => {
        try
        {
            return businessHoursUtil.clearCache();
        } catch (error)
        {
            console.error('Business Hours Adapter clearCache() error:', error);
        }
    }
};
