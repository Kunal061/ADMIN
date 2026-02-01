const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// INIT APP FIRST ✅
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/ping", (req, res) => {
  res.json({ message: "Pong! Server is running" });
});

// ROUTES
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// DB CONNECTION + SERVER START
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/testdb";
console.log("Connecting to MongoDB at:", mongoUri);

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(3000, '0.0.0.0', () => {
      console.log("REST API running on http://0.0.0.0:3000");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
