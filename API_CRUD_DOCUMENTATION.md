# Frontend-External API Integration

## Overview
The admin panel is now fully integrated with the external Roamana API. This includes:
- **User Management**: CRUD operations for users via `/admin/users`
- **Authentication**: API-based login using user allowlist from `/admin/users`

## API Architecture

### Frontend → External API (Direct)

```
Frontend (React)
    ↓ fetch with Bearer token
External API (https://devapi-roamania.codibex.com/api/v1/admin/users)
```

## API Endpoints

### External API (Direct)
```
Base URL: https://devapi-roamania.codibex.com/api/v1/admin/users
Authentication: Bearer Token (configured in .env.local)
```

> **Note**: A backend proxy folder exists for optional use (CORS workarounds, logging, etc.) but is not required for normal operation.

## Supported Operations

### 1. GET - Fetch All Users
**Endpoint**: `GET https://devapi-roamania.codibex.com/api/v1/admin/users`

**Purpose**: Fetch all users from external API

**Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-15",
    "gender": "male"
  }
]
```

**Trigger**: 
- Page load
- Click "Refresh" button
- Add, update, or delete user

---

### 2. POST - Create New User
**Endpoint**: `POST https://devapi-roamania.codibex.com/api/v1/admin/users`

**Purpose**: Add a new user via external API

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+9876543210",
  "dateOfBirth": "1995-05-20",
  "gender": "female"
}
```

**Response**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+9876543210",
  "dateOfBirth": "1995-05-20",
  "gender": "female"
}
```

**Trigger**: Click "Add User" button → Fill form → Click "Add User"

---

### 3. PUT - Update Existing User
**Endpoint**: `PUT https://devapi-roamania.codibex.com/api/v1/admin/users/{userId}`

**Purpose**: Update user information via external API

**Request Body**:
```json
{
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "phone": "+1111111111",
  "dateOfBirth": "1995-05-20",
  "gender": "female"
}
```

**Response**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "phone": "+1111111111",
  "dateOfBirth": "1995-05-20",
  "gender": "female"
}
```

**Trigger**: Click edit icon on user row → Modify fields → Click "Save"

---

### 4. DELETE - Remove User
**Endpoint**: `DELETE https://devapi-roamania.codibex.com/api/v1/admin/users/{userId}`

**Purpose**: Delete a user via external API

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

**Trigger**: Click delete icon on user row → Confirm deletion

---

## Error Handling

The frontend includes fallback mechanisms:

### If API Request Fails:
1. Shows error message: `⚠️ API Error: [error message]`
2. Displays "Retry" button
3. Falls back to localStorage data
4. Shows toast: `"Failed to sync with API. Updating/deleting locally."`

### Grace Degradation:
- Users can still add/edit/delete even if API is down
- Changes are saved locally using localStorage
- Data syncs when API comes back online

---

## Data Flow

### Adding a User:
```
Frontend Form 
    ↓
Validation 
    ↓
POST /admin/users (name, email, phone, dateOfBirth, gender)
    ↓
External API (saves user)
    ↓
GET /admin/users (refresh list)
    ↓
Display updated list
```

### Updating a User:
```
Click Edit 
    ↓
Open Dialog with user data
    ↓
Modify fields
    ↓
PUT /admin/users/{id}
    ↓
External API (updates user)
    ↓
GET /admin/users (refresh)
    ↓
Close dialog & show success
```

### Deleting a User:
```
Click Delete 
    ↓
Confirm dialog
    ↓
DELETE /admin/users/{id}
    ↓
External API (removes user)
    ↓
GET /admin/users (refresh)
    ↓
Show success toast
```

---

## Frontend Implementation Details

### File: `/src/pages/UsersPage.tsx`

#### Key Functions:

1. **fetchUsersFromAPI()**
   - Makes GET request to fetch users
   - Sets loading state
   - Handles errors with fallback

2. **handleAddUser()**
   - Validates input
   - Makes POST request with user data
   - Refreshes list on success

3. **handleSaveUser()**
   - Makes PUT request with updated data
   - Updates record in MongoDB
   - Refreshes list

4. **handleDeleteUser(id, name)**
   - Confirms deletion
   - Makes DELETE request
   - Refreshes list

### UI Features:
- Loading spinner during API calls
- Error banner with retry button
- Search functionality
- Pagination (15 users per page)
- Date format: DD-MM-YYYY
- Toast notifications for success/error

---

## Testing

### Test Flow:

1. **Verify Environment Variables**:
   - Check `.env.local` has `VITE_API_BASE_URL` and `VITE_API_TOKEN`
   - Token should be valid (not expired)

2. **Add a User**:
   - Open admin panel
   - Go to Users section
   - Click "Add User"
   - Fill in details
   - Click "Add User"
   - User appears in list

3. **Edit a User**:
   - Click edit icon on any user
   - Modify any field
   - Click "Save"
   - Changes reflected in list

4. **Delete a User**:
   - Click delete icon on any user
   - Confirm deletion
   - User removed from list

---

## Configuration

### Frontend Environment Variables (`.env.local`)
```env
VITE_API_BASE_URL=https://devapi-roamania.codibex.com/api/v1
VITE_API_TOKEN=<your-token-here>
```

> **Note**: Backend proxy has its own `backend/.env` for optional use, but is not required for normal operation.

### Security Notes
- `.env.local` is git-ignored
- Never commit tokens to version control
- Token is sent as `Authorization: Bearer <token>` header
- Frontend authenticates directly with the external API

---

## Installation

### 1. Configure Environment Variables
Create `.env.local` in project root with your API credentials (see Configuration section above).

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Start Frontend
```bash
npm run dev
```

Expected output:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 4. (Optional) Backend Proxy
If you need to use the backend proxy (for CORS or logging):

```bash
cd backend
npm install
node index.js
```

## Authentication System

### How Login Works

The application now uses **API-based authentication** instead of localStorage:

1. **On App Load**: Fetches all users from `/admin/users` endpoint
2. **Allowlist Caching**: Stores users in memory (React state) for the session
3. **Login Validation**: Validates credentials against the cached allowlist
4. **Session Management**: Uses existing localStorage for user preferences (trips, styles, moods)

### Login Flow

```
App Load → Fetch /admin/users → Cache in memory
    ↓
User Login → Validate against allowlist → Success/Failure
    ↓
Success → Load user preferences from localStorage → Navigate to dashboard
```

### User Requirements

- Users must exist in the `/admin/users` API to log in
- Users should have an `email` and `password` field in the API response
- No registration flow - admin must add users via Users page first

### Example API Response

```json
[
  {
    "_id": "123",
    "email": "admin20@yopmail.com",
    "password": "Admin0001",
    "name": "Admin User",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  }
]
```

### Security Notes

- Allowlist is cached in memory, not persisted to localStorage
- Refreshes on each app load for security
- Passwords are compared as plain text (ensure API handles hashing/encryption)
- Bearer token authentication for API calls

## Status

✅ GET - Direct to external API  
✅ POST - Direct to external API  
✅ PUT - Direct to external API  
✅ DELETE - Direct to external API  
✅ Bearer Token Authentication - Configured  
✅ Environment Variables - Configured  
✅ Error Handling - Implemented  
✅ Fallback to localStorage - Enabled (for user preferences only)  
✅ API-Based Login - Implemented  
✅ User Allowlist - Fetched from API  
✅ No MongoDB dependencies  
✅ No backend proxy required  

**The admin panel calls the external Roamana API directly!** 🚀
