import express from 'express';
import { getPosts, createPost, likePost, updatePost, deletePost } from '../controllers/postController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect all community post endpoints
router.use(authMiddleware);

router.get('/', getPosts);
router.post('/', createPost);
router.post('/:id/like', likePost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
