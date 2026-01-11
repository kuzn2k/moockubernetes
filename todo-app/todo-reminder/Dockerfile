FROM node:22.17.0-slim

WORKDIR /app

COPY create-random-todo.js /app
COPY package.json /app
COPY package-lock.json /app

RUN npm install --production --no-audit --no-fund

ENTRYPOINT [ "node" ]

CMD ["/app/create-random-todo.js"]