FROM node:22.17.0-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY controller.js ./

CMD ["node", "controller.js"]
