import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';

// Create booking and persist to database
export const createBooking = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const {
      bookingHotel,
      roomType,
      guests,
      checkIn,
      checkOut,
      price,
      associatedTrip,
      guestName,
      guestEmail,
      paymentId
    } = req.body;

    if (!bookingHotel || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    const id = uuidv4();
    const confirmationNumber = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const insertText = `INSERT INTO bookings (
      id, user_id, trip_id, associated_trip, hotel_name, room_type, guests, check_in, check_out, price, payment_id, confirmation_number, guest_name, guest_email
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`;

    // try to interpret associatedTrip as trip id if it looks like a UUID, else store as associated_trip text
    let tripId = null;
    if (associatedTrip && typeof associatedTrip === 'string' && associatedTrip.match(/^[0-9a-fA-F\-]{36}$/)) {
      tripId = associatedTrip;
    }

    const values = [
      id,
      userId,
      tripId,
      tripId ? null : associatedTrip,
      bookingHotel.name || bookingHotel.hotelName || 'Hotel',
      roomType || 'Standard',
      guests || 1,
      checkIn,
      checkOut,
      price || 0,
      paymentId || null,
      confirmationNumber,
      guestName || null,
      guestEmail || null
    ];

    const result = await query(insertText, values);
    const booking = result.rows[0];

    res.status(201).json({ booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

// Get bookings for the authenticated user
export const getBookings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const q = 'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await query(q, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
};
