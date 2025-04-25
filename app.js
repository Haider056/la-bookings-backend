const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectToDatabase } = require('./config/db.config');
const bookingRoutes = require('./routes/booking.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const bookingController = require('./controllers/booking.controller');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS middleware to handle WordPress requests
app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers for problematic clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection status middleware
app.use((req, res, next) => {
  // Skip check for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Check if database is connected
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    // Database connection warning - silently continue in production
    
    // Return error for API endpoints but not for static assets
    if (req.path.startsWith('/api/')) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection unavailable. Please try again later.'
      });
    }
  }
  
  next();
});

// Define routes - ensure this matches what clients are calling
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Add special routes for WordPress compatibility
app.get('/api/timeslots', bookingController.getTimeSlots);  // Match WordPress URL
app.post('/api/bookings', bookingController.create);        // Ensure POST works at the specified URL

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LA Bookings API.' });
});

// Test endpoint to verify API is working
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
  // Error occurred but we don't log it in production
  res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Route not found' 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await connectToDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      // Server started - no need to log in production
    });
  } catch (error) {
    // Failed to start server but we don't log it in production
    
    // Try to connect to the database in the background
    setTimeout(async () => {
      try {
        await connectToDatabase();
        // Database connection established after retry - no need to log in production
      } catch (err) {
        // Retry failed - silent in production
      }
    }, 5000);
    
    // Start server anyway to handle requests with appropriate error messages
    app.listen(PORT, () => {
      // Server started with limited functionality - no need to log in production
    });
  }
}

// Start the server
startServer();

module.exports = app;
