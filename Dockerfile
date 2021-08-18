FROM node:14.16.1-alpine3.13

#WORKDIR /usr/src/mobile-bff
COPY package*.json ./
#COPY . /usr/src/mobile-bff/
RUN ["npm", "install"]


COPY . .
#WORKDIR /usr/src/mobile-bff/dist

CMD [ "node", "dist/index.js" ]