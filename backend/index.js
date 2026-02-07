require("dotenv").config({ path: __dirname + '/.env' });
const express = require("express");
const cors = require("cors");

// INIT APP
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/ping", (req, res) => {
  res.json({ message: "Pong! Server is running" });
});

// ROUTES - Proxy to external API
const userRoutes = require("./routes/userRoutes");
app.use("/api/admin/users", userRoutes);

// Moods proxy routes
const moodRoutes = require("./routes/moodRoutes");
app.use("/api/moods", moodRoutes);

// Styles proxy routes
const styleRoutes = require("./routes/styleRoutes");
app.use("/api/styles", styleRoutes);

// Auth proxy route
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Trips proxy route
const tripRoutes = require("./routes/tripRoutes");
app.use("/api/admin/trips", tripRoutes);

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`REST API proxy running on http://0.0.0.0:${PORT}`);
  console.log(`Proxying to: ${process.env.API_BASE_URL || 'Not configured'}`);
});
