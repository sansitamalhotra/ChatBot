const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;


const applicantCountrySchema = new mongoose.Schema({

    country_code: {    
        type: String,
        required: true,  
    },

    country_name: {    
        type: String,
        required: true,  
    },
});


module.exports = mongoose.model("ApplicantCountry", applicantCountrySchema)