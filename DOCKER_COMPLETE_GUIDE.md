# Docker Setup Guide - Fixed ✅

## Changes Made

### 1. **Dockerfile Updates**
- Changed base image from `mongo:latest` to `node:18-alpine`
- MongoDB now runs as a separate service
- Optimized layer caching by copying package.json files first
- Uses lightweight Alpine Linux image

### 2. **New start-docker.sh Script**
- Specifically for Docker container execution
- Starts backend with absolute paths
- Runs frontend with `--host 0.0.0.0` to allow external connections
- Removed npm install (already done during build)

### 3. **Backend Configuration**
- Updated to use `MONGO_URI` environment variable
- Defaults to `mongodb://localhost:27017/testdb` for local dev
- Uses `mongodb://mongo:27017/testdb` in Docker (from docker-compose)
- Listens on `0.0.0.0:3000` to accept connections from any interface

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Compose Setup            │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────┐  ┌──────────────┐  │
│  │   MongoDB      │  │  Application │  │
│  │   Container    │◄─┤  Container   │  │
│  │                │  │              │  │
│  │  Port: 27017   │  │ Backend:3000 │  │
│  │                │  │ Frontend:5173│  │
│  └────────────────┘  └──────────────┘  │
│         ▲                    ▲          │
└─────────│────────────────────│──────────┘
          │                    │
          └────────┬───────────┘
                   │
           Host Machine Access
    MongoDB: localhost:27017
    Backend: localhost:3000
    Frontend: localhost:5173
```

## How to Use

### Step 1: Stop Current MongoDB Container
```bash
docker stop roamana-mongodb
docker rm roamana-mongodb
```

### Step 2: Build and Run with Docker Compose
```bash
docker-compose up --build
```

### Step 3: Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/users
- **Health Check**: http://localhost:3000/ping
- **MongoDB**: localhost:27017

## Troubleshooting

### Check Container Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongo
```

### Stop Services
```bash
docker-compose down
```

### Rebuild from Scratch
```bash
docker-compose down -v
docker-compose up --build
```

### Access MongoDB Shell
```bash
docker exec -it roamana-mongodb mongosh
```

## Port Mappings

| Service | Host Port | Container Port |
|---------|-----------|----------------|
| Frontend | 5173 | 5173 |
| Backend | 3000 | 3000 |
| MongoDB | 27017 | 27017 |

## Network Configuration

- **Network Name**: `roamana-network`
- **Type**: Bridge network
- Containers can communicate using service names
- Backend connects to MongoDB using `mongo:27017` (internal DNS)

## Data Persistence

- MongoDB data stored in Docker volume: `mongo_data`
- Persists even after container restarts
- Delete volume with: `docker-compose down -v`

## Environment Variables

The application uses these environment variables:

```yaml
MONGO_URI: mongodb://mongo:27017/testdb
NODE_ENV: development
```

## Local Development vs Docker

### Local Development
```bash
./start.sh
```
- Uses local MongoDB at `localhost:27017`
- Direct npm install and run

### Docker Development
```bash
docker-compose up --build
```
- Uses Docker MongoDB service
- All dependencies in container
- Better isolation and consistency

## Verification Steps

1. **Check MongoDB is running**:
   ```bash
   docker exec -it roamana-mongodb mongosh --eval "db.adminCommand('ping')"
   ```

2. **Check Backend is accessible**:
   ```bash
   curl http://localhost:3000/ping
   ```

3. **Check Frontend is accessible**:
   Open browser to http://localhost:5173

## Common Issues & Solutions

### Issue: Port already in use
**Solution**: Stop the conflicting service or change ports in docker-compose.yaml

### Issue: Cannot connect to MongoDB
**Solution**: Check if mongo service is healthy with `docker-compose ps`

### Issue: Frontend not accessible
**Solution**: Ensure Vite is running with `--host 0.0.0.0` flag in start-docker.sh

### Issue: Backend can't connect to MongoDB
**Solution**: Verify MONGO_URI environment variable is set correctly in docker-compose.yaml

---

**Now try running:**
```bash
docker-compose up --build
```

Your application should be accessible at http://localhost:5173 🚀
