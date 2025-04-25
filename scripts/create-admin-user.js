/**
 * Script to create an admin user
 * 
 * Usage: 
 *   node scripts/create-admin-user.js <name> <email> <password>
 * Example:
 *   node scripts/create-admin-user.js "Admin User" admin@example.com securepassword
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { connectToDatabase } = require('../config/db.config');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 3) {
  console.error('Usage: node scripts/create-admin-user.js <name> <email> <password>');
  process.exit(1);
}

const [name, email, password] = args;

// Validate email format
if (!email.match(/^\S+@\S+\.\S+$/)) {
  console.error('Invalid email format');
  process.exit(1);
}

// Validate password length
if (password.length < 6) {
  console.error('Password must be at least 6 characters');
  process.exit(1);
}

// Function to create admin user
async function createAdminUser() {
  try {
    // Connect to database
    await connectToDatabase();
    console.log('Connected to database');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists`);

      // If user exists but is not an admin, upgrade to admin
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`User ${email} role upgraded to admin`);
      } else {
        console.log(`User ${email} is already an admin`);
      }

      await mongoose.connection.close();
      return;
    }

    // Create new admin user
    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isVerified: true
    });

    console.log(`Admin user created: ${adminUser.email}`);

    // Close the database connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdminUser(); 