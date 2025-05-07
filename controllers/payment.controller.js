// Stripe payment controller
const mongoose = require('mongoose');
const Booking = require('../models/booking.model');

// Initialize Stripe with your secret key
// REPLACE_WITH_YOUR_SECRET_KEY - Just replace this text with your key
const stripe = require('stripe')('REPLACE_WITH_YOUR_SECRET_KEY');

/**
 * Create a payment intent
 */
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency, booking_data } = req.body;

        if (!amount || !currency) {
            return res.status(400).json({
                status: 'error',
                message: 'Payment amount and currency are required'
            });
        }

        // Create a new payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in cents, must be a whole number
            currency: currency,
            metadata: {
                booking_id: booking_data?.id || 'pending',
                customer_name: booking_data?.customer_name || '',
                customer_email: booking_data?.customer_email || '',
                service: booking_data?.service_name || ''
            }
        });

        // Return the client secret to the client
        res.status(200).json({
            status: 'success',
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create payment intent',
            error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
};

/**
 * Handle Stripe webhooks
 */
exports.handleWebhook = async (req, res) => {
    let event;
    try {
        // Verify the webhook signature
        const signature = req.headers['stripe-signature'];
        
        // REPLACE_WITH_YOUR_WEBHOOK_SECRET - Replace with your webhook signing secret
        const endpointSecret = 'REPLACE_WITH_YOUR_WEBHOOK_SECRET';
        
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            endpointSecret
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // Handle specific event types
    try {
        if (event.type === 'payment_intent.succeeded') {
            await handlePaymentIntentSucceeded(event.data.object);
        } else if (event.type === 'payment_intent.payment_failed') {
            await handlePaymentIntentFailed(event.data.object);
        }
        
        // Return success response to Stripe
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing webhook event:', error);
        res.status(500).json({ 
            error: 'Error processing webhook event',
            details: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
};

/**
 * Get payment status
 */
exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        if (!paymentId) {
            return res.status(400).json({
                status: 'error',
                message: 'Payment ID is required'
            });
        }
        
        // Retrieve the payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        
        // Return the payment status
        res.status(200).json({
            status: 'success',
            payment_status: paymentIntent.status,
            amount: paymentIntent.amount / 100, // Convert from cents to dollars
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
            created: new Date(paymentIntent.created * 1000).toISOString()
        });
    } catch (error) {
        console.error('Error retrieving payment status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve payment status',
            error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
};

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    try {
        // Get metadata from the payment intent
        const { booking_id } = paymentIntent.metadata;
        
        // Only process bookings with a valid booking ID (not 'pending')
        if (booking_id && booking_id !== 'pending') {
            // Update booking status in the database
            await Booking.findByIdAndUpdate(booking_id, {
                payment_status: 'paid',
                payment_intent_id: paymentIntent.id,
                payment_amount: paymentIntent.amount / 100, // Convert from cents to dollars
                updated_at: new Date()
            });
        }
    } catch (error) {
        console.error('Error handling successful payment:', error);
        throw error;
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent) {
    try {
        // Get metadata from the payment intent
        const { booking_id } = paymentIntent.metadata;
        
        // Only process bookings with a valid booking ID (not 'pending')
        if (booking_id && booking_id !== 'pending') {
            // Update booking status in the database
            await Booking.findByIdAndUpdate(booking_id, {
                payment_status: 'failed',
                payment_intent_id: paymentIntent.id,
                updated_at: new Date()
            });
        }
    } catch (error) {
        console.error('Error handling failed payment:', error);
        throw error;
    }
} 