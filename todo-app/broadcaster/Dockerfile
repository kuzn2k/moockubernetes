FROM node:22.17.0-alpine

WORKDIR /app

COPY broadcaster.js /app
COPY package.json /app
COPY package-lock.json /app

RUN npm install --production --no-audit --no-fund

ENTRYPOINT [ "node" ]

CMD ["/app/broadcaster.js"]
