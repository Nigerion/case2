# --- Stage 1: build ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .sequelizerc ./
RUN npm ci

COPY src ./src
COPY scripts ./scripts

# --- Stage 2: runtime ---
FROM node:20-alpine AS runtime

RUN apk add --no-cache tini curl

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json .sequelizerc ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]