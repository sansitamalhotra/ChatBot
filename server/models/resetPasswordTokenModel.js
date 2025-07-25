const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const resetTokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    resetToken: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 18000,
    },
});

module.exports = mongoose.model("ResetToken", resetTokenSchema)