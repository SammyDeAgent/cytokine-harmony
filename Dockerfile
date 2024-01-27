# syntax=docker/dockerfile:1

FROM node:17.9.1 as build
WORKDIR /src
COPY . /src
RUN npm i

FROM node:alpine as main
COPY --from=build /src /
CMD ["npm", "start"]