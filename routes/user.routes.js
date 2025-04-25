const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get current user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update user profile
router.patch('/profile', authMiddleware, userController.updateProfile);

module.exports = router; 