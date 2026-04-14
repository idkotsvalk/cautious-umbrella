FROM node:20-slim
WORKDIR /app
COPY cleanbot/package*.json ./
RUN npm install
COPY cleanbot/ .
CMD ["node", "index.js"]
