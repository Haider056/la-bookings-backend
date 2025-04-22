const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

// Get all bookings
router.get('/', bookingController.findAll);

// Get a single booking
router.get('/:id', bookingController.findOne);

// Create a new booking
router.post('/', bookingController.create);

// Update a booking
router.put('/:id', bookingController.update);

// Delete a booking
router.delete('/:id', bookingController.delete);

// Get available time slots
router.get('/timeslots', bookingController.getTimeSlots);

// Check availability
router.get('/availability', bookingController.checkAvailability);

module.exports = router;
