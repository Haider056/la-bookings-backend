const express = require('express');
const paymentController = require('../controllers/payment.controller');
const router = express.Router();

// Route for creating a payment intent
router.post('/create-intent', paymentController.createPaymentIntent);

// Route for handling Stripe webhooks
router.post('/webhook', paymentController.handleWebhook);

// Get payment status
router.get('/:paymentId', paymentController.getPaymentStatus);

module.exports = router; 