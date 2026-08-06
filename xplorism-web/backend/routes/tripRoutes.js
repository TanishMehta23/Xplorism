import express from 'express';
import { 
  getTrips, 
  createTrip, 
  updateTrip, 
  deleteTrip, 
  generateItinerary, 
  getPackingList, 
  updatePackingList,
  getSharedTrip,
  getTripLocalEvents
} from '../controllers/tripController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public route for shared trips
router.get('/share/:id', getSharedTrip);

// Apply auth middleware to protect all other trip endpoints
router.use(authMiddleware);

router.get('/', getTrips);
router.post('/', createTrip);
router.post('/generate', generateItinerary);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

// Packing list endpoints
router.get('/:id/packing', getPackingList);
router.put('/:id/packing', updatePackingList);

// Local events route
router.get('/:id/events', getTripLocalEvents);

export default router;

