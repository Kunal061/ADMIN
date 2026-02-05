# Backend Proxy Setup (Optional)

## Overview

The backend proxy is **optional** and only needed for:
- CORS workarounds
- Request logging
- Additional middleware

## ⚠️ Important Note

**The frontend now calls the external API directly.** You do NOT need to run the backend proxy for normal operation.

## Backend Proxy Details (If Needed)

### Server Configuration:
- **Port**: 3000
- **Framework**: Express.js
- **CORS**: Enabled
- **Purpose**: Proxy requests to external Roamana API

### Endpoints:

```
GET http://localhost:3000/ping
Response: { "message": "Pong! Server is running" }

All /api/users requests are proxied to:
https://devapi-roamania.codibex.com/api/v1/admin/users
```

### To Start Backend Proxy:

```bash
cd backend
npm install
node index.js
```

Expected output:
```
REST API proxy running on http://0.0.0.0:3000
Proxying to: https://devapi-roamania.codibex.com/api/v1
```

### To Use Backend Proxy:

Update `.env.local` to use the proxy:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TOKEN=<your-token-here>
```

## Current Architecture

**Default (No Backend):**
```
Frontend → External API
```

**With Backend Proxy (Optional):**
```
Frontend → Backend Proxy → External API
```

## Next Steps:

The frontend is already configured to call the external API directly. No additional setup needed unless you want to use the backend proxy.
