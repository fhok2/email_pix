require('dotenv').config();
const path = require('path');

const config = {
  mongodb: {
    url: process.env.MONGODB_URI ,
    databaseName: process.env.DB_NAME || "eficazMail1",
    options: {}
  },
  migrationsDir: path.join(__dirname, 'migrations'),
  changelogCollectionName: "changelog"
};

module.exports = config;
