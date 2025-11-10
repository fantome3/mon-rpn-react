# Étape 1 : build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5010

CMD ["node", "build/index.js"]