const mongoose = require('mongoose');
const User = require('../models/user.model');
const { connectToDatabase } = require('../config/db.config');
const bcrypt = require('bcryptjs');

// Function to create or update admin users
async function setupAdminUsers() {
  try {
    // Connect to the database
    await connectToDatabase();
    console.log('Connected to MongoDB successfully');

    // 1. Update existing user to admin role or create if it doesn't exist
    const existingEmail = 'brusiegamer44@gmail.com'; // Corrected spelling
    let existingUser = await User.findOne({ email: existingEmail });
    
    if (existingUser) {
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`Updated user ${existingEmail} to admin role`);
    } else {
      // Create new user with admin role
      existingUser = new User({
        name: 'Brusie Admin',
        email: existingEmail,
        password: 'Admin2025!', // Will be hashed by pre-save hook
        role: 'admin',
        isVerified: true
      });
      
      await existingUser.save();
      console.log(`Created new admin user with email: ${existingEmail}`);
    }

    // 2. Create new admin user or update if exists
    const newAdminEmail = 'ericm2020sa@gmail.com';
    const newAdminPassword = 'webBooking2025!';
    
    let newAdmin = await User.findOne({ email: newAdminEmail });
    
    if (newAdmin) {
      // Update existing user to admin
      newAdmin.role = 'admin';
      
      // Check if we should update password
      if (process.argv.includes('--update-password')) {
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newAdminPassword, salt);
        newAdmin.password = hashedPassword;
        console.log(`Updated password for ${newAdminEmail}`);
      }
      
      await newAdmin.save();
      console.log(`Updated user ${newAdminEmail} to admin role`);
    } else {
      // Create new admin user
      newAdmin = new User({
        name: 'Eric Admin',
        email: newAdminEmail,
        password: newAdminPassword, // Will be hashed by pre-save hook
        role: 'admin',
        isVerified: true
      });
      
      await newAdmin.save();
      console.log(`Created new admin user ${newAdminEmail}`);
    }

    console.log('Admin users setup completed');
  } catch (error) {
    console.error('Error setting up admin users:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
setupAdminUsers(); 