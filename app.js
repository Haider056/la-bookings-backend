const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectToDatabase } = require('./config/db.config');
const bookingRoutes = require('./routes/booking.routes');
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

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Define routes - ensure this matches what clients are calling
app.use('/api/bookings', bookingRoutes);

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
    database: 'MongoDB'
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
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
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
