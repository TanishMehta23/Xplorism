import express from 'express';
import {
  getPreferences,
  updatePreferences,
  partialUpdatePreferences
} from '../controllers/preferencesController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get user preferences
router.get('/:userId', authMiddleware, getPreferences);

// Update user preferences (full)
router.put('/:userId', authMiddleware, updatePreferences);

// Partial update user preferences (merge)
router.patch('/:userId', authMiddleware, partialUpdatePreferences);

export default router;
