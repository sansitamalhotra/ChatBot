const mongoose = require("mongoose");
const dotenv = require("dotenv");
const colors = require("colors");
const { logWithIcon } = require('../services/consoleIcons');
dotenv.config();


const username = "ProsoftProductionDB";
const password = "ZeOBkgdLvo5fbEYf";
const clusterUrl = "atlascluster.8cvwiuf.mongodb.net";
const databaseName = "ProsoftDatabase";
//const environment = process.env.NODE_ENV_PROD;
const environment = process.env.NODE_ENV;

const dbConnect = async () => {
  try {
    //const connectionString = `mongodb+srv://${username}:${password}@${clusterUrl}/${databaseName}?retryWrites=true&w=majority`;
    const connectionString = "mongodb://127.0.0.1:27017/prosoftsynergies-dev";

    await mongoose.connect(connectionString);
    logWithIcon.success(
      `#######======= ProsoftSynergies MongoDB Database Connected Successfully in ${environment} Environment !! !! =======#######`.bgMagenta.underline.bold
    );
  } catch (error) {
    logWithIcon.error(
      `#######======= Error Connecting to MongoDB Database!! =======#######`.red.underline.bold,
      error
    );
  }
};

module.exports = dbConnect;
