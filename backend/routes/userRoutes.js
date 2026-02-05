const express = require("express");
const router = express.Router();

// External API configuration
const API_BASE_URL = process.env.API_BASE_URL;
const API_REFRESH_TOKEN = process.env.API_REFRESH_TOKEN;
const API_TOKEN = process.env.API_TOKEN;

let cachedAccessToken = null;
let cachedAccessTokenExp = 0;
const FALLBACK_TOKEN_TTL_MS = 3 * 60 * 60 * 1000;

if (!API_BASE_URL || (!API_REFRESH_TOKEN && !API_TOKEN)) {
  console.error("⚠️  WARNING: API_BASE_URL or API_REFRESH_TOKEN/API_TOKEN not configured in .env");
}

// Helper to create authenticated headers
const decodeJwtExp = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

const refreshAccessToken = async () => {
  if (!API_REFRESH_TOKEN) return null;
  const fetch = (await import("node-fetch")).default;
  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: API_REFRESH_TOKEN }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to refresh token");
  }
  const token =
    data?.data?.token ||
    data?.token ||
    data?.data?.accessToken ||
    data?.accessToken ||
    null;
  if (token) {
    cachedAccessToken = token;
    const tokenExp = decodeJwtExp(token);
    cachedAccessTokenExp = tokenExp || Date.now() + FALLBACK_TOKEN_TTL_MS;
  }
  return token;
};

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  "Authorization": token,
});

// Helper to proxy requests to external API
const proxyRequest = async (req, endpoint, options = {}) => {
  const url = `${API_BASE_URL}/admin/users${endpoint}`;
  
  try {
    const authHeader = req.headers.authorization;
    const primaryToken = authHeader?.startsWith("Bearer ")
      ? authHeader
      : API_TOKEN
        ? `Bearer ${API_TOKEN}`
        : null;

    const makeRequest = async (token) => {
      const headers = {
        ...getAuthHeaders(token),
        ...(options.headers || {}),
      };
      const response = await fetch(url, {
        ...options,
        headers,
      });
      const data = await response.json().catch(() => ({}));
      return { response, data };
    };

    if (primaryToken) {
      const { response, data } = await makeRequest(primaryToken);
      if (response.status !== 401 || !API_REFRESH_TOKEN) {
        return { ok: response.ok, status: response.status, data };
      }
    }

    if (API_REFRESH_TOKEN) {
      const now = Date.now();
      if (!cachedAccessToken || cachedAccessTokenExp <= now + 60_000) {
        await refreshAccessToken();
      }
      if (cachedAccessToken) {
        const { response, data } = await makeRequest(`Bearer ${cachedAccessToken}`);
        return { ok: response.ok, status: response.status, data };
      }
    }

    return { ok: false, status: 401, data: { message: "Unauthorized" } };
  } catch (error) {
    console.error("Proxy error:", error);
    throw error;
  }
};

// GET all users
router.get("/", async (req, res) => {
  try {
    const result = await proxyRequest(req, "");
    
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
    const result = await proxyRequest(req, `/${req.params.id}`);
    
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
    const ensurePassword = (body) => {
      if (body?.password) return body;
      return {
        ...body,
        password: "Test@123",
      };
    };

    const result = await proxyRequest(req, "", {
      method: "POST",
      body: JSON.stringify(ensurePassword(req.body)),
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
    const result = await proxyRequest(req, `/${req.params.id}`, {
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
    const result = await proxyRequest(req, `/${req.params.id}`, {
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
