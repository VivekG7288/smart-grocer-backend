import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/user/:userId', getUserNotifications);
router.put('/:id/read', markAsRead);
router.get('/user/:userId/unread-count', getUnreadCount);

export default router;
