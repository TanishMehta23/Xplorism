import express from 'express';
import { createBooking, getBookings } from '../controllers/bookingsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Protected endpoints for bookings
router.get('/', authMiddleware, getBookings);
router.post('/', authMiddleware, createBooking);

export default router;
