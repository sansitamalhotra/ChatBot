const mongoose = require("mongoose");
const dotenv = require("dotenv");
const colors = require("colors");
dotenv.config();

const environment = process.env.NODE_ENV;

const dbConnect = async () => {
  try {
    const connectionString = "mongodb://127.0.0.1:27017/prosoftsynergies-dev";

    await mongoose.connect(connectionString);
    console.log(
      `#######======= ProsoftSynergies MongoDB Database Connected Successfully in ${environment} Environment !! !! =======#######`.bgMagenta.underline.bold
    );
  } catch (error) {
    console.error(
      `#######======= Error Connecting to MongoDB Database!! =======#######`.red.underline.bold,
      error
    );
  }
};

module.exports = dbConnect;
