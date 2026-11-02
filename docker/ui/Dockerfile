FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENV

COPY ui/package*.json ./
RUN npm ci

COPY ui/ .
RUN VITE_API_URL=${VITE_API_URL} VITE_SENTRY_DSN=${VITE_SENTRY_DSN} VITE_SENTRY_ENV=${VITE_SENTRY_ENV} npm run build

FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
