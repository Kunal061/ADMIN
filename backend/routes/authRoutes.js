const express = require("express");
const router = express.Router();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

if (!API_BASE_URL || !API_TOKEN) {
  console.warn("⚠️ API_BASE_URL or API_TOKEN not configured in backend/.env");
}

// Proxy login requests
router.post("/login", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Login proxy error:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Proxy error during login" 
    });
  }
});

module.exports = router;
