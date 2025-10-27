import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import pantryRoutes from "./routes/pantryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import cors from "cors";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// CORS: allow deployed frontend and localhost for local dev
const allowedOrigins = [
    "https://smart-grocer-frontend.pages.dev",
    "http://localhost:5173",
    "http://localhost:3000"
];

app.use(cors({
        origin: function(origin, callback) {
            // allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                return callback(null, true);
            } else {
                return callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true
}));

// Ensure preflight requests receive the CORS headers
app.options("*", cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use("/api/users", userRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Smart Grocery Server running on port ${PORT}`)
);
