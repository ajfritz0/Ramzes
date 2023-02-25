FROM --platform=linux/arm/v7 node:slim
WORKDIR /usr/src/alabastor
RUN apt update -y
RUN apt install python3 gcc g++ make ffmpeg -y
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]