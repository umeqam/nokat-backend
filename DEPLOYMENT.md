# NOKAT Backend Deployment на Railway

## 📋 Файлы

```
main.py            — FastAPI приложение (основной код)
models.py          — SQLAlchemy модели (User, Post, Response)
schemas.py         — Pydantic валидация (входящие/исходящие данные)
database.py        — Подключение к PostgreSQL
requirements.txt   — Python зависимости
Procfile           — Railway конфиг для запуска
.env.example       — Пример переменных окружения
```

## 🚀 Шаги деплоя

### 1. Создать проект на Railway

1. Открыть https://railway.app
2. Логин/Sign Up (GitHub или Email)
3. New Project → GitHub repo (или загрузить файлы вручную)
   - Если у тебя нет GitHub: New Project → Deploy Empty Project

### 2. Создать PostgreSQL БД

1. В Railway dashboard: New → Database → PostgreSQL
2. Railway автоматически создаст:
   - `DATABASE_URL` переменная окружения
   - Подключение к БД

### 3. Загрузить файлы на Railway

**Вариант А: Через GitHub (проще)**
1. Создать GitHub репозиторий `nokat-backend`
2. Скинуть все файлы туда
3. Railway → Connect GitHub → выбрать репозиторий
4. Railway автоматически задеплоит на каждый push

**Вариант Б: Вручную через Railway CLI**
```bash
npm install -g railway
railway login
railway init  # Создать новый проект
# Скопировать все файлы в папку
railway up  # Залить на Railway
```

### 4. Переименовать файлы правильно

Railway ищет `main.py` как точку входа. Убедись что файлы именованы точно:

```
main.py       (НЕ nokat_main.py)
models.py     (НЕ nokat_models.py)
schemas.py    (НЕ nokat_schemas.py)
database.py   (НЕ nokat_database.py)
requirements.txt
Procfile
```

### 5. Настроить переменные окружения

В Railway dashboard:
1. Выбрать проект → Variables
2. Если PostgreSQL подключен, `DATABASE_URL` будет уже там
3. Добавить опционально:
   ```
   ENVIRONMENT=production
   DEBUG=False
   ```

### 6. Запустить приложение

Railway автоматически стартует:
- Читает `Procfile` → `uvicorn main:app`
- Слушает на PORT (выдаёт Railroad автоматически)
- Создаёт URL типа: `https://nokat-backend-xxxx.up.railway.app`

---

## 🔗 Подключить домен nokat.pro

После того как Railway даст тебе URL (типа `nokat-backend-xxxx.up.railway.app`):

### В Hostinger (где nokat.pro зарегистрирован):

1. Логин → Domains → nokat.pro
2. Manage → DNS / Nameservers
3. Добавить CNAME запись:
   ```
   Имя хоста: nokat (или пусто для корня)
   Тип: CNAME
   Значение: nokat-backend-xxxx.up.railway.app
   ```
4. Сохранить → подождать 5-15 мин (пока DNS распространится)

Теперь бэкенд доступен по: `https://nokat.pro/api/v1/posts`

---

## 📱 Обновить фронтенд

В `nokat_app.html` поменять базовый URL:

**Было:**
```javascript
const res = await fetch('http://127.0.0.1:5000/api/posts');
```

**Стало:**
```javascript
const API_BASE = 'https://nokat.pro/api/v1';
const res = await fetch(API_BASE + '/posts');
```

---

## ✅ Проверить что работает

```bash
# Здоровье приложения
curl https://nokat.pro/health
# Ответ: {"status":"ok","service":"nokat-api"}

# Получить посты
curl https://nokat.pro/api/v1/posts?mode=ищу
# Ответ: []  (пока пусто, потом будут посты)
```

---

## 🐛 Troubleshooting

**"502 Bad Gateway"** → Приложение не стартует
- Проверить Logs в Railway
- Убедиться что зависимости в requirements.txt правильные
- DATABASE_URL установлена

**"CORS error"** → Фронтенд не может обратиться к бэкенду
- CORS уже включен в main.py (`allow_origins=["*"]`)
- Но если не работает, добавить конкретный домен:
  ```python
  allow_origins=["https://nokat.pro", "http://localhost:3000"],
  ```

**"Connection refused"** → БД не подключена
- Railway → PostgreSQL → скопировать DATABASE_URL
- Добавить в Variables

---

## 📊 Структура БД

После первого запуска Railway автоматически создаст таблицы:
- `users` — профили пользователей
- `posts` — посты (запросы/предложения)
- `responses` — отклики на посты

---

## 🎯 API Endpoints

```
GET  /health                          — проверка здоровья
POST /api/v1/users                    — создать пользователя
GET  /api/v1/users/{id}               — получить профиль
GET  /api/v1/posts                    — список постов (фильтр: mode, region)
POST /api/v1/posts                    — создать пост
GET  /api/v1/posts/{id}               — получить пост
PUT  /api/v1/posts/{id}               — обновить статус
POST /api/v1/posts/{id}/respond       — отклик на пост
GET  /api/v1/posts/{id}/responses     — получить отклики
POST /api/v1/users/{id}/trust/add     — добавить trust баллы
GET  /api/v1/users/{id}/trust         — информация о trust
GET  /api/v1/stats                    — статистика платформы
```

---

## 🚂 После деплоя

1. ✅ Бэкенд на Railway → работает
2. ✅ Домен nokat.pro → указан на Railway
3. ✅ Фронтенд nokat_app.html → обновить API_BASE
4. 🎯 Тестировать создание постов/отклики

Готово! 🎉
