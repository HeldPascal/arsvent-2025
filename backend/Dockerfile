# --- Build-Stage ---
FROM node:20-bullseye-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG IMAGE_TAG
ARG COMMIT_SHA
ARG DIRTY
ARG BUILT_AT
ENV IMAGE_TAG=${IMAGE_TAG}
ENV COMMIT_SHA=${COMMIT_SHA}
ENV DIRTY=${DIRTY}
ENV BUILT_AT=${BUILT_AT}

RUN npx prisma generate
RUN npm run build
RUN node -e "const fs=require('fs');const data={imageTag:process.env.IMAGE_TAG||null,commitSha:process.env.COMMIT_SHA||null,dirty:process.env.DIRTY?process.env.DIRTY==='true':null,builtAt:process.env.BUILT_AT||null};fs.writeFileSync('/app/version.json',JSON.stringify(data));"

# --- Runtime-Stage ---
FROM node:20-bullseye-slim
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/content ./content
COPY --from=build /app/version.json ./version.json

RUN mkdir -p /app/data

EXPOSE 4000
CMD ["node", "dist/index.js"]
