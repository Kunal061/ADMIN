# 🔑 Token Expired - How to Fix

## Problem

Your API token has expired, which is why you're seeing "Invalid credentials" when trying to log in.

**Error Details:**
- API returns: `401 Unauthorized - Invalid or expired token`
- This prevents the app from loading the user allowlist
- Without the allowlist, login cannot validate credentials

---

## Solution: Update the Token

### Step 1: Get a Fresh Token

Contact your API provider or authentication service to get a new JWT token.

### Step 2: Update `.env.local`

1. Open `.env.local` in the project root
2. Replace the old token with the new one:

```env
# Frontend Environment Variables
# Used by Vite - must start with VITE_ prefix

# External API Base URL
VITE_API_BASE_URL=https://devapi-roamania.codibex.com/api/v1

# API Authentication Token (UPDATE THIS)
VITE_API_TOKEN=your-new-token-here
```

### Step 3: Restart Dev Server

The dev server needs to be restarted to pick up the new environment variable:

1. Stop the dev server (Ctrl+C in the terminal)
2. Restart it:
   ```bash
   npm run dev
   ```

### Step 4: Test Login

1. Open http://localhost:5173
2. Try logging in with your credentials
3. Should now work!

---

## How to Check Token Status

### Test if token is valid:

```bash
curl -X GET "https://devapi-roamania.codibex.com/api/v1/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**If token is valid:** Returns list of users
**If token is expired:** Returns `401 Unauthorized`

---

## Checking Browser Console

After updating the token and restarting:

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for:
   - ✅ `Loaded X allowed users from API` (success)
   - ❌ `Token expired or invalid` (still needs update)

---

## Current Token Status

Your current token in `.env.local`:
```
eyJraWQiOiJ5MlF5V0ZjVFc2TGFoZUNjajVma3UrSFYyRG5EejJVNnlXakplYlQ5aUhJPSIsImFsZyI6IlJTMjU2In0...
```

**Status:** ❌ EXPIRED

**Issued At (iat):** December 5, 2024
**Expires At (exp):** December 5, 2024 (1 hour validity)

This token expired on **December 5, 2024** and needs to be replaced.

---

## Preventing This in Future

JWT tokens typically have expiration times. Options:

1. **Short-term:** Update token manually when it expires
2. **Long-term:** Implement token refresh mechanism
3. **Production:** Use refresh tokens with longer validity

---

## Quick Fix Commands

```bash
# 1. Edit .env.local (update the token)
nano .env.local

# 2. Restart dev server
npm run dev

# 3. Check if token works
curl -X GET "https://devapi-roamania.codibex.com/api/v1/admin/users" \
  -H "Authorization: Bearer NEW_TOKEN_HERE"
```

---

## Need Help?

If you're still having issues:

1. Verify the new token is copied completely (no spaces/line breaks)
2. Make sure you restarted the dev server
3. Check browser console for specific errors
4. Verify API endpoint is accessible
5. Contact your backend team for a new token

---

**Once you update the token and restart, login will work! ✅**
