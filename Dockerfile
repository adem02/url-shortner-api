# Stage 1
FROM node:22.15.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Stage 2
FROM builder AS build
RUN npm run build

# Stage 3
FROM node:22.15.0-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nodeapp -G nodejs

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/build ./build

RUN chown -R nodeapp:nodejs /app

USER nodeapp

EXPOSE 3000
CMD ["node", "-r", "module-alias/register", "build/src/index.js"]
