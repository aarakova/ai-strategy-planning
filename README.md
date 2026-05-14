# AI Strategy Planning

Система автоматизации стратегического планирования мультипроекта с использованием ИИ.

## Стек

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** FastAPI, Python 3.12, Motor (async MongoDB)
- **База данных:** MongoDB 7.0
- **Инфраструктура:** Docker, Docker Compose
- **ИИ:** GigaChat API

---

## Быстрый старт

### Требования

- [Docker](https://docs.docker.com/get-docker/) и Docker Compose

### 1. Настройка переменных окружения

```bash
cp backend/.env.example backend/.env
```

Откройте `backend/.env` и заполните:

```env
MONGO_URL=mongodb://admin:secret@mongo:27017/ai_strategy?authSource=admin
MONGO_DB=ai_strategy
JWT_SECRET=замените-на-случайную-строку
JWT_EXPIRE_MINUTES=1440
GIGACHAT_API_KEY=ваш-ключ-gigachat
CORS_ORIGINS=http://localhost:3000
```

---

## Режим разработки (Dev)

Код бэкенда монтируется из локальной папки — изменения в `backend/` применяются мгновенно без пересборки.

### Первый запуск

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Последующие запуски

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Что доступно

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| Swagger UI | http://localhost:8001/docs |
| MongoDB | localhost:27017 |

### Hot reload

Uvicorn автоматически перезапускается при изменении любого `.py` файла в `backend/`. Пересборка образа не нужна.

---

## Режим продакшена (Prod)

Код копируется внутрь Docker-образа при сборке.

### Запуск

```bash
docker compose up --build
```

### Остановка

```bash
docker compose down
```

### Остановка с удалением данных MongoDB

```bash
docker compose down -v
```

---

## Структура проекта

```
.
├── backend/                  # FastAPI приложение
│   ├── app/
│   │   ├── main.py           # Точка входа, регистрация роутеров
│   │   ├── config.py         # Настройки из .env
│   │   ├── database.py       # Подключение к MongoDB (Motor)
│   │   ├── dependencies.py   # Auth middleware (JWT cookie)
│   │   ├── models/           # Pydantic-схемы запросов и ответов
│   │   └── routers/          # Обработчики эндпоинтов
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React приложение
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   └── architecture/         # OpenAPI, ER-диаграммы, DDD
├── docker-compose.yml        # Prod конфигурация
└── docker-compose.dev.yml    # Dev override (hot reload)
```

---

## API

Полная документация — [docs/architecture/openapi.yaml](docs/architecture/openapi.yaml).

### Аутентификация

Токен хранится в HttpOnly-куке `access_token`. Все эндпоинты, кроме `/auth/register` и `/auth/login`, требуют авторизации.

### Основные эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register` | Регистрация |
| POST | `/auth/login` | Вход |
| POST | `/auth/logout` | Выход |
| GET | `/auth/me` | Текущий пользователь |
| GET | `/contexts` | Список мультипроектов |
| POST | `/contexts` | Создать мультипроект |
| DELETE | `/contexts/{id}` | Удалить мультипроект |
| GET | `/contexts/{id}/home` | Главная страница |
| POST | `/contexts/{id}/context` | Сохранить контекст (запускает анализ) |
| GET | `/contexts/{id}/analysis` | Результаты анализа |
| GET | `/contexts/{id}/goals` | Цели |
| POST | `/contexts/{id}/goals` | Сохранить цели |
| GET | `/contexts/{id}/goals/suggestions` | Цели от ИИ |
| GET | `/contexts/{id}/alternatives` | Альтернативные сценарии |
| POST | `/contexts/{id}/alternatives` | Выбрать сценарий (запускает план) |
| GET | `/contexts/{id}/plan` | Стратегический план |
