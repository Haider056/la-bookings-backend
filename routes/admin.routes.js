const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Protect all admin routes with authentication
router.use(authMiddleware);

// Protect all admin routes with admin role check
router.use(adminMiddleware);

// Get all bookings (admin only)
router.get('/all', adminController.getAllBookings);

// Get all users (admin only)
router.get('/users/all', adminController.getAllUsers);

// Delete a user (admin only)
router.delete('/users/delete/:id', adminController.deleteUser);

// Update booking status (admin only)
router.patch('/bookings/:id/status', adminController.updateBookingStatus);

module.exports = router; 