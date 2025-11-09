import express from "express";
import {
    getUserNotifications,
    getUnreadCount,
    deleteNotification,
    sendTestPush,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/user/:userId", getUserNotifications);
router.get("/user/:userId/unread-count", getUnreadCount);
router.delete("/:id", deleteNotification);

// POST /api/notifications/test -> send test push to a user
router.post('/test', sendTestPush);

export default router;
