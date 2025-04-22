const db = require('../config/db.config');

class Booking {
  static async findAll() {
    try {
      const [rows] = await db.query('SELECT * FROM custom_booking_submissions ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query('SELECT * FROM custom_booking_submissions WHERE id = ?', [id]);
      return rows[0];
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
      
      // Remove any fields that don't exist in the table
      delete dataToInsert.current_step;
      
      const [result] = await db.query(
        'INSERT INTO custom_booking_submissions SET ?',
        [dataToInsert]
      );
      
      return { 
        id: result.insertId,
        booking_reference: bookingRef,
        ...dataToInsert 
      };
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
      
      const [result] = await db.query(
        'UPDATE custom_booking_submissions SET ? WHERE id = ?',
        [bookingData, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async removeById(id) {
    try {
      const [result] = await db.query('DELETE FROM custom_booking_submissions WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Get bookings for a specific date
  static async findByDate(date) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM custom_booking_submissions WHERE booking_date = ? ORDER BY booking_time',
        [date]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Booking;