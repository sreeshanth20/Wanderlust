require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const dbUrl = process.env.ATLASDB_URL;

mongoose.connect(dbUrl)
  .then(() => {
    console.log("Connected to Atlas");
    initDB();
  })
  .catch((err) => {
    console.log(err);
  });

const initDB = async () => {
  await Listing.deleteMany({});

  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "67f66aea2c553179533f7cc1"  // your user id
  }));

  await Listing.insertMany(initData.data);
  console.log("Data was initialized");
  mongoose.connection.close();
};
