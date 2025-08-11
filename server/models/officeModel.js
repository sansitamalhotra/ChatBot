const mongoose = require('mongoose');

// To create a schema for our office locations
const officeSchema = new mongoose.Schema({
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  phone: { type: String, required: false },
  email: { type: String, required: false },

  businessHours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessHours',
<<<<<<< HEAD
=======
    ref: 'BusinessHours',
>>>>>>> b25c96b (feat:)
    required: false // Optional for now
  }
});

const OurOffices = mongoose.model('OurOffices', officeSchema);

module.exports = OurOffices;