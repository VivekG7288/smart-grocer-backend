import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

dotenv.config();
const app = express();
const PORT = 4000;

app.use(express.json());

// Connect to MongoDB
connectDB();



app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});