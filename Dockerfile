# ---------- Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Nur package-Dateien zuerst -> bessere Layer-Caches
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Prisma-Client generieren (benötigt schema)
COPY prisma ./prisma
RUN npx prisma generate

# Restlichen Code erst danach
COPY . .
RUN npm run build

# ---------- Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl

# Nur Prod-Dependencies installieren
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force && npm prune --omit=dev

# Nicht als root laufen (Security-Hardening)
# node-User existiert bereits in node:20-alpine

# Prisma-Client & Engines aus der Build-Stage (klein & sicher)
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Schema (optional, falls Du später generate im Runner nutzen willst)
COPY --from=builder /app/prisma ./prisma

# Remix-Build übernehmen
COPY --from=builder /app/build ./build

# Security/Runtime Hygiene: Read-only Filesystem mit tmp-Volume
RUN addgroup -S nodejs || true && adduser -S node -G nodejs || true \
 && mkdir -p /app/tmp && chown -R node:node /app
VOLUME /app/tmp
USER node

EXPOSE 3000
CMD ["npx", "remix-serve", "./build/server/index.js"]
