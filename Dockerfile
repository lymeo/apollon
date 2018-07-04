FROM node:alpine

EXPOSE 3000
WORKDIR /apollon
CMD [ "npm", "start" ]

RUN apk update \
    && apk add python make g++


COPY ./package.json /apollon/package.json
RUN npm install
COPY . /apollon
