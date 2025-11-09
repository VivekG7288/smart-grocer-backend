import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
        pantryItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PantryItem",
        },
        type: {
            type: String,
            enum: [
                "REFILL_REQUEST",
                "REFILL_CONFIRMED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
                "ORDER",
                "ORDER_RECEIVED",
                "LOW_INVENTORY"
            ],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        actionRequired: { type: Boolean, default: false }, // For shopkeeper confirmations
        metadata: {
            customerName: String,
            productName: String,
            quantity: Number,
            address: String,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
