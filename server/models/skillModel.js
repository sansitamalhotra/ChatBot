const mongoose = require('mongoose');
const slugify = require('slugify');

const skillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  name: [
{
      type: String,
      required: true,
      max: 15,
      trim: true, // Trim whitespace
    },
  ],
  slug: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return slugify(this.name[0]);
    },
  },
  updatedOn: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Skill", skillSchema);
