import express from 'express';
import { getTrips, createTrip, updateTrip, deleteTrip, generateItinerary } from '../controllers/tripController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect all trip endpoints
router.use(authMiddleware);

router.get('/', getTrips);
router.post('/', createTrip);
router.post('/generate', generateItinerary);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

export default router;

