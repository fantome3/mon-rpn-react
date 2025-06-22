# Étape 1 : build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : image minimale de production
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/build ./build


EXPOSE 5010

CMD ["node", "build/index.js"]