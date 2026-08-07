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
import {
  getSharedTrips,
  addCollaborator,
  getCollaborators,
  removeCollaborator,
  getTripMessages,
  postTripMessage,
  joinTrip
} from '../controllers/tripCollaboratorController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public route for shared trips
router.get('/share/:id', getSharedTrip);

// Apply auth middleware to protect all other trip endpoints
router.use(authMiddleware);

// Collaboration & Workspace routes
router.get('/shared-workspace', getSharedTrips);
router.get('/:id/collaborators', getCollaborators);
router.post('/:id/collaborators', addCollaborator);
router.delete('/:id/collaborators/:userId', removeCollaborator);
router.post('/:id/join', joinTrip);

// Trip Chat routes
router.get('/:id/messages', getTripMessages);
router.post('/:id/messages', postTripMessage);

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

