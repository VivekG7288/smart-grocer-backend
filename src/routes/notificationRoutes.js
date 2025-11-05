import express from "express";
import {
    getUserNotifications,
    getUnreadCount,
    deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/user/:userId", getUserNotifications);
router.get("/user/:userId/unread-count", getUnreadCount);
router.delete("/:id", deleteNotification);

export default router;
