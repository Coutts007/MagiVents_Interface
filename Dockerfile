# Builds the app and serves it with nginx, which also proxies the API (see nginx.conf).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Baked into the bundle at build time
ARG VITE_API_BASE_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Each streaming AI assistant answer holds two connections (browser and API), so allow far more than the default
# 1024 per nginx worker process
RUN sed -i -E 's/worker_connections +[0-9]+;/worker_connections 16384;/' /etc/nginx/nginx.conf \
    && sed -i -E 's/^worker_processes +auto;/worker_processes auto;\nworker_rlimit_nofile 65535;/' /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
