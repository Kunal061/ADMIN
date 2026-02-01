# Frontend-Backend API Integration

## Overview
The Users section in the admin panel is now fully integrated with the backend API at `http://localhost:3000/api/users`.

## API Endpoint
```
Base URL: http://localhost:3000/api/users
```

## Supported Operations

### 1. GET - Fetch All Users
**Endpoint**: `GET http://localhost:3000/api/users`

**Purpose**: Fetch all users from MongoDB

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
**Endpoint**: `POST http://localhost:3000/api/users`

**Purpose**: Add a new user to the database

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
**Endpoint**: `PUT http://localhost:3000/api/users/{userId}`

**Purpose**: Update user information

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
**Endpoint**: `DELETE http://localhost:3000/api/users/{userId}`

**Purpose**: Delete a user from the database

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
POST /api/users (name, email, phone, dateOfBirth, gender)
    ↓
MongoDB (testdb.users)
    ↓
GET /api/users (refresh list)
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
PUT /api/users/{id}
    ↓
MongoDB (update record)
    ↓
GET /api/users (refresh)
    ↓
Close dialog & show success
```

### Deleting a User:
```
Click Delete 
    ↓
Confirm dialog
    ↓
DELETE /api/users/{id}
    ↓
MongoDB (remove record)
    ↓
GET /api/users (refresh)
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

1. **Verify Backend Running**:
   ```bash
   curl http://localhost:3000/ping
   # Should return: { "message": "Pong! Server is running" }
   ```

2. **Add a User**:
   - Open admin panel
   - Go to Users section
   - Click "Add User"
   - Fill in details
   - Click "Add User"
   - Check MongoDB for new record

3. **Edit a User**:
   - Click edit icon on any user
   - Modify any field
   - Click "Save"
   - Verify changes in MongoDB

4. **Delete a User**:
   - Click delete icon on any user
   - Confirm deletion
   - User removed from list and MongoDB

---

## Configuration

### Backend URL:
Located in `/src/pages/UsersPage.tsx` line ~70:
```typescript
const API_BASE = 'http://localhost:3000/api/users';
```

To change backend URL, update this constant.

---

## Status

✅ GET - Working  
✅ POST - Working  
✅ PUT - Working  
✅ DELETE - Working  
✅ Error Handling - Implemented  
✅ Fallback to localStorage - Enabled  

**The Users section is fully integrated with the backend API!** 🚀
