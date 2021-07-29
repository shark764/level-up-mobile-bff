FROM node:14.16.1-alpine3.13

COPY . /usr/src/mobile-bff/
WORKDIR /usr/src/mobile-bff
RUN ["npm", "install"]


COPY . /usr/src/mobile-bff

#RUN yarn build 

WORKDIR /usr/src/mobile-bff/dist


CMD [ "node", "index.js" ]