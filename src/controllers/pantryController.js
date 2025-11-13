import PantryItem from "../models/PantryItem.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import { sendNotification } from "../utils/firebase.js";

/**
 * Add item to consumer's pantry
 */
export const addToPantry = async (req, res) => {
    try {
        const {
            userId,
            shopId,
            productId,
            productName,
            brandName,
            quantityPerPack,
            unit,
            packsOwned,
            price,
            refillThreshold,
        } = req.body;

        // Check if item already exists
        const existingItem = await PantryItem.findOne({
            userId,
            shopId,
            productId,
        });
        if (existingItem) {
            return res
                .status(400)
                .json({ error: "This item is already in your pantry" });
        }

        const pantryItem = new PantryItem({
            userId,
            shopId,
            productId,
            productName,
            brandName: brandName || "",
            quantityPerPack,
            unit,
            packsOwned,
            currentPacks: packsOwned,
            price,
            refillThreshold: refillThreshold || 1,
        });

        await pantryItem.save();
        await pantryItem.populate("shopId", "name");

        res.status(201).json(pantryItem);
    } catch (err) {
        console.error("❌ Error adding to pantry:", err);
        res.status(400).json({ error: err.message });
    }
};

/**
 * Get consumer's pantry items
 */
export const getUserPantry = async (req, res) => {
    try {
        const { userId } = req.params;
        const pantryItems = await PantryItem.find({ userId })
            .populate("shopId", "name location")
            .populate("productId", "name category image")
            .sort({ updatedAt: -1 });

        res.json(pantryItems);
    } catch (err) {
        console.error("❌ Error fetching pantry items:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Update pantry item (consumption tracking / refill request)
 */
export const updatePantryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPacks, status, notes } = req.body;

        const pantryItem = await PantryItem.findById(id)
            .populate("userId", "name location fcmToken")
            .populate("shopId", "name ownerId");

        if (!pantryItem) {
            return res.status(404).json({ error: "Pantry item not found" });
        }

        // Update item fields
        if (currentPacks !== undefined) pantryItem.currentPacks = currentPacks;
        if (status) pantryItem.status = status;
        if (notes) pantryItem.notes = notes;

        // Auto-change status to LOW if below threshold
        if (
            currentPacks <= pantryItem.refillThreshold &&
            pantryItem.status === "STOCKED"
        ) {
            pantryItem.status = "LOW";
        }

        await pantryItem.save();

        // If refill requested, notify shopkeeper
        if (status === "REFILL_REQUESTED") {
            const updatedItem = await PantryItem.findById(id)
                .populate("userId", "name location fcmToken")
                .populate("shopId", "name ownerId");

            await createRefillNotification(updatedItem);
        }

        res.json(pantryItem);
    } catch (err) {
        console.error("❌ Error updating pantry item:", err);
        res.status(400).json({ error: err.message });
    }
};

/**
 * Get all refill requests for a shop
 */
export const getShopRefillRequests = async (req, res) => {
    try {
        const { shopId } = req.params;

        const refillRequests = await PantryItem.find({
            shopId,
            status: {
                $in: ["REFILL_REQUESTED", "CONFIRMED", "OUT_FOR_DELIVERY"],
            },
        })
            .populate("userId", "name email phone")
            .populate("productId", "name category image")
            .sort({ updatedAt: -1 });

        res.json(refillRequests);
    } catch (err) {
        console.error("❌ Error fetching refill requests:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Shopkeeper confirms refill request
 */
export const confirmRefillRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // CONFIRMED, OUT_FOR_DELIVERY, DELIVERED

        const pantryItem = await PantryItem.findById(id)
            .populate("userId", "name fcmToken")
            .populate("shopId", "name ownerId");

        if (!pantryItem) {
            return res.status(404).json({ error: "Refill request not found" });
        }

        pantryItem.status = status;

        if (status === "DELIVERED") {
            pantryItem.packsOwned =
                pantryItem.currentPacks || pantryItem.packsOwned;
            pantryItem.currentPacks = pantryItem.packsOwned;
            pantryItem.lastRefilled = new Date();
            pantryItem.status = "STOCKED";
        }

        await pantryItem.save();

        // Notify consumer about status change
        await createStatusUpdateNotification(pantryItem, status);

        res.json(pantryItem);
    } catch (err) {
        console.error("❌ Error confirming refill request:", err);
        res.status(400).json({ error: err.message });
    }
};

/**
 * Helper: Create notification for refill request
 */
const createRefillNotification = async (pantryItem) => {
    try {
        const notification = new Notification({
            recipientId: pantryItem.shopId.ownerId,
            senderId: pantryItem.userId._id,
            userId: pantryItem.shopId.ownerId,
            shopId: pantryItem.shopId._id,
            pantryItemId: pantryItem._id,
            type: "REFILL_REQUEST",
            title: "🔔 Refill Request",
            message: `${pantryItem.userId.name} needs ${pantryItem.productName} refill (${pantryItem.currentPacks} packs remaining)`,
            actionRequired: true,
            metadata: {
                customerName: pantryItem.userId.name,
                productName: pantryItem.productName,
                quantity: pantryItem.currentPacks,
                address: `${pantryItem.userId.location?.area || ""}, ${
                    pantryItem.userId.location?.city || ""
                }`,
            },
        });

        await notification.save();

        const shopOwner = await User.findById(pantryItem.shopId.ownerId);
        if (shopOwner?.fcmToken) {
            await sendNotification(shopOwner.fcmToken, {
                title: notification.title,
                body: notification.message,
                data: {
                    type: "REFILL_REQUEST",
                    pantryItemId: pantryItem._id.toString(),
                    productName: pantryItem.productName,
                    quantity: pantryItem.currentPacks,
                    timestamp: new Date().toISOString(),
                },
            });
        }
    } catch (err) {
        console.error("❌ Failed to send refill push notification:", err);
    }
};

/**
 * Helper: Create notification for refill status updates
 */
const createStatusUpdateNotification = async (pantryItem, status) => {
    try {
        let title = "",
            message = "",
            notificationType = "";

        switch (status) {
            case "CONFIRMED":
                title = "✅ Refill Confirmed";
                message = `Your ${pantryItem.productName} refill has been confirmed by ${pantryItem.shopId.name}.`;
                notificationType = "REFILL_CONFIRMED";
                break;
            case "OUT_FOR_DELIVERY":
                title = "🚚 Out for Delivery";
                message = `Your ${pantryItem.productName} is on its way!`;
                notificationType = "OUT_FOR_DELIVERY";
                break;
            case "DELIVERED":
                title = "📦 Delivered Successfully";
                message = `Your ${pantryItem.productName} has been delivered. Thank you!`;
                notificationType = "DELIVERED";
                break;
        }

        const notification = new Notification({
            recipientId: pantryItem.userId._id,
            userId: pantryItem.userId._id,
            senderId: pantryItem.shopId.ownerId,
            shopId: pantryItem.shopId._id,
            pantryItemId: pantryItem._id,
            type: notificationType,
            title,
            message,
            actionRequired: false,
            metadata: {
                productName: pantryItem.productName,
                shopName: pantryItem.shopId.name,
                timestamp: new Date(),
            },
        });

        await notification.save();

        const consumerId = pantryItem.userId._id || pantryItem.userId;
        const consumer = await User.findById(consumerId);

        if (consumer?.fcmToken) {
            await sendNotification(consumer.fcmToken, {
                title,
                body: message,
                data: {
                    type: notificationType,
                    pantryItemId: pantryItem._id.toString(),
                    productName: pantryItem.productName,
                    timestamp: new Date().toISOString(),
                },
            });
        }
    } catch (err) {
        console.error(
            "❌ Failed to send pantry status push notification:",
            err
        );
    }
};

/**
 * Remove pantry item
 */
export const deletePantryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await PantryItem.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({ error: "Pantry item not found" });
        }

        res.json({ message: "Pantry item deleted successfully", id });
    } catch (err) {
        console.error("❌ Error while removing item from pantry:", err);
        res.status(500).json({ error: err.message });
    }
};
