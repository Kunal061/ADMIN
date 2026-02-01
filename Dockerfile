# Use Node.js 20 as base image (required for Vite 7.x)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install frontend dependencies
RUN npm install

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Copy the entire project
WORKDIR /app
COPY . .

# Make the start scripts executable
RUN chmod +x /app/start.sh /app/start-docker.sh

# Expose ports
EXPOSE 3000 5173

# Run the Docker start script
CMD ["/bin/sh", "/app/start-docker.sh"]
