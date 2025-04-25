const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/auth.middleware');

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

module.exports = router;
