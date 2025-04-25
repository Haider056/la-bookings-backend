const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string from .env
const MONGODB_URI = process.env.MONGODB_URI 

// Global connection variable
let connection = null;

/**
 * Connect to MongoDB
 */
const connectToDatabase = async () => {
  // If already connected, return the existing connection
  if (connection && mongoose.connection.readyState === 1) {
    return connection;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB with improved options - removed unsupported options
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 45000 // Prevent timeout errors
    });
    
    connection = mongoose.connection;
    
    // Log successful connection
    console.log('✅ MongoDB connection successful!');
    
    // Handle connection events
    connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      // Try to reconnect
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to MongoDB...');
        mongoose.connect(MONGODB_URI).catch(err => console.error('Reconnection failed:', err));
      }, 5000);
    });
    
    connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected - attempting to reconnect');
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to MongoDB...');
        mongoose.connect(MONGODB_URI).catch(err => console.error('Reconnection failed:', err));
      }, 5000);
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    // Return the connection
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    // Try to reconnect after delay
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect to MongoDB after failure...');
      connectToDatabase().catch(err => console.error('Reconnection failed:', err));
    }, 5000);
    throw error;
  }
};

module.exports = { connectToDatabase, mongoose };