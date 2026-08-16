# Use a slim image with build essentials
FROM node:20-slim AS builder

# Install Python and build tools (required for argon2 and other native modules)
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy root package files (for workspaces)
COPY package.json package-lock.json ./
COPY packages packages/
COPY services/auth-service/package.json services/auth-service/package.json

# Install dependencies for the entire monorepo
RUN npm install --no-audit --progress=false

# Copy the rest of the source code
COPY . .

# Build shared packages and auth-service
RUN npm run build --workspace=@quickserve/shared-types
RUN npm run build --workspace=@quickserve/shared-utils
RUN npx prisma generate --schema=services/auth-service/prisma/schema.prisma
RUN npm run build --workspace=auth-service

# Final stage: lightweight runtime image
FROM node:20-slim

WORKDIR /usr/src/app

# Copy built artifacts from builder
COPY --from=builder /usr/src/app /usr/src/app

# Expose the service port
EXPOSE 3001

# Start the service
CMD ["node", "services/auth-service/dist/index.js"]