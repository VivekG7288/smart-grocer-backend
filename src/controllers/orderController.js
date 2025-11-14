import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { sendNotification } from "../utils/firebase.js";

// Create new order
export const createOrder = async (req, res) => {
    try {
        console.log("Creating order with data:", req.body);

        // Get customer details
        const customer = await User.findById(req.body.customerId);
        if (!customer) {
            return res.status(400).json({ error: "Customer not found" });
        }

        // Add customer contact information
        const orderData = {
            ...req.body,
            customerContact: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone, // Get phone from customer profile
            },
        };

        const order = new Order(orderData);

        // Validate delivery address
        if (
            !order.deliveryAddress.area ||
            !order.deliveryAddress.city ||
            !order.deliveryAddress.pincode
        ) {
            return res.status(400).json({
                error: "Complete delivery address (area, city, pincode) is required",
            });
        }

        // Decrease stock for each product
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res
                    .status(400)
                    .json({ error: `Product ${item.productId} not found` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
                });
            }

            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity },
            });
        }

        await order.save();

        // Populate references for response
        // Populate all necessary references
        await order.populate("customerId", "name email phone fcmToken");
        await order.populate("shopId", "name ownerId");
        await order.populate("items.productId", "name price");

        console.log("Order created successfully:", order);

        // Get shop owner's FCM token
        const shopOwner = await User.findById(
            order.shopId.ownerId,
            "fcmToken name"
        );

        // Build items summary for notification
        const itemsSummary = order.items
            .map((item) => `${item.quantity} x ${item.productId.name}`)
            .join(", ");

        // Create notification for shop owner
        const notification = new Notification({
            userId: order.shopId.ownerId,
            senderId: order.customerId._id,
            shopId: order.shopId._id,
            type: "ORDER_RECEIVED",
            title: "🛒 New Order Received",
            message: `${order.customerContact.name} placed an order: ${itemsSummary}`,
            data: {
                orderId: order._id.toString(),
                customerName: order.customerContact.name,
                items: itemsSummary,
                address: `${order.deliveryAddress.area}, ${order.deliveryAddress.city} ${order.deliveryAddress.pincode}`,
            },
        });
        // await notification.save();

        // Send FCM notification to shop owner
        if (shopOwner?.fcmToken) {
            await sendNotification(shopOwner.fcmToken, {
                title: "🛒 New Order Received",
                body: `${order.customerContact.name} placed an order: ${itemsSummary}`,
                data: {
                    type: "ORDER_RECEIVED",
                    orderId: order._id.toString(),
                    items: itemsSummary,
                    timestamp: new Date().toISOString(),
                },
            });
        }

        res.status(201).json(order);
    } catch (err) {
        console.error("Error creating order:", err);
        res.status(400).json({ error: err.message });
    }
};

// Get all orders
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("customerId", "name email phone")
            .populate("shopId", "name")
            .populate("items.productId", "name price")
            .sort({ orderDate: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("customerId", "name email phone")
            .populate("shopId", "name")
            .populate("items.productId", "name price");
        if (!order) return res.status(404).json({ error: "Order not found" });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update order status/details
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Normalize status
        const cleanStatus = status?.trim().toLowerCase();
        console.log("⚡ CLEANED STATUS:", JSON.stringify(cleanStatus));

        // Fetch and update order
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: cleanStatus.toUpperCase() },
            { new: true }
        )
            .populate("customerId", "_id name email phone fcmToken")
            .populate("shopId", "_id name ownerId")
            .populate("items.productId", "name price");

        if (!order) {
            console.log("❌ Order not found");
            return res.status(404).json({ error: "Order not found" });
        }

        // Status → Notification mapping
        let title = "";
        let message = "";

        switch (cleanStatus) {
            case "confirmed":
                title = "✅ Order Confirmed";
                message = `Your order from ${order.shopId.name} has been confirmed.`;
                break;

            case "shipped":
                title = "📦 Order Shipped";
                message = `Good news! Your order from ${order.shopId.name} is on its way.`;
                break;

            case "delivered":
                title = "🎉 Order Delivered";
                message = `Your order from ${order.shopId.name} has been delivered successfully.`;
                break;

            case "cancelled":
                title = "❌ Order Cancelled";
                message = `Your order from ${order.shopId.name} has been cancelled.`;
                break;
        }

        if (title && message) {
            const itemsSummary = order.items
                .map((i) => `${i.quantity} x ${i.productId?.name || ""}`)
                .join(", ");

            // Save notification in DB
            await new Notification({
                userId: order.customerId._id, // ✅ FIXED
                senderId: order.shopId.ownerId,
                shopId: order.shopId._id,
                type: "ORDER", // ✅ FIXED enum
                title,
                message,
                actionRequired: false,
                metadata: {
                    customerName: order.customerId.name,
                    items: itemsSummary,
                    address: `${order.deliveryAddress.area || ""}, ${
                        order.deliveryAddress.city || ""
                    } ${order.deliveryAddress.pincode || ""}`,
                },
            });

            // Push notification
            const customerUser = await User.findById(order.customerId._id);

            if (customerUser?.fcmToken) {
                console.log("Sending push notification...");
                await sendNotification(customerUser.fcmToken, {
                    title,
                    body: message,
                    data: {
                        orderId: order._id.toString(),
                        type: "ORDER_STATUS",
                    },
                });
            } else {
                console.log("❌ No FCM token for customer");
            }
        }

        res.json(order);
    } catch (err) {
        console.error("🔥 ERROR in updateOrderStatus:", err);
        res.status(400).json({ error: err.message });
    }
};

// Delete order
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        // Optionally restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity },
            });
        }
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
