# --- Build-Stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

ARG IMAGE_TAG
ARG COMMIT_SHA
ARG DIRTY
ARG BUILT_AT
ENV IMAGE_TAG=${IMAGE_TAG}
ENV COMMIT_SHA=${COMMIT_SHA}
ENV DIRTY=${DIRTY}
ENV BUILT_AT=${BUILT_AT}

RUN npm run build
RUN node -e "const fs=require('fs');const data={imageTag:process.env.IMAGE_TAG||null,commitSha:process.env.COMMIT_SHA||null,dirty:process.env.DIRTY?process.env.DIRTY==='true':null,builtAt:process.env.BUILT_AT||null};fs.writeFileSync('/app/dist/version.json',JSON.stringify(data));"

# --- Runtime-Stage ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
