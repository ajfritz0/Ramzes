FROM --platform=linux/arm/v7 node:16.14-slim
WORKDIR /usr/src/alabastor
RUN apt update -y
RUN apt install python3 gcc c++ make ffmpeg -y
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]