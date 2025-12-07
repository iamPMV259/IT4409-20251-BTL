const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI; 

const connectDB = async () => {
  try {
    if (!MONGO_URI) {
        console.error("FATAL ERROR: MONGO_URI is not defined.");
        process.exit(1); 
    }
    
    const conn = await mongoose.connect(MONGO_URI, {
    });
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(` MONGODB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;