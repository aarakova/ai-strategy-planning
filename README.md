# AI Strategy Planning

Система автоматизации стратегического планирования мультипроекта с использованием ИИ.

## Стек

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** FastAPI, Python 3.12, Motor (async MongoDB)
- **База данных:** MongoDB 7.0
- **Инфраструктура:** Docker, Docker Compose
- **ИИ:** OpenRouter API (OpenAI-совместимый агрегатор: Claude, GPT-4o, Llama и др.)

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
OPENROUTER_API_KEY=sk-or-...      # https://openrouter.ai/keys
OPENROUTER_MODEL=openai/gpt-4o-mini
CORS_ORIGINS=http://localhost:3000
```

Получить ключ: [openrouter.ai/keys](https://openrouter.ai/keys).
Выбор модели: `openai/gpt-4o-mini` (дешево), `anthropic/claude-3.5-sonnet` (качественнее), `meta-llama/llama-3.3-70b-instruct` (бесплатная квота).

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

| Сервис | Механизм | Что отслеживается |
|--------|----------|-------------------|
| Backend | Uvicorn `--reload` + watchfiles | любой `.py` файл в `backend/` |
| Frontend | Vite HMR | любой файл в `frontend/src/` |

Пересборка образа не нужна — изменения применяются мгновенно.

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

## Тесты

Тесты находятся в `backend/tests/`. Запускаются локально (не требуют Docker).

### Подготовка (один раз)

```bash
cd backend
pip install -r requirements.txt
```

> **Windows:** если в выводе тестов кириллица отображается кракозябрами — запустите:
> ```powershell
> $env:PYTHONIOENCODING="utf-8"
> ```

### Юнит-тесты

Быстрые, без внешних зависимостей. БД и LLM замоканы.

```bash
cd backend
python -m pytest tests/ -v -m "not integration"
```

### Интеграционные тесты (реальный LLM)

Требуют рабочий `OPENROUTER_API_KEY` и `OPENROUTER_MODEL` в `backend/.env`.  
Делают реальные HTTP-запросы к OpenRouter — занимают 1–3 минуты.

```bash
cd backend
python -m pytest tests/test_integration_llm.py -v
```

После прогона в `backend/tests/llm_test_log.md` появится лог с тем, что LLM получила на вход и что вернула.

### Все тесты сразу

```bash
cd backend
python -m pytest tests/ -v
```

### Шпаргалка

| Команда | Что запускает |
|---------|--------------|
| `pytest tests/ -v -m "not integration"` | только юнит-тесты (быстро) |
| `pytest tests/test_integration_llm.py -v` | только интеграционные (LLM) |
| `pytest tests/ -v` | всё |
| `pytest tests/ -v -k "analysis"` | только тесты со словом «analysis» в имени |

---

## Структура проекта

```
.
├── backend/                  # FastAPI приложение
│   ├── app/
│   │   ├── main.py           # Точка входа, регистрация роутеров
│   │   ├── config.py         # Настройки из .env
│   │   ├── database.py       # Подключение к MongoDB (Motor)
│   │   │   ├── dependencies.py   # Auth middleware (JWT cookie)
│   │   ├── llm.py            # Клиент OpenRouter (openai SDK)
│   │   ├── models/           # Pydantic-схемы запросов и ответов
│   │   └── routers/          # Обработчики эндпоинтов
│   ├── tests/
│   │   ├── conftest.py           # Общие фикстуры (mock_db, fake_context, http_client)
│   │   ├── test_analysis_endpoint.py  # GET /analysis
│   │   ├── test_context_submit.py     # POST /context
│   │   ├── test_run_analysis.py       # фоновая задача _run_analysis
│   │   ├── test_integration_llm.py    # реальные вызовы LLM (помечены integration)
│   │   └── llm_test_log.md       # лог входа/выхода LLM (создаётся при запуске)
│   ├── Dockerfile
│   ├── pytest.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React приложение
│   ├── src/
│   ├── Dockerfile            # Prod: nginx со статической сборкой
│   ├── Dockerfile.dev        # Dev: Vite dev server с HMR
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
