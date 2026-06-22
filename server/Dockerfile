FROM node:24-alpine

WORKDIR /app

# Установка зависимостей серверной части.
COPY package*.json ./
RUN npm ci

# Копирование исходного кода и генерация Prisma Client.
COPY . .
RUN npx prisma generate

EXPOSE 5000

# Контейнер приложения запускает только долговременный HTTP-процесс.
CMD ["npm", "start"]
