FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV NEXT_PUBLIC_API_URL=http://localhost:4000

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
