import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            },
        ],
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
            default: "PENDING",
        },

        // Add delivery address to order
        deliveryAddress: {
            flat: { type: String, required: true },
            building: { type: String },
            street: { type: String },
            area: { type: String, required: true },
            landmark: { type: String },
            city: { type: String, required: true },
            pincode: { type: String, required: true },
            coordinates: { type: [Number] }, // [longitude, latitude]
            formattedAddress: { type: String },
        },

        orderDate: { type: Date, default: Date.now },
        deliveryDate: { type: Date },

        // Customer contact info (separate from user account)
        customerContact: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String },
        },
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
