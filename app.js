const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectToDatabase } = require('./config/db.config');
const bookingRoutes = require('./routes/booking.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const bookingController = require('./controllers/booking.controller');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Request logging middleware
app.use((req, res, next) => {
    console.log('\n=== Incoming Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Origin:', req.headers.origin || 'No origin');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('========================\n');

    // Log response
    const oldSend = res.send;
    res.send = function(data) {
        console.log('\n=== Outgoing Response ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Status:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.getHeaders(), null, 2));
        console.log('Body:', data);
        console.log('========================\n');
        return oldSend.apply(res, arguments);
    };

    next();
});

// Simple CORS configuration
app.use(cors());

// CORS logging middleware
app.use((req, res, next) => {
    console.log('\n=== CORS Headers ===');
    console.log('Setting CORS headers for request from:', req.headers.origin || 'No origin');
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    
    console.log('CORS Headers Set:', {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
    });
    console.log('========================\n');
    
    next();
});

// Special raw body parser for Stripe webhooks
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Regular body parsers for other routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection status middleware
app.use((req, res, next) => {
    // Skip check for OPTIONS requests
    if (req.method === 'OPTIONS') {
        console.log('Skipping database check for OPTIONS request');
        return next();
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        console.log('Database not connected. ReadyState:', mongoose.connection.readyState);
        // Return error for API endpoints but not for static assets
        if (req.path.startsWith('/api/')) {
            return res.status(503).json({
                status: 'error',
                message: 'Database connection unavailable. Please try again later.'
            });
        }
    } else {
        console.log('Database connected. ReadyState:', mongoose.connection.readyState);
    }
    next();
});

// Define routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Add special routes for WordPress compatibility
app.get('/api/timeslots', bookingController.getTimeSlots);
app.post('/api/bookings', bookingController.create);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to LA Bookings API.' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'success', 
        message: 'API is working correctly',
        timestamp: new Date().toISOString(),
        database: 'MongoDB',
        db_connected: require('mongoose').connection.readyState === 1
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('\n=== Error Occurred ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error:', err);
    console.error('Request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });
    console.error('========================\n');

    res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
});

// Handle 404
app.use((req, res) => {
    console.log('\n=== 404 Not Found ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });
    console.log('========================\n');

    res.status(404).json({ 
        status: 'error',
        message: 'Route not found' 
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`\n=== Server Started ===`);
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log(`Port: ${PORT}`);
            console.log(`Database: Connected`);
            console.log(`========================\n`);
        });
    } catch (error) {
        console.error('\n=== Server Start Error ===');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Error:', error);
        console.error('========================\n');

        setTimeout(async () => {
            try {
                await connectToDatabase();
                console.log('\n=== Database Reconnected ===');
                console.log('Timestamp:', new Date().toISOString());
                console.log(`========================\n`);
            } catch (err) {
                console.error('\n=== Database Reconnection Failed ===');
                console.error('Timestamp:', new Date().toISOString());
                console.error('Error:', err);
                console.error('========================\n');
            }
        }, 5000);
        
        app.listen(PORT, () => {
            console.log(`\n=== Server Started (Limited Functionality) ===`);
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log(`Port: ${PORT}`);
            console.log(`Database: Not Connected`);
            console.log(`========================\n`);
        });
    }
}

startServer();

module.exports = app;
