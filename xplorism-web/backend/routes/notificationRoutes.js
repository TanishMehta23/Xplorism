import express from 'express';
import { getNotifications, sendEmailReminder } from '../controllers/notificationController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.post('/email-reminder', sendEmailReminder);

export default router;
