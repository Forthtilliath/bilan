# --- Build : dependances en cache separe des sources
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build

# --- Runtime : nginx (utilisateur non root, port 8080) sert le SPA et relaie /api vers Spring Boot
FROM nginxinc/nginx-unprivileged:1.29-alpine
# Paquets systeme a jour (correctifs de securite publies apres l'image de base), puis retour en non-root.
USER root
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
USER nginx
EXPOSE 8080
