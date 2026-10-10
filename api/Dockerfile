# api/Dockerfile — Multi-stage production build
# Build context: project root (not api/)
# Uses project root as build context so prisma/ and the root tsconfig.json
# are accessible alongside api/ — mirrors the actual directory structure.

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Prisma schema engine is a native binary that requires OpenSSL
RUN apk add --no-cache openssl

# Mirror the real directory structure:
#   /app/tsconfig.json        ← extends target for api/tsconfig.json
#   /app/prisma/              ← Prisma schema
#   /app/api/package.json     ← api dependencies
#   /app/api/src/             ← TypeScript source
WORKDIR /app

# Root tsconfig — api/tsconfig.json has "extends": "../tsconfig.json"
COPY tsconfig.json ./

# api package files and prisma schema (for @prisma/client postinstall)
COPY api/package*.json ./api/
COPY api/package-lock.json* ./api/
COPY prisma/ ./prisma/

# Install dependencies inside api/
WORKDIR /app/api
RUN npm ci

# Compile TypeScript (tsconfig.json extends /app/tsconfig.json correctly)
COPY api/tsconfig.json ./
COPY api/src/ ./src/
RUN npm run build

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Prisma client requires OpenSSL at runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Root tsconfig needed only if any postinstall script references it; kept for safety
COPY tsconfig.json ./

# Production dependencies
COPY api/package*.json ./api/
COPY api/package-lock.json* ./api/
COPY prisma/ ./prisma/

WORKDIR /app/api
RUN npm ci --omit=dev

# Compiled output from builder
COPY --from=builder /app/api/dist ./dist

# Vendored runtime assets (tesseract eng.traineddata for blueprint OCR — no CDN at runtime)
COPY api/assets/ ./assets/

EXPOSE 3000

# Working dir is /app/api — dist/index.js resolves correctly
CMD ["node", "dist/index.js"]
