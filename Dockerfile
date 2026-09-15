# ── Stage 1 : build React client ──────────────────────────────────────────
FROM node:20-alpine AS client-builder

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2 : production server ───────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Server deps
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Server source
COPY server ./server

# Pre-built client
COPY --from=client-builder /build/client/dist ./client/dist

RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV TRUST_PROXY=1

CMD ["node", "server/server.js"]
