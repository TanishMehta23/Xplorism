import express from 'express';
import rateLimit from 'express-rate-limit';
import { getConversations, getMessages, deleteConversation, postChatMessage } from '../controllers/chatController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Chat specific rate limiter (15 requests per minute per IP)
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many chat messages sent. Please wait a minute and try again.'
  }
});

// Protect all chat routes
router.use(authMiddleware);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.delete('/conversations/:conversationId', deleteConversation);
router.post('/message', chatLimiter, postChatMessage);

export default router;
