const Booking = require('../models/booking.model');
const db = require('../config/db.config.js');
// Get all bookings
exports.findAll = async (req, res) => {
  try {
    const bookings = await Booking.findAll();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bookings', error: error.message });
  }
};

// Get a single booking
exports.findOne = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving booking', error: error.message });
  }
};

// Create a new booking
exports.create = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Content cannot be empty' });
    }
    
    const newBooking = await Booking.create(req.body);
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

// Update a booking
exports.update = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Content cannot be empty' });
    }
    
    const updated = await Booking.updateById(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
};

// Delete a booking
exports.delete = async (req, res) => {
  try {
    const deleted = await Booking.removeById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
};

// Get available time slots
exports.getTimeSlots = async (req, res) => {
    try {
      const { date, category } = req.query;
      
      // Get the current date or use provided date
      const selectedDate = date ? new Date(date) : new Date();
      
      // Generate time slots for the next 7 days
      const timeSlots = {};
      
      // Get existing bookings to avoid conflicts
      const [existingBookings] = await db.query(
        'SELECT booking_date, booking_time FROM custom_booking_submissions WHERE booking_date >= ?',
        [selectedDate.toISOString().split('T')[0]]
      );
      
      // Create a map of booked slots
      const bookedSlots = {};
      existingBookings.forEach(booking => {
        const dateKey = booking.booking_date.toISOString().split('T')[0];
        if (!bookedSlots[dateKey]) bookedSlots[dateKey] = [];
        bookedSlots[dateKey].push(booking.booking_time);
      });
      
      // Generate time slots for the next 7 days
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(selectedDate.getDate() + i);
        
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateDisplay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const fullDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const dateKey = currentDate.toISOString().split('T')[0];
        
        // Skip weekends if needed (uncomment if you want to skip weekends)
        // if (dayName === 'Saturday' || dayName === 'Sunday') continue;
        
        // Generate time slots from 9 AM to 5 PM
        const availableTimes = [];
        for (let hour = 9; hour <= 16; hour++) {
          const timeString = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
          
          // Check if this slot is already booked
          if (!bookedSlots[dateKey] || !bookedSlots[dateKey].includes(timeString)) {
            availableTimes.push(timeString);
          }
        }
        
        timeSlots[dayName] = {
          date: dateDisplay,
          full_date: fullDate,
          times: availableTimes
        };
      }
      
      res.json(timeSlots);
    } catch (error) {
      console.error('Database error:', error);
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
      
      // Check if the requested slot is available
      const [bookings] = await db.query(
        'SELECT COUNT(*) as count FROM custom_booking_submissions WHERE booking_date = ? AND booking_time = ?',
        [date, time]
      );
      
      const isAvailable = bookings[0].count === 0;
      
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
