FROM node:18.1
WORKDIR /app
COPY . .
RUN yarn
EXPOSE 8080
CMD [ "node", "index.js" ]
