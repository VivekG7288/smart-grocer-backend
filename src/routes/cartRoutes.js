import express from "express";
import {
    addToCart,
    getCart,
    removeFromCart,
    clearCart,
    updateCartQuantity, // 🆕 add this
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/", addToCart); // Add new item
router.get("/", getCart); // Get cart
router.patch("/quantity", updateCartQuantity); // 🆕 Update item quantity
router.delete("/", removeFromCart); // Remove a specific item
router.post("/clear", clearCart); // Clear entire cart

export default router;
