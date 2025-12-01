# --- Build-Stage ---
FROM node:20-bullseye-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# --- Runtime-Stage ---
FROM node:20-bullseye-slim
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/content ./content

RUN mkdir -p /app/data

EXPOSE 4000
CMD ["node", "dist/index.js"]
