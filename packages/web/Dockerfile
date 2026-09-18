FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/web/package.json packages/web/
COPY packages/shared-types/package.json packages/shared-types/

RUN npm install --no-audit --progress=false

COPY . .

WORKDIR /app/packages/web
RUN npm run build
