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

// Proxy send OTP requests
router.post("/send-otp", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;
    
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Send OTP proxy error:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Proxy error during OTP send" 
    });
  }
});

// Proxy reset password requests
router.post("/reset-password", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;
    
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Reset password proxy error:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Proxy error during password reset" 
    });
  }
});

// Proxy create admin requests
router.post("/create-admin", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;

    const authHeader = req.headers.authorization || `Bearer ${API_TOKEN}`;

    const response = await fetch(`${API_BASE_URL}/auth/create-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Create admin proxy error:", error);
    res.status(500).json({
      status: "error",
      message: "Proxy error during admin creation",
    });
  }
});

module.exports = router;
