# Environment Variables Setup Guide

## Overview

This application uses environment variables to securely store API credentials. The token and base URL are configured in the frontend for direct API calls.

## Security

- **Never commit `.env` files to version control**
- `.env.local` and `backend/.env` are already listed in `.gitignore`
- Tokens are sent via `Authorization: Bearer` headers

---

## Frontend Configuration

### File: `.env.local` (project root)

Create this file in the project root directory:

```env
# Frontend Environment Variables
# Used by Vite - must start with VITE_ prefix

# External API Base URL
VITE_API_BASE_URL=https://devapi-roamania.codibex.com/api/v1

# API Authentication Token
VITE_API_TOKEN=<your-token-here>
```

### How Frontend Uses These Variables

```typescript
// In src/pages/UsersPage.tsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_TOKEN = import.meta.env.VITE_API_TOKEN;
const API_BASE = `${API_BASE_URL}/admin/users`;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
});
```

---

## Backend Configuration (Optional)

The backend proxy is optional and only needed for CORS workarounds or request logging.

### File: `backend/.env` (if using proxy)

Create this file in the `backend/` directory:

```env
# Backend Environment Variables (Optional)

# External API Base URL
API_BASE_URL=https://devapi-roamania.codibex.com/api/v1

# API Authentication Token
API_TOKEN=<your-token-here>

# Optional: Server port (defaults to 3000)
PORT=3000
```

> **Note**: The backend proxy is not required for normal operation. Frontend calls the external API directly.

---

## Setup Instructions

### 1. Create Environment File

```bash
# From project root

# Create frontend env file
touch .env.local
```

### 2. Add Your Credentials

Edit `.env.local` and add your API base URL and token:

**`.env.local`:**
```env
VITE_API_BASE_URL=https://devapi-roamania.codibex.com/api/v1
VITE_API_TOKEN=eyJraWQiOiJ5MlF5V0ZjVFc2TGFoZUNjajVma3UrSFYyRG5EejJVNnlXakplYlQ5aUhJPSIsImFsZyI6IlJTMjU2In0...
```

### 3. Install Dependencies

```bash
# Install frontend dependencies
npm install
```

### 4. Verify Configuration

**Test Frontend:**
```bash
npm run dev
```

Then open the app and check the browser console for any env variable errors.

### 5. (Optional) Setup Backend Proxy

If you need CORS workarounds:

```bash
cd backend
touch .env
# Add API_BASE_URL and API_TOKEN to backend/.env
npm install
node index.js
```

---

## Troubleshooting

### "API configuration missing! Please check .env.local file"

This warning appears when the frontend can't find environment variables.

**Solution:**
1. Ensure `.env.local` exists in project root
2. Variables start with `VITE_` prefix (`VITE_API_BASE_URL` and `VITE_API_TOKEN`)
3. Restart the dev server (`npm run dev`) after editing `.env.local`

### Frontend can't connect to API

**Check:**
1. `.env.local` exists in project root
2. Variables are correctly named (`VITE_API_BASE_URL` and `VITE_API_TOKEN`)
3. Restart the dev server after editing `.env.local`
4. Check browser console for variable values:
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL);
   ```

### Token expired or invalid

JWT tokens have an expiration time. If you get 401 errors:

1. Get a fresh token from the authentication service
2. Update `.env.local`
3. Restart frontend dev server

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                │
│  • Reads: VITE_API_BASE_URL, VITE_API_TOKEN            │
│  • Calls: External API directly with Bearer token      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  External API (Roamana)                                 │
│  • URL: https://devapi-roamania.codibex.com/api/v1      │
│  • Endpoint: /admin/users                               │
│  • Auth: Bearer Token                                   │
└─────────────────────────────────────────────────────────┘

Optional (for CORS workarounds):
┌─────────────────────────────────────────────────────────┐
│  Backend Proxy (Express :3000)                          │
│  • Available in backend/ folder                         │
│  • Can forward requests if CORS issues occur            │
└─────────────────────────────────────────────────────────┘
```

---

## Best Practices

1. **Never commit tokens**: Always use `.gitignore` for `.env*` files
2. **Rotate tokens regularly**: Update tokens periodically for security
3. **Use different tokens**: Use separate tokens for dev/staging/production
4. **Share securely**: Share tokens via secure channels (not email/Slack)
5. **Document expiry**: Note when tokens expire so you can refresh them

---

## For New Team Members

1. Clone the repository
2. Ask team lead for API credentials
3. Create `.env.local` (see template above)
4. Add the provided credentials
5. Run `npm install`
6. Start frontend: `npm run dev`

That's it! 🚀

> **Note**: Backend proxy is optional and not required for normal operation.
