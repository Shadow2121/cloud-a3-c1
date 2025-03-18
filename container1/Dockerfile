FROM node:alpine

WORKDIR /app

COPY container1.js .
COPY package.json .

RUN npm install

CMD node container1.js