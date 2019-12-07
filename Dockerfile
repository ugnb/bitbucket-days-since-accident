FROM node:10-alpine as builder

WORKDIR /project
COPY . .
RUN npm ci
RUN npm run build
RUN ls -la

FROM node:10-alpine
WORKDIR /server
RUN mkdir ./static
COPY --from=builder /project/dist ./static
COPY --from=builder /project/server.js ./

RUN npm i express

CMD ["node", "server.js"]
