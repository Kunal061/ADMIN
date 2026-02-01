#!/bin/bash

# Start backend server in background
cd backend
node index.js &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 2

# Go back to root directory
cd ..

# Install dependencies
npm install

# Start frontend dev server
npm run dev
