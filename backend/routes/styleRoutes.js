const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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
  const url = `${API_BASE_URL}/styles${endpoint}`;
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

// GET all styles
router.get("/get-all-styles", async (req, res) => {
  try {
    const result = await proxyRequest(req, "/get-all-styles");
    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err) {
    console.error("GET /api/styles/get-all-styles error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch styles",
    });
  }
});

// POST create style (multipart)
router.post(
  "/create-style",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const fetch = (await import("node-fetch")).default;
      const url = `${API_BASE_URL}/styles/create-style`;
      const formData = new FormData();

      if (req.body?.name) {
        formData.append("name", req.body.name);
      }

      const iconFile = req.files?.icon?.[0];
      if (iconFile) {
        formData.append("icon", iconFile.buffer, {
          filename: iconFile.originalname,
          contentType: iconFile.mimetype,
        });
      }

      const imageFile = req.files?.image?.[0];
      if (imageFile) {
        formData.append("image", imageFile.buffer, {
          filename: imageFile.originalname,
          contentType: imageFile.mimetype,
        });
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...formData.getHeaders(),
          Authorization: req.headers.authorization || `Bearer ${API_TOKEN}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (err) {
      console.error("POST /api/styles/create-style error:", err);
      res.status(500).json({
        status: "error",
        message: "Failed to create style",
      });
    }
  }
);

// PUT update style (multipart)
router.put(
  "/update-style/:id",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const fetch = (await import("node-fetch")).default;
      const url = `${API_BASE_URL}/styles/update-style/${req.params.id}`;
      const formData = new FormData();

      if (req.body?.name) {
        formData.append("name", req.body.name);
      }

      const iconFile = req.files?.icon?.[0];
      if (iconFile) {
        formData.append("icon", iconFile.buffer, {
          filename: iconFile.originalname,
          contentType: iconFile.mimetype,
        });
      }

      const imageFile = req.files?.image?.[0];
      if (imageFile) {
        formData.append("image", imageFile.buffer, {
          filename: imageFile.originalname,
          contentType: imageFile.mimetype,
        });
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          ...formData.getHeaders(),
          Authorization: req.headers.authorization || `Bearer ${API_TOKEN}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (err) {
      console.error("PUT /api/styles/update-style error:", err);
      res.status(500).json({
        status: "error",
        message: "Failed to update style",
      });
    }
  }
);

// DELETE style
router.delete("/delete-style/:id", async (req, res) => {
  try {
    const result = await proxyRequest(req, `/delete-style/${req.params.id}` , {
      method: "DELETE",
    });
    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }
    res.json(result.data);
  } catch (err) {
    console.error("DELETE /api/styles/delete-style error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to delete style",
    });
  }
});

module.exports = router;
