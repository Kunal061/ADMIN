const express = require("express");
const router = express.Router();

// External API configuration
const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

if (!API_BASE_URL || !API_TOKEN) {
  console.error("⚠️  WARNING: API_BASE_URL or API_TOKEN not configured in .env");
}

// Helper to create authenticated headers
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_TOKEN}`,
});

// Helper to proxy requests to external API
const proxyRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/admin/users${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("Proxy error:", error);
    throw error;
  }
};

// GET all users
router.get("/", async (req, res) => {
  try {
    const result = await proxyRequest("");
    
    if (!result.ok) {
      return res.status(result.status).json({
        error: "Failed to fetch users from external API",
        details: result.data,
      });
    }
    
    res.json(result.data);
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({
      error: "Failed to fetch users",
      message: err.message,
    });
  }
});

// GET single user
router.get("/:id", async (req, res) => {
  try {
    const result = await proxyRequest(`/${req.params.id}`);
    
    if (!result.ok) {
      return res.status(result.status).json({
        error: "Failed to fetch user from external API",
        details: result.data,
      });
    }
    
    res.json(result.data);
  } catch (err) {
    console.error(`GET /api/users/${req.params.id} error:`, err);
    res.status(500).json({
      error: "Failed to fetch user",
      message: err.message,
    });
  }
});

// POST create user
router.post("/", async (req, res) => {
  try {
    const result = await proxyRequest("", {
      method: "POST",
      body: JSON.stringify(req.body),
    });
    
    if (!result.ok) {
      return res.status(result.status).json({
        error: "Failed to create user on external API",
        details: result.data,
      });
    }
    
    res.json(result.data);
  } catch (err) {
    console.error("POST /api/users error:", err);
    res.status(500).json({
      error: "Failed to create user",
      message: err.message,
    });
  }
});

// PUT update user
router.put("/:id", async (req, res) => {
  try {
    const result = await proxyRequest(`/${req.params.id}`, {
      method: "PUT",
      body: JSON.stringify(req.body),
    });
    
    if (!result.ok) {
      return res.status(result.status).json({
        error: "Failed to update user on external API",
        details: result.data,
      });
    }
    
    res.json(result.data);
  } catch (err) {
    console.error(`PUT /api/users/${req.params.id} error:`, err);
    res.status(500).json({
      error: "Failed to update user",
      message: err.message,
    });
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  try {
    const result = await proxyRequest(`/${req.params.id}`, {
      method: "DELETE",
    });
    
    if (!result.ok) {
      return res.status(result.status).json({
        error: "Failed to delete user on external API",
        details: result.data,
      });
    }
    
    res.json(result.data || { message: "User deleted" });
  } catch (err) {
    console.error(`DELETE /api/users/${req.params.id} error:`, err);
    res.status(500).json({
      error: "Failed to delete user",
      message: err.message,
    });
  }
});

module.exports = router;
