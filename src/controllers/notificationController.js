import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendNotification } from "../utils/oneSignal.js";

// Get user notifications
export const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;

        const notifications = await Notification.find({ recipientId: userId })
            .populate("shopId", "name")
            .populate("senderId", "name")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Test send a push notification to a user (body: { userId, title, message })
export const sendTestPush = async (req, res) => {
    try {
        const { userId, title, message } = req.body;
        if (!userId || !title || !message) return res.status(400).json({ error: 'userId, title and message required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.oneSignalPlayerId) return res.status(400).json({ error: 'User has no OneSignal player id saved' });

        const resp = await sendNotification([user.oneSignalPlayerId], title, message, { test: true });

        res.json({ message: 'Push sent (OneSignal response)', resp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete notification when read
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification deleted successfully", id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;

        const count = await Notification.countDocuments({
            recipientId: userId,
            isRead: false,
        });

        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
