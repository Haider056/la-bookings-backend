const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/auth.middleware');
const Booking = require('../models/booking.model');

// Public routes

// Get available time slots - must be before :id route to avoid confusion
router.get('/timeslots', bookingController.getTimeSlots);

// Check availability - must be before :id route to avoid confusion
router.get('/availability', bookingController.checkAvailability);

// WordPress booking creation endpoint - no authentication required
router.post('/wordpress', bookingController.createFromWordPress);

// Protected routes - require authentication
router.use(authMiddleware);

// Get all bookings (filtered by role - admins see all, users see only their own)
router.get('/', bookingController.findAll);

// Get a single booking
router.get('/:id', bookingController.findOne);

// Create a new booking (protected - admin panel)
router.post('/', bookingController.create);

// Update a booking
router.put('/:id', bookingController.update);
router.patch('/:id', bookingController.update);

// Delete a booking
router.delete('/:id', bookingController.delete);

// Debug route to show all bookings
router.get('/debug/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ booking_date: 1, booking_time: 1 });
        console.log('=== ALL BOOKINGS IN DATABASE ===');
        bookings.forEach(booking => {
            console.log({
                id: booking._id,
                category_id: booking.category_id,
                booking_date: booking.booking_date,
                booking_time: booking.booking_time,
                service_name: booking.service_name,
                customer_name: booking.customer_name,
                status: booking.status
            });
        });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

module.exports = router;
