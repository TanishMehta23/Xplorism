import express from 'express';
import { getFavorites, addFavorite, deleteFavorite, checkFavorite } from '../controllers/favoriteController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All favorite routes require authentication
router.use(authMiddleware);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.get('/check', checkFavorite);
router.delete('/:id', deleteFavorite);

export default router;

