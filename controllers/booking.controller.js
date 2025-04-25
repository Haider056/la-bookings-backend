const Booking = require('../models/booking.model');
const { connectToDatabase, mongoose } = require('../config/db.config');

// Initialize database connection
(async () => {
  try {
    await connectToDatabase();
  } catch (error) {
    // Silent fail in production - connection will be retried by the system
  }
})();

/**
 * Generate a booking reference in the format ABC-123
 * First 3 characters are alphabetical, followed by a hyphen, then 3 numbers
 */
function generateBookingReference() {
  // Generate 3 random alphabetical characters (uppercase)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let alphabetPart = '';
  for (let i = 0; i < 3; i++) {
    alphabetPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Generate 3 random numbers
  const numericPart = Math.floor(Math.random() * 900 + 100); // 100-999
  
  // Combine to create reference
  return `${alphabetPart}-${numericPart}`;
}

// Get all bookings
exports.findAll = async (req, res) => {
  try {
    // Get all bookings for all users (both admin and regular users)
    const bookings = await mongoose.model('Booking').find({});
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bookings', error: error.message });
  }
};

// Get a single booking
exports.findOne = async (req, res) => {
  try {
    const booking = await mongoose.model('Booking').findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // All users can view all bookings, so no permission check needed here
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving booking', error: error.message });
  }
};

// Create a new booking (protected - requires authentication)
exports.create = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Content cannot be empty' });
    }
    
    // Handle date format conversion
    if (req.body.booking_date && typeof req.body.booking_date === 'string') {
      try {
        // Convert to Date object
        req.body.booking_date = new Date(req.body.booking_date);
        if (isNaN(req.body.booking_date.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    }

    // CHECK FOR DUPLICATE BOOKINGS
    // Only if both date and time are provided
    if (req.body.booking_date && req.body.booking_time) {
      // Start and end of the selected date
      const bookingDate = new Date(req.body.booking_date);
      const startDate = new Date(bookingDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(bookingDate);
      endDate.setHours(23, 59, 59, 999);
      
      // Check if the requested slot is already booked
      const existingBooking = await mongoose.model('Booking').findOne({
        booking_date: {
          $gte: startDate,
          $lte: endDate
        },
        booking_time: req.body.booking_time
      });
      
      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked. Please select another time.',
          error: 'SLOT_ALREADY_BOOKED'
        });
      }
    }

    // Add source information - from admin panel
    req.body.source = 'admin_panel';
    
    // Generate a booking reference
    req.body.booking_reference = generateBookingReference();
    
    // Create the booking using mongoose model
    const newBooking = await mongoose.model('Booking').create(req.body);
    
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

// Create a new booking from WordPress (public - no authentication required)
exports.createFromWordPress = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ 
        success: false,
        message: 'Content cannot be empty' 
      });
    }
    
    // Handle date format conversion
    if (req.body.booking_date && typeof req.body.booking_date === 'string') {
      try {
        // Convert to Date object
        req.body.booking_date = new Date(req.body.booking_date);
        if (isNaN(req.body.booking_date.getTime())) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid date format' 
          });
        }
      } catch (err) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid date format' 
        });
      }
    }
    
    // Basic validation for required fields - customize as needed for WordPress form
    if (!req.body.customer_email || !req.body.customer_name || !req.body.booking_date || !req.body.booking_time) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields',
        required: ['customer_email', 'customer_name', 'booking_date', 'booking_time']
      });
    }

    // CHECK AVAILABILITY BEFORE CREATING BOOKING
    // Start and end of the selected date
    const bookingDate = new Date(req.body.booking_date);
    const startDate = new Date(bookingDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(bookingDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Check if the requested slot is already booked
    const existingBooking = await mongoose.model('Booking').findOne({
      booking_date: {
        $gte: startDate,
        $lte: endDate
      },
      booking_time: req.body.booking_time
    });
    
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please select another time.',
        error: 'SLOT_ALREADY_BOOKED'
      });
    }

    // Add source information - from WordPress
    req.body.source = 'wordpress';
    
    // Generate a booking reference
    req.body.booking_reference = generateBookingReference();
    
    // Create booking using mongoose model directly
    const newBooking = await mongoose.model('Booking').create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking_reference: newBooking.booking_reference,
      booking: newBooking
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating booking'
    });
  }
};

// Update a booking
exports.update = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Content cannot be empty' });
    }
    
    // Handle date format conversion
    if (req.body.booking_date && typeof req.body.booking_date === 'string') {
      try {
        // Convert to Date object
        req.body.booking_date = new Date(req.body.booking_date);
        if (isNaN(req.body.booking_date.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    }
    
    // Check if booking exists
    const booking = await mongoose.model('Booking').findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Admin can update any booking, non-admin can only update their own
    if (req.user.role !== 'admin' && booking.customer_email !== req.user.email) {
      return res.status(403).json({ 
        message: 'You do not have permission to update this booking',
        error: 'PERMISSION_DENIED'
      });
    }
    
    // Update the booking
    const updated = await mongoose.model('Booking').findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({ 
      message: 'Booking updated successfully',
      booking: updated
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
};

// Delete a booking
exports.delete = async (req, res) => {
  try {
    // Check if booking exists
    const booking = await mongoose.model('Booking').findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Admin can delete any booking, non-admin can only delete their own
    if (req.user.role !== 'admin' && booking.customer_email !== req.user.email) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this booking',
        error: 'PERMISSION_DENIED'
      });
    }
    
    // Delete the booking
    await mongoose.model('Booking').findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
};

// Get available time slots
exports.getTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    // Get the current date or use provided date
    let selectedDate;
    try {
      selectedDate = date ? new Date(date) : new Date();
      if (isNaN(selectedDate.getTime())) {
        selectedDate = new Date(); // Fallback to current date if invalid
      }
    } catch (e) {
      selectedDate = new Date(); // Fallback to current date if parsing fails
    }
    
    // Ensure we're starting from the beginning of the day
    selectedDate.setHours(0, 0, 0, 0);
    
    // ===== FETCH ALL EXISTING BOOKINGS =====
    // Direct database query for maximum reliability
    const existingBookings = await mongoose.model('Booking').find({}).lean();
    
    // ===== CREATE DETAILED MAP OF BOOKED SLOTS =====
    // Map structure: { "YYYY-MM-DD": { "timeString": true } }
    const bookedSlotsMap = {};
    
    existingBookings.forEach(booking => {
      if (!booking.booking_date || !booking.booking_time) return;
      
      // Normalize the date to YYYY-MM-DD format
      const bookingDate = new Date(booking.booking_date);
      if (isNaN(bookingDate.getTime())) return; // Skip invalid dates
      
      // Format date as YYYY-MM-DD for consistent keys
      const year = bookingDate.getFullYear();
      const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(bookingDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      // Initialize the map entry if not exists
      if (!bookedSlotsMap[dateKey]) {
        bookedSlotsMap[dateKey] = {};
      }
      
      // Mark this time slot as booked
      bookedSlotsMap[dateKey][booking.booking_time] = true;
    });
    
    // ===== GENERATE TIME SLOTS FOR NEXT 7 DAYS =====
    const result = {};
    const businessHours = [9, 10, 11, 12, 13, 14, 15, 16]; // 9 AM to 5 PM (9-16)
    
    // Generate slots for 7 days starting from the selected date
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      // Calculate the current date we're processing
      const currentDate = new Date(selectedDate);
      currentDate.setDate(selectedDate.getDate() + dayOffset);
      
      // Format date components
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dateDisplay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      const fullDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      // Create normalized dateKey for lookup in booked slots map
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      // Create available times array for this day
      const availableTimes = [];
      
      // Generate all potential time slots for business hours
      for (const hour of businessHours) {
        const hourFormatted = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const timeString = `${hourFormatted}:00 ${period}`;
        
        // Check if this slot is already booked by looking it up in our map
        const isBooked = bookedSlotsMap[dateKey] && bookedSlotsMap[dateKey][timeString];
        
        if (!isBooked) {
          availableTimes.push(timeString);
        }
      }
      
      // Add this day's data to the result
      result[dayName] = {
        date: dateDisplay,
        full_date: fullDate,
        day_name: dayName,
        times: availableTimes
      };
    }
    
    // Return the available time slots
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving time slots', 
      error: error.message 
    });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { date, time } = req.query;
    
    if (!date || !time) {
      return res.status(400).json({ available: false, message: 'Date and time are required' });
    }
    
    // Convert date string to Date object for MongoDB query
    let bookingDate;
    try {
      bookingDate = new Date(date);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ available: false, message: 'Invalid date format' });
      }
    } catch (err) {
      return res.status(400).json({ available: false, message: 'Invalid date format' });
    }
    
    // Start and end of the selected date - ensure we're covering the full day
    const startDate = new Date(bookingDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(bookingDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Check if the requested slot is available by direct query
    const existingBooking = await mongoose.model('Booking').findOne({
      booking_date: {
        $gte: startDate,
        $lte: endDate
      },
      booking_time: time
    });
    
    const isAvailable = !existingBooking;
    
    res.json({
      available: isAvailable,
      message: isAvailable ? 'Time slot is available' : 'Time slot is already booked'
    });
  } catch (error) {
    res.status(500).json({ 
      available: false,
      message: 'Error checking availability', 
      error: error.message 
    });
  }
};

module.exports = exports;
