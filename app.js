const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectToDatabase } = require('./config/db.config');
const bookingRoutes = require('./routes/booking.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const bookingController = require('./controllers/booking.controller');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS middleware to handle WordPress requests
app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers for problematic clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    console.warn('⚠️ Database not connected when handling request to', req.path);
    
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

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Define routes - ensure this matches what clients are calling
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

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
  console.error('❌ Unhandled error:', err);
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
    console.log('✅ MongoDB connection successfully established');

    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📍 API endpoints available at:`);
      console.log(`   - GET /api/bookings`);
      console.log(`   - GET /api/bookings/timeslots`);
      console.log(`   - GET /api/timeslots (WordPress compatibility)`);
      console.log(`   - POST /api/bookings`);
      console.log(`   - POST /api/auth/register`);
      console.log(`   - POST /api/auth/login`);
      console.log(`   - GET /api/auth/me (protected)`);
      console.log(`   - GET /api/users/profile (protected)`);
      console.log(`   - PATCH /api/users/profile (protected)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Try to connect to the database in the background
    setTimeout(async () => {
      try {
        console.log('🔄 Retrying database connection...');
        await connectToDatabase();
        console.log('✅ MongoDB connection established after retry');
      } catch (err) {
        console.error('❌ Retry failed:', err);
      }
    }, 5000);
    
    // Start server anyway to handle requests with appropriate error messages
    app.listen(PORT, () => {
      console.log(`⚠️ Server is running on port ${PORT} with limited functionality (database unavailable)`);
    });
  }
}

// Start the server
startServer();

module.exports = app;
