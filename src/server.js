import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

// Load environment variables first
dotenv.config();

const app = express();

// 1. CORS configuration - this must come FIRST
const corsOptions = {
  origin: 'https://smart-grocer-frontend.pages.dev',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 2. OPTIONS preflight support - handle before all routes
app.options('*', cors(corsOptions));

// 3. Request logger - runs after CORS
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// 4. Security headers - runs after CORS so CORS headers are not blocked/overwritten
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// 5. Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Database
import connectDB from "./config/db.js";
connectDB();

// 7. API routes
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import pantryRoutes from "./routes/pantryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);

// 8. Health checks
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Smart Grocer Backend is running",
    time: new Date().toISOString()
  });
});
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({
      status: "ok",
      database: dbStatus,
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
      cors: {
        allowedOrigins: [corsOptions.origin],
        credentials: corsOptions.credentials
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

// 9. Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message
  });
});

// 10. 404 handler
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
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
