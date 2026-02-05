require("dotenv").config({ path: __dirname + '/.env' });
const express = require("express");
const cors = require("cors");

// INIT APP
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

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

// Auth proxy route
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`REST API proxy running on http://0.0.0.0:${PORT}`);
  console.log(`Proxying to: ${process.env.API_BASE_URL || 'Not configured'}`);
});
