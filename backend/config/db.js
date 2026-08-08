import mongoose from "mongoose";

/**
 * connectDB
 * ---------
 * Establishes a connection to MongoDB Atlas using the MONGO_URI from .env
 *
 * Why a separate file?
 *   - Keeps server.js clean (Single Responsibility Principle)
 *   - Can be imported and tested independently
 *   - Easy to swap DB config in one place without touching server.js
 *
 * Why process.exit(1)?
 *   - If the DB fails to connect at startup, the entire app is useless
 *   - Exit code 1 signals failure to the OS / PM2 / Docker so it can restart
 */
const connectDB = async () => {
  try {
    // mongoose.connect() returns a connection object
    // We destructure .connection to access the host property for logging
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log the exact error message so you can debug connection issues
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);

    // Exit the Node process with a failure code
    // PM2 / Docker will see this and automatically restart the server
    process.exit(1);
  }
};

export default connectDB;
