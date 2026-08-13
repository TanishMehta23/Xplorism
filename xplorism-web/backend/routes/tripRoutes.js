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
  getTripLocalEvents,
  getTripPolls,
  createTripPoll,
  voteTripPoll,
  deleteTripPoll,
  suggestActivityAlternatives,
  submitHelpRequest
} from '../controllers/tripController.js';
import {
  getSharedTrips,
  addCollaborator,
  getCollaborators,
  removeCollaborator,
  getTripMessages,
  postTripMessage,
  joinTrip,
  respondToInvitation
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
router.post('/:id/collaborators/respond', respondToInvitation);

// Trip Chat routes
router.get('/:id/messages', getTripMessages);
router.post('/:id/messages', postTripMessage);

router.get('/', getTrips);
router.post('/', createTrip);
router.post('/generate', generateItinerary);
router.post('/suggest-activity', suggestActivityAlternatives);
router.post('/help-center', submitHelpRequest);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

// Packing list endpoints
router.get('/:id/packing', getPackingList);
router.put('/:id/packing', updatePackingList);

// Local events route
router.get('/:id/events', getTripLocalEvents);

// Poll routes
router.get('/:id/polls', getTripPolls);
router.post('/:id/polls', createTripPoll);
router.post('/:id/polls/:pollId/vote', voteTripPoll);
router.delete('/:id/polls/:pollId', deleteTripPoll);

export default router;

