import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose"; // Add mongoose import

// Load environment variables first
dotenv.config();

const app = express();

// 1. CORS configuration
const corsOptions = {
    origin: ['https://smart-grocer-frontend.pages.dev', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// 2. Apply middlewares in correct order
app.use(cors(corsOptions));  // CORS first
app.use(express.json());     // Then body parsing
app.use(express.urlencoded({ extended: true }));

// 3. Handle all OPTIONS requests
app.options('*', (req, res) => {
    res.status(204).end();
});

// ✅ 4. Lazy-load DB (after CORS)
import connectDB from "./config/db.js";
connectDB();

// ✅ 5. Routes
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import pantryRoutes from "./routes/pantryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// Basic root health check
app.get("/", (req, res) => {
  res.json({ 
    status: "ok",
    message: "Smart Grocer Backend is running",
    time: new Date().toISOString()
  });
});

// Detailed health check with DB status
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({
      status: "ok",
      database: dbStatus,
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
      cors: {
        allowedOrigins,
        credentials: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message
    });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/payments", paymentRoutes);

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message
    });
});

// Handle 404s
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Cannot ${req.method} ${req.url}`
    });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ CORS enabled for: ${corsOptions.origin}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});
