FROM node:24-bookworm-slim

# Native SQLite can require compilation when a prebuilt binary is unavailable.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/game/package.json packages/game/package.json
COPY packages/protocol/package.json packages/protocol/package.json
RUN npm ci
COPY . .
RUN npm run build
RUN mkdir -p /data /backups && chown node:node /data /backups
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001 TORAKKA_DB=/data/torakkapokeri.sqlite
USER node
EXPOSE 3001
CMD ["node", "--import", "tsx", "apps/server/src/index.ts"]
