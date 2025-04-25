const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const { connectToDatabase } = require('../config/db.config');

// Initialize database connection
(async () => {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Failed to initialize database connection in admin controller:', error);
  }
})();

/**
 * Get all bookings - admin only
 */
exports.getAllBookings = async (req, res) => {
  try {
    // This should only be accessible by admins, but we double-check here
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required'
      });
    }
    
    const bookings = await Booking.findAll();
    
    res.status(200).json({
      status: 'success',
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving all bookings',
      error: error.message
    });
  }
};

/**
 * Get all users - admin only
 */
exports.getAllUsers = async (req, res) => {
  try {
    // This should only be accessible by admins, but we double-check here
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required'
      });
    }
    
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpire -verificationToken');
    
    res.status(200).json({
      status: 'success',
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving all users',
      error: error.message
    });
  }
};

/**
 * Delete a user - admin only
 */
exports.deleteUser = async (req, res) => {
  try {
    // This should only be accessible by admins, but we double-check here
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required'
      });
    }

    const userId = req.params.id;
    
    // Check if the user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Prevent deleting your own admin account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own admin account'
      });
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user',
      error: error.message
    });
  }
};

/**
 * Update booking status - admin only
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    // This should only be accessible by admins, but we double-check here
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required'
      });
    }

    const bookingId = req.params.id;
    const { status } = req.body;
    
    // Validate status
    if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Status must be one of: pending, confirmed, cancelled'
      });
    }
    
    // Check if the booking exists
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    // Update the booking status
    booking.status = status;
    await booking.save();
    
    res.status(200).json({
      status: 'success',
      message: `Booking status updated to ${status}`,
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

module.exports = exports; 