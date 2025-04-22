const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const bookingRoutes = require('./routes/booking.routes');

const app = express();

const corsOptions = {
    origin: ['https://la-bookings.com', 'http://localhost'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', bookingRoutes);

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LA Bookings API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
