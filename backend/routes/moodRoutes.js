const express = require("express");
const router = express.Router();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

if (!API_BASE_URL || !API_TOKEN) {
  console.warn("⚠️ API_BASE_URL or API_TOKEN not configured in backend/.env");
}

const getAuthHeaders = (req) => ({
  "Content-Type": "application/json",
  "Authorization": req.headers.authorization || `Bearer ${API_TOKEN}`,
});

const proxyRequest = async (req, endpoint, options = {}) => {
  const fetch = (await import("node-fetch")).default;
  const url = `${API_BASE_URL}/moods${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(req),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

// GET all moods
router.get("/get-all-moods", async (req, res) => {
  try {
    const result = await proxyRequest(req, "/get-all-moods");
    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err) {
    console.error("GET /api/moods/get-all-moods error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch moods",
    });
  }
});

// POST create mood
router.post("/create-mood", async (req, res) => {
  try {
    const result = await proxyRequest(req, "/create-mood", {
      method: "POST",
      body: JSON.stringify(req.body),
    });
    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err) {
    console.error("POST /api/moods/create-mood error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to create mood",
    });
  }
});

// PUT update mood
router.put("/update-mood/:id", async (req, res) => {
  try {
    const result = await proxyRequest(req, `/update-mood/${req.params.id}`, {
      method: "PUT",
      body: JSON.stringify(req.body),
    });
    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err) {
    console.error("PUT /api/moods/update-mood error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to update mood",
    });
  }
});

// DELETE mood
router.delete("/delete-mood/:id", async (req, res) => {
  try {
    const result = await proxyRequest(req, `/delete-mood/${req.params.id}`, {
      method: "DELETE",
    });
    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err) {
    console.error("DELETE /api/moods/delete-mood error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to delete mood",
    });
  }
});

module.exports = router;
