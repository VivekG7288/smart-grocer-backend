import Notification from "../models/Notification.js";

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
