FROM node:14.16.1-alpine3.13 as build-stage

RUN mkdir -p /usr/src/mobile-bff     
WORKDIR /usr/src/mobile-bff
COPY package*.json /usr/src/mobile-bff/
RUN ["npm", "install"]

COPY . /usr/src/mobile-bff
#COPY . .

RUN ["npm", "run", "build"]


FROM node:14.16.1-alpine3.13 as run-stage

COPY --from=build-stage /usr/src/mobile-bff /usr/src/mobile-bff

WORKDIR /usr/src/mobile-bff

CMD [ "npm", "start" ]