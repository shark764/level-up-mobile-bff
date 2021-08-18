FROM node:14.16.1-alpine3.13

COPY . /usr/src/mobile-bff    
WORKDIR /usr/src/mobile-bff

COPY package*.json ./
RUN ["npm", "install"]


#COPY . .
RUN ["npm", "run", "build"]

CMD [ "npm", "start" ]