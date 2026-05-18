FROM node:24-alpine

WORKDIR /app

# Установка зависимостей серверной части.
COPY package*.json ./
RUN npm ci

# Копирование исходного кода и генерация Prisma Client.
COPY . .
RUN npx prisma generate

EXPOSE 5000

# Render запускает только Dockerfile, поэтому схема БД применяется здесь.
CMD ["sh", "-c", "npx prisma db push && npm run prisma:seed && npm start"]
