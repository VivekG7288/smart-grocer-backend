import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // load .env first

const app = express();

// ✅ 1. Configure allowed origins
const allowedOrigins = [
  "https://smart-grocer-frontend.pages.dev",
  "http://localhost:5173",
  "http://localhost:3000"
];

// ✅ 2. Manual CORS middleware (handles all cases)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ 3. Express setup
app.use(express.json());

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

// ✅ 6. Root route (for uptime checks)
app.get("/", (req, res) => {
  res.send("Smart Grocer backend is running ✅");
});

// ✅ 7. Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Smart Grocer Server running on port ${PORT}`));
