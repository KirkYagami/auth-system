# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
# Installs deps and runs `vite build` to produce a static dist/
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Copy manifests first — layer is re-used unless package.json changes
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy source and build
# VITE_API_URL is injected at build time via --build-arg
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build          # outputs to /build/dist


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime (nginx serves the static bundle + reverse-proxies /auth)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app
COPY --from=builder /build/dist /usr/share/nginx/html

# Custom nginx config — proxies /auth to the backend service
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
