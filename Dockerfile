# SmelterOS Production Dockerfile
# Optimized for Cloud Run with <50ms cold start

# =============================================================================
# BUILD STAGE
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY agent-os/ ./agent-os/

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# =============================================================================
# PRODUCTION STAGE
# =============================================================================
FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S smelter && \
    adduser -S smelter -u 1001 -G smelter

WORKDIR /app

# Copy only production artifacts
COPY --from=builder --chown=smelter:smelter /app/node_modules ./node_modules
COPY --from=builder --chown=smelter:smelter /app/dist ./dist
COPY --from=builder --chown=smelter:smelter /app/package.json ./

# Copy runtime configs
COPY --chown=smelter:smelter agent-os/ ./agent-os/

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Switch to non-root user
USER smelter

# Expose Cloud Run port
EXPOSE 8080

# Start application
CMD ["node", "dist/server.js"]
