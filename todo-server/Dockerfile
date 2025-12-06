FROM node:22.17.0-alpine

WORKDIR /app

COPY server.js /app
COPY package.json /app
COPY package-lock.json /app

RUN npm install

ENV PORT=4000

ENTRYPOINT [ "node" ]

CMD ["/app/server.js"]