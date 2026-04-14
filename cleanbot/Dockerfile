FROM node:20-slim
WORKDIR /app
COPY some-folder/package*.json ./
RUN npm install
COPY cleanbot/ .
CMD ["node", "index.js"]
