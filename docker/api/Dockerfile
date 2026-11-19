# API image. Build context is the repository root:
#   docker build -f docker/api/Dockerfile .
#
# No configuration or secrets are baked into the image. Everything (DB, JWT,
# email and LLM keys, CORS…) is passed at runtime, e.g. with `env_file` in
# docker-compose. Files excluded from the build context are listed in
# docker/api/Dockerfile.dockerignore.

FROM node:22-alpine AS builder

WORKDIR /app

COPY api/package*.json ./
RUN npm ci

COPY api/ .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

USER node

EXPOSE 3000

# Apply pending migrations, then start the API.
CMD ["sh", "-c", "node node_modules/typeorm/cli.js migration:run -d dist/typeorm.config.js && node dist/main.js"]
