# web/Dockerfile — Multi-stage Next.js standalone production build
# Requires next.config.ts to have output: 'standalone'
#
# Stage 1: builder — runs next build, emits .next/standalone
# Stage 2: production — lean image running the standalone server

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are baked into the bundle at build time — must be passed as build args
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# API_URL is used by server-side route handlers to proxy to the API.
# Inside Docker, the web container reaches the api service by its service name.
# Must also be set at build time because Next.js inlines process.env references.
ARG API_URL=http://api:3000
ENV API_URL=$API_URL

# Pusher browser creds (use-tenant-channel.ts) — NEXT_PUBLIC_* baked at build time.
# Empty key default = realtime stays a graceful no-op.
ARG NEXT_PUBLIC_PUSHER_KEY=
ENV NEXT_PUBLIC_PUSHER_KEY=$NEXT_PUBLIC_PUSHER_KEY
ARG NEXT_PUBLIC_PUSHER_CLUSTER=us2
ENV NEXT_PUBLIC_PUSHER_CLUSTER=$NEXT_PUBLIC_PUSHER_CLUSTER

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci

# Copy all source files needed for the Next.js build
COPY . .

# Ensure public/ exists — Next.js requires it but this project has none yet
RUN mkdir -p ./public

RUN npm run build

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone output includes its own node_modules — no npm install needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001

CMD ["node", "server.js"]
