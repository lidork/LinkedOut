const mongoose = require("mongoose");

const connect = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/social_network";
  await mongoose.connect(uri);
  console.log("MongoDB connected:", mongoose.connection.host);
};

module.exports = { connect };
