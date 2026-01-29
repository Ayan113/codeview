FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY turbo.json ./

RUN npm install

# Build the API
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build
RUN npm run build --workspace=@codeview/api

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 codeview

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

USER codeview

EXPOSE 5000

ENV PORT=5000

CMD ["node", "dist/index.js"]
