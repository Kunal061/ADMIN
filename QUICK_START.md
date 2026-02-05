# 🚀 Quick Start Guide

Get your app running with the external API in 2 minutes!

---

## Prerequisites

- Node.js installed
- npm installed
- API credentials (URL and token)

---

## Step 1: Verify Environment File

One file should already exist with your credentials:

### `.env.local` (project root)
```env
VITE_API_BASE_URL=https://devapi-roamania.codibex.com/api/v1
VITE_API_TOKEN=eyJraWQiOiJ5MlF5V0ZjVFc2TGFoZUNjajVma3UrSFYyRG5EejJVNnlXakplYlQ5aUhJPSIsImFsZyI6IlJTMjU2In0...
```

> ⚠️ If this file doesn't exist, create it and add your credentials.

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs all frontend dependencies.

---

## Step 3: Start Frontend

```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

✅ Your app is running!

---

## Step 4: Test the App

1. Open browser to `http://localhost:5173`
2. Navigate to **Users** page
3. Try these operations:
   - ✅ View users list
   - ✅ Add new user
   - ✅ Edit user
   - ✅ Delete user
   - ✅ Refresh data

All operations call the external API directly! 🎉

---

## Troubleshooting

### ❌ "API configuration missing!"

**Problem:** Frontend can't find environment variables

**Solution:**
1. Ensure `.env.local` exists in project root
2. Check it contains `VITE_API_BASE_URL` and `VITE_API_TOKEN`
3. Restart dev server: `Ctrl+C` then `npm run dev` again

---

### ❌ "Failed to fetch users from API"

**Problem:** Frontend can't connect to external API

**Solutions:**
1. Does `.env.local` exist in project root?
2. Are the variables correctly named with `VITE_` prefix?
3. Restart frontend dev server
4. Check browser console for errors

---

### ❌ 401 Unauthorized

**Problem:** Token expired or invalid

**Solution:**
1. Get a fresh token from your API provider
2. Update `.env.local` with new token
3. Restart dev server

---

## One-Line Command

If you need to restart:

```bash
npm run dev
```

---

## What's Running?

```
Frontend Dev Server
  ↓
  Serving: http://localhost:5173
  Calling: External Roamana API directly
```

---

## Optional: Backend Proxy

If you encounter CORS issues, you can use the optional backend proxy:

```bash
# Terminal 1 (Backend Proxy)
cd backend
npm install
node index.js

# Terminal 2 (Frontend)
npm run dev
```

Then update `.env.local` to use `http://localhost:3000` instead of the external URL.

---

## Need Help?

See detailed documentation:
- `INTEGRATION_SUMMARY.md` - Integration overview
- `ENV_SETUP.md` - Environment variables guide
- `API_CRUD_DOCUMENTATION.md` - API documentation

---

## Key Points

- ✅ Frontend calls external API directly
- ✅ No MongoDB required
- ✅ No backend proxy required (optional in `backend/` folder)
- ✅ Only need `.env.local` for frontend
- ✅ Simple one-command start: `npm run dev`

---

**That's it! You're ready to go! 🚀**
