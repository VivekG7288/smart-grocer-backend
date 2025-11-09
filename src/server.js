import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import corsMiddleware from "./middleware/cors.js"; // Custom middleware
import connectDB from "./config/db.js";
import cartRoutes from "./routes/cartRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import pantryRoutes from "./routes/pantryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import testNotificationRoutes from "./routes/notificationTestRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// 1. Use custom CORS middleware globally (must be before routes)
app.use(corsMiddleware);

// 2. Log all incoming requests
app.use((req, res, next) => {
    console.log(
        `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
            req.headers.origin
        }`
    );
    next();
});

// 3. Security headers (after CORS middleware)
app.use((req, res, next) => {
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "DENY");
    res.header("X-XSS-Protection", "1; mode=block");
    next();
});

// 4. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. DB connection
connectDB();

// 6. Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/test-notifications", testNotificationRoutes);

// 7. Health check endpoints
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "Smart Grocer Backend is running",
        time: new Date().toISOString(),
    });
});

app.get("/api/health", async (req, res) => {
    try {
        const dbStatus =
            mongoose.connection.readyState === 1 ? "connected" : "disconnected";
        res.json({
            status: "ok",
            database: dbStatus,
            time: new Date().toISOString(),
            env: process.env.NODE_ENV || "development",
            cors: {
                allowedOrigins: ["https://smart-grocer-frontend.pages.dev"],
                credentials: true,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Health check failed",
            error: error.message,
        });
    }
});

// 8. Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: "error",
        message: err.message,
    });
});

// 9. 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: `Cannot ${req.method} ${req.url}`,
    });
});

// 10. Start server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(
        `✅ CORS enabled for origin https://smart-grocer-frontend.pages.dev`
    );
});

server.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
});
