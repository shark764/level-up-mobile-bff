FROM node:14.16.1-alpine3.13

WORKDIR /usr/src/mobile-bff
COPY package*.json /usr/src/mobile-bff/

RUN ["npm", "install"]
RUN ["npm", "i", "core-util-is"]

COPY . /usr/src/mobile-bff
RUN ls node_modules
CMD [ "npm", "start" ]