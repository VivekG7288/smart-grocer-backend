// controllers/cartController.js
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// 🛒 Add item to cart (create or update)
export const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId) {
            return res
                .status(400)
                .json({ error: "userId and productId are required" });
        }

        // Find existing cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: [{ productId, quantity: quantity || 1 }],
            });
        } else {
            // Check if product already exists in the cart
            const existingItem = cart.items.find(
                (item) => item.productId.toString() === productId
            );

            if (existingItem) {
                existingItem.quantity += quantity || 1;
            } else {
                cart.items.push({ productId, quantity: quantity || 1 });
            }
        }

        await cart.save();
        await cart.populate(
            "items.productId",
            "name price image category stock shopId unit"
        );

        res.status(200).json(cart);
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// 📋 Get user's cart
export const getCart = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const cart = await Cart.findOne({ userId }).populate(
            "items.productId",
            "name price image category stock shopId"
        );

        res.status(200).json(cart || { userId, items: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ❌ Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        cart.items = cart.items.filter(
            (item) => item.productId.toString() !== productId
        );

        await cart.save();
        await cart.populate(
            "items.productId",
            "name price image category stock shopId unit"
        );

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🧹 Clear user's cart
export const clearCart = async (req, res) => {
    try {
        const { userId } = req.body;
        await Cart.findOneAndUpdate({ userId }, { items: [] });
        res.json({ message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔄 Update item quantity in cart
export const updateCartQuantity = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId) {
            return res
                .status(400)
                .json({ error: "userId and productId are required" });
        }

        if (typeof quantity !== "number" || quantity < 0) {
            return res.status(400).json({ error: "Invalid quantity" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        const item = cart.items.find(
            (i) => i.productId.toString() === productId
        );

        if (!item)
            return res.status(404).json({ error: "Product not found in cart" });

        if (quantity === 0) {
            // If quantity is 0, remove item from cart
            cart.items = cart.items.filter(
                (i) => i.productId.toString() !== productId
            );
        } else {
            // Otherwise, update the quantity
            item.quantity = quantity;
        }

        await cart.save();
        await cart.populate(
            "items.productId",
            "name price image category stock shopId unit"
        );

        res.status(200).json(cart);
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(500).json({ error: "Server error" });
    }
};
