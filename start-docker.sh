#!/bin/sh

echo "Starting Roamana Admin Application..."

# Start backend server in background
cd /app/backend
echo "Starting backend server..."
node index.js &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Go back to root directory
cd /app

# Start frontend dev server
echo "Starting frontend dev server..."
npm run dev -- --host 0.0.0.0
