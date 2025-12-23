const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI; 

const connectDB = async () => {
  try {
    if (!MONGO_URI) {
        console.error("FATAL ERROR: MONGO_URI is not defined.");
        console.error("Make sure .env file exists and contains MONGO_URI");
        console.error("Checked locations:");
        console.error("- Project root: .env");
        console.error("- Backend folder: backend/.env");
        console.error("- Src folder: backend/src/.env");
        process.exit(1); 
    }
    
    console.log("Connecting to MongoDB...");
    console.log(`URI: ${MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    
    const conn = await mongoose.connect(MONGO_URI, {
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
  } catch (err) {
    console.error(`MONGODB Connection Error: ${err.message}`);
    console.error("Please check:");
    console.error("1. MongoDB server is running");
    console.error("2. Connection string is correct");
    console.error("3. Network access is allowed");
    console.error("4. Credentials are correct");
    process.exit(1);
  }
};

module.exports = connectDB;