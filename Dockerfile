# syntax=docker/dockerfile:1

FROM node:17.9.1
WORKDIR /src
COPY . /src
RUN npm i
CMD ["npm", "start"]