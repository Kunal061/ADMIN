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

const getAuthHeader = (req) => req.headers.authorization || `Bearer ${API_TOKEN}`;

const parseJsonField = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
};

router.post(
  "/",
  upload.single("wallpaper"),
  async (req, res) => {
    try {
      if (!API_BASE_URL) {
        return res.status(500).json({
          status: "error",
          message: "API base URL not configured",
        });
      }

      const payload = req.body?.payload ? parseJsonField(req.body.payload) : req.body || {};
      const normalized = { ...payload };
      ["members", "mood", "itinerary", "locations", "overview"].forEach((key) => {
        if (normalized[key] !== undefined) {
          normalized[key] = parseJsonField(normalized[key]);
        }
      });

      const fetch = (await import("node-fetch")).default;
      const url = `${API_BASE_URL}/admin/trips`;

      if (req.file) {
        const formData = new FormData();
        formData.append("wallpaper", req.file.buffer, {
          filename: req.file.originalname || "wallpaper",
          contentType: req.file.mimetype,
        });

        Object.entries(normalized).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value), {
              contentType: "application/json",
            });
          } else {
            formData.append(key, String(value));
          }
        });

        const response = await fetch(url, {
          method: "POST",
          headers: {
            ...formData.getHeaders(),
            Authorization: getAuthHeader(req),
          },
          body: formData,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return res.status(response.status).json(data);
        }
        return res.json(data);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(req),
        },
        body: JSON.stringify(normalized),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      return res.json(data);
    } catch (err) {
      console.error("POST /api/admin/trips error:", err);
      res.status(500).json({
        status: "error",
        message: "Failed to create trip",
      });
    }
  }
);

module.exports = router;
