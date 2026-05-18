FROM node:24-alpine

WORKDIR /app

# Установка зависимостей серверной части.
COPY package*.json ./
RUN npm ci

# Копирование исходного кода и схемы Prisma.
COPY . .
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
