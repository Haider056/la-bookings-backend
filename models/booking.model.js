const { mongoose } = require('../config/db.config');

// Define booking schema
const bookingSchema = new mongoose.Schema({
  booking_reference: {
    type: String,
    required: true,
    unique: true
  },
  customer_name: {
    type: String,
    required: true
  },
  customer_email: {
    type: String,
    required: true
  },
  customer_phone: {
    type: String,
    required: true
  },
  service_name: {
    type: String,
    required: true
  },
  service_details: {
    type: String,
    required: true
  },
  booking_date: {
    type: Date,
    required: true
  },
  booking_time: {
    type: String,
    required: true
  },
  employee_id: {
    type: Number,
    default: 0
  },
  category_id: {
    type: Number,
    default: 0
  },
  booking_notes: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // Don't use Mongoose's built-in timestamps
});

// Create the model
const Booking = mongoose.model('Booking', bookingSchema);

// Booking model methods
class BookingModel {
  static async findAll() {
    try {
      return await Booking.find().sort({ created_at: -1 });
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      return await Booking.findById(id);
    } catch (error) {
      throw error;
    }
  }

  static async create(bookingData) {
    try {
      // Generate a booking reference
      const bookingRef = 'BK-' + Math.floor(Math.random() * 10000);
      
      // Add booking reference and created_at timestamp
      const dataToInsert = {
        ...bookingData,
        booking_reference: bookingRef,
        created_at: new Date()
      };
      
      // Remove any fields that don't exist in the schema
      delete dataToInsert.current_step;
      
      const booking = new Booking(dataToInsert);
      await booking.save();
      
      return booking;
    } catch (error) {
      throw error;
    }
  }

  static async updateById(id, bookingData) {
    try {
      // Remove fields that shouldn't be updated
      delete bookingData.id;
      delete bookingData.booking_reference;
      delete bookingData.created_at;
      delete bookingData.current_step;
      
      const result = await Booking.findByIdAndUpdate(id, bookingData, { new: true });
      return !!result;
    } catch (error) {
      throw error;
    }
  }

  static async removeById(id) {
    try {
      const result = await Booking.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw error;
    }
  }
  
  // Get bookings for a specific date
  static async findByDate(date) {
    try {
      // Create start and end date for the given date (full day)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      return await Booking.find({
        booking_date: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ booking_time: 1 });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BookingModel;