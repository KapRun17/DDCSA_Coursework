# Развертывание в Cloud Ru

Cloud Ru free tier подходит для проекта, так как предоставляет виртуальную машину, на которой можно запустить PostgreSQL, серверную часть и клиентскую часть через Docker Compose.

## 1. Подготовка виртуальной машины

Рекомендуемая ОС: Ubuntu 22.04 или Ubuntu 24.04.

Открытые входящие порты:

- `22` - SSH;
- `80` - веб-приложение.

## 2. Установка Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

После установки необходимо перелогиниться по SSH, чтобы группа `docker` применилась к текущему пользователю.

## 3. Загрузка проекта

```bash
git clone https://github.com/KapRun17/DDCSA_Coursework.git
cd DDCSA_Coursework
```

## 4. Настройка переменных окружения

```bash
cp deploy/cloudru/env.example .env
nano .env
```

В файле `.env` необходимо заменить `POSTGRES_PASSWORD` и `JWT_SECRET` на собственные значения. Пароль в `POSTGRES_PASSWORD` и в строке `DATABASE_URL` должен совпадать.

## 5. Запуск приложения

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 6. Проверка запуска

```bash
docker ps
curl http://localhost/api/health
```

После запуска приложение будет доступно по адресу:

```text
http://IP_АДРЕС_СЕРВЕРА
```

Служебный маршрут API:

```text
http://IP_АДРЕС_СЕРВЕРА/api/health
```

## 7. Обновление приложения

```bash
git pull
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
