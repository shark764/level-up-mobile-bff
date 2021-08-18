FROM node:14.16.1-alpine3.13

WORKDIR /usr/src/mobile-bff
COPY package*.json /usr/src/mobile-bff/

RUN ["npm", "install"]

COPY . /usr/src/mobile-bff

CMD [ "npm", "start" ]