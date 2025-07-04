# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory for the app
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++

# Copy shared-types and install/build
COPY ../shared-types ./shared-types
WORKDIR /app/shared-types
RUN npm ci && npm run build

# Copy backend package files and install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy backend source code
COPY . .

# Build the backend application
RUN npm run build

# Remove dev dependencies for production
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["npm", "start"] 