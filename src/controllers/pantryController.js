import PantryItem from "../models/PantryItem.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";

// Add item to consumer's pantry
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

        // Check if item already exists in pantry
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
        res.status(400).json({ error: err.message });
    }
};

// Get consumer's pantry items
export const getUserPantry = async (req, res) => {
    try {
        const { userId } = req.params;

        const pantryItems = await PantryItem.find({ userId })
            .populate("shopId", "name location")
            .populate("productId", "name category image")
            .sort({ updatedAt: -1 });

        res.json(pantryItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update pantry item (consumption tracking)
export const updatePantryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPacks, status, notes } = req.body;

        const pantryItem = await PantryItem.findById(id)
            .populate("userId", "name")
            .populate("shopId", "name ownerId");

        if (!pantryItem) {
            return res.status(404).json({ error: "Pantry item not found" });
        }

        // Update the item
        if (currentPacks !== undefined) pantryItem.currentPacks = currentPacks;
        if (status) pantryItem.status = status;
        if (notes) pantryItem.notes = notes;

        // Auto-update status based on current packs
        if (
            currentPacks <= pantryItem.refillThreshold &&
            pantryItem.status === "STOCKED"
        ) {
            pantryItem.status = "LOW";
        }

        await pantryItem.save();

        // If refill requested, create notification for shopkeeper
        if (status === "REFILL_REQUESTED") {
            const updatedItem = await PantryItem.findById(id)
                .populate("userId", "name")
                .populate("shopId", "name ownerId");

            await createRefillNotification(updatedItem);
        }

        res.json(pantryItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update the pantry controller to populate delivery address
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
        res.status(500).json({ error: err.message });
    }
};

// Shopkeeper confirms refill request
export const confirmRefillRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED'

        const pantryItem = await PantryItem.findById(id)
            .populate("userId", "name")
            .populate("shopId", "name");

        if (!pantryItem) {
            return res.status(404).json({ error: "Refill request not found" });
        }

        pantryItem.status = status;

        if (status === "DELIVERED") {
            // ✅ update total packs and reset to full stock
            pantryItem.packsOwned =
                pantryItem.currentPacks || pantryItem.packsOwned;
            pantryItem.currentPacks = pantryItem.packsOwned;
            pantryItem.lastRefilled = new Date();
            pantryItem.status = "STOCKED"; // pantry restocked
        }

        await pantryItem.save();

        // Create notification for consumer
        await createStatusUpdateNotification(pantryItem, status);

        res.json(pantryItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Helper function to create refill notification
const createRefillNotification = async (pantryItem) => {
    const notification = new Notification({
        recipientId: pantryItem.shopId.ownerId,
        senderId: pantryItem.userId._id,
        shopId: pantryItem.shopId._id,
        pantryItemId: pantryItem._id,
        type: "REFILL_REQUEST",
        title: "🔔 Refill Request",
        message: `${pantryItem.userId.name} needs ${pantryItem.productName} refill (${pantryItem.currentPacks} packs remaining)`,
        actionRequired: true,
        metadata: {
            customerName: pantryItem.userId.name,
            productName: pantryItem.productName,
            quantity: pantryItem.currentPacks, // ✅ Now uses updated value
            address:
                pantryItem.userId.location?.address || "Address not available",
        },
    });

    await notification.save();
};

/// Helper function to create status update notification
const createStatusUpdateNotification = async (pantryItem, status) => {
    let title, message, notificationType;

    switch (status) {
        case "CONFIRMED":
            title = "✅ Order Confirmed";
            message = `Your ${pantryItem.productName} refill has been confirmed by ${pantryItem.shopId.name}`;
            notificationType = "REFILL_CONFIRMED"; // Fix: Use correct enum value
            break;
        case "OUT_FOR_DELIVERY":
            title = "🚚 Out for Delivery";
            message = `Your ${pantryItem.productName} is out for delivery!`;
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
        senderId: pantryItem.shopId.ownerId,
        shopId: pantryItem.shopId._id,
        pantryItemId: pantryItem._id,
        type: notificationType, // Use the corrected type
        title,
        message,
        actionRequired: false,
    });

    await notification.save();
};

//remove item from pantry
export const deletePantryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteItem = await PantryItem.findByIdAndDelete(id);

        if (!deleteItem) {
            return res.status(404).json({ error: "Pantry item not found" });
        }

        res.json({ message: "Pantry item deleted successfully", id });
    } catch (error) {
        console.error("Error while removing item from pantry", err);
    }
};
