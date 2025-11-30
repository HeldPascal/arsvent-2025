# --- Build-Stage ---
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# --- Runtime-Stage ---
FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

RUN mkdir -p /app/data

EXPOSE 4000
CMD ["node", "dist/index.js"]
