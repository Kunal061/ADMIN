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
router.post(
  "/create-mood",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
  try {
    const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");

    if (isMultipart) {
      const fetch = (await import("node-fetch")).default;
      const url = `${API_BASE_URL}/moods/create-mood`;
      const formData = new FormData();

      const moodName = req.body?.moodName || req.body?.name;
      if (moodName) {
        formData.append("moodName", moodName);
      }

      if (req.body?.color) {
        formData.append("color", req.body.color);
      }

      if (req.body?.isActive !== undefined) {
        formData.append("isActive", String(req.body.isActive));
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
      return res.json(data);
    }

    const payload = { ...req.body };
    if (payload.name && !payload.moodName) {
      payload.moodName = payload.name;
    }
    delete payload.name;

    const result = await proxyRequest(req, "/create-mood", {
      method: "POST",
      body: JSON.stringify(payload),
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
  }
);

// PUT update mood
router.put(
  "/update-mood/:id",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
  try {
    const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");

    if (isMultipart) {
      const fetch = (await import("node-fetch")).default;
      const url = `${API_BASE_URL}/moods/update-mood/${req.params.id}`;
      const formData = new FormData();

      const moodName = req.body?.moodName || req.body?.name;
      if (moodName) {
        formData.append("moodName", moodName);
      }

      if (req.body?.color) {
        formData.append("color", req.body.color);
      }

      if (req.body?.isActive !== undefined) {
        formData.append("isActive", String(req.body.isActive));
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
      return res.json(data);
    }

    const payload = { ...req.body };
    if (payload.name && !payload.moodName) {
      payload.moodName = payload.name;
    }
    delete payload.name;

    const result = await proxyRequest(req, `/update-mood/${req.params.id}` , {
      method: "PUT",
      body: JSON.stringify(payload),
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
  }
);

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
