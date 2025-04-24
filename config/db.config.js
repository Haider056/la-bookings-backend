const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string from .env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bruisegamer44:U2BH9fUbB2pILX8L@cluster0.opufrmt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Global connection variable
let connection = null;

/**
 * Connect to MongoDB
 */
const connectToDatabase = async () => {
  // If already connected, return the existing connection
  if (connection) {
    return connection;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    connection = mongoose.connection;
    
    // Log successful connection
    console.log('✅ MongoDB connection successful!');
    
    // Handle connection events
    connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      connection = null;
    });
    
    // Return the connection
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

module.exports = { connectToDatabase, mongoose };