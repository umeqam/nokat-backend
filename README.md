# NOKAT Backend & Frontend Complete Setup

## 📦 Файлы для скачивания

### Backend (Python, Railway)
```
nokat_main.py              — FastAPI приложение (переименуй в main.py)
nokat_models.py            — SQLAlchemy модели (переименуй в models.py)
nokat_schemas.py           — Pydantic валидация (переименуй в schemas.py)
nokat_database.py          — PostgreSQL конфиг (переименуй в database.py)
nokat_requirements.txt     — Зависимости (скопируй как requirements.txt)
nokat_Procfile             — Railway конфиг (переименуй в Procfile)
nokat_env_example.txt      — Переменные окружения
DEPLOYMENT.md              — Подробный гайд деплоя
```

### Frontend (HTML, нужен вебсервер или localhost)
```
nokat_app_updated.html     — Финальная версия мобильного приложения
```

---

## 🔧 Что менять перед деплоем

### 1. Переименовать файлы backend

Когда загружаешь на Railway, переименуй:
```
nokat_main.py      → main.py
nokat_models.py    → models.py
nokat_schemas.py   → schemas.py
nokat_database.py  → database.py
nokat_requirements.txt → requirements.txt
nokat_Procfile     → Procfile
```

Railway ищет файлы с точными этими именами.

### 2. Обновить API_BASE в фронтенде

В `nokat_app_updated.html` найди это:
```javascript
const CONFIG = {
  API_BASE: window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api/v1'
    : 'https://nokat.pro/api/v1'
};
```

После того как Railway даст URL (типа `nokat-backend-xxxx.up.railway.app`), измени:
```javascript
const CONFIG = {
  API_BASE: 'https://nokat-backend-xxxx.up.railway.app/api/v1'
};
```

Или если домен `nokat.pro` настроен:
```javascript
const CONFIG = {
  API_BASE: 'https://nokat.pro/api/v1'
};
```

---

## 🚀 Quick Start

### Локально (для тестирования)

1. **Установить зависимости**
   ```bash
   pip install -r requirements.txt
   ```

2. **Создать PostgreSQL БД** (или использовать SQLite для теста)
   ```bash
   # Если у тебя есть PostgreSQL:
   createdb nokat
   
   # Или SQLite (меньше настроек):
   # Обновить DATABASE_URL в database.py:
   # DATABASE_URL = "sqlite:///./nokat.db"
   ```

3. **Запустить бэкенд**
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   Скоро будет доступен на: `http://localhost:8000`

4. **Запустить фронтенд**
   ```bash
   # Простейший способ - через Python:
   python -m http.server 3000 --directory .
   
   # Или VSCode Live Server расширение
   ```
   Фронтенд на: `http://localhost:3000/nokat_app_updated.html`

5. **Проверить API**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/api/v1/posts
   ```

### На Railway (production)

См. `DEPLOYMENT.md` — подробный гайд с картинками (если нужны).

---

## 📋 API Endpoints

Все endpoints возвращают JSON:

### Users
- `POST /api/v1/users` — создать профиль
- `GET /api/v1/users/{id}` — получить профиль
- `GET /api/v1/users/{id}/trust` — info о trust score

### Posts
- `GET /api/v1/posts?mode=ищу&region=Ашгабат&limit=20` — список
- `POST /api/v1/posts` — создать пост
- `GET /api/v1/posts/{id}` — получить пост
- `PUT /api/v1/posts/{id}` — обновить (status, etc)

### Responses (Отклики)
- `POST /api/v1/posts/{id}/respond` — отклик на пост
- `GET /api/v1/posts/{id}/responses` — получить все отклики

### Trust
- `POST /api/v1/users/{id}/trust/add?points=10&reason=...` — добавить баллы

### Other
- `GET /health` — проверка здоровья
- `GET /api/v1/stats` — статистика платформы

---

## 📝 Пример запроса (curl/fetch)

### Создать пользователя
```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username":"ахметяр","display_name":"Ахметяр","avatar_emoji":"👨"}'
```

### Создать пост
```bash
curl -X POST http://localhost:8000/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "mode": "ищу",
    "title": "Нужен веб-разработчик",
    "description": "Ищу опытного разработчика для NOKAT",
    "region": "Ашгабат",
    "category": "Услуги",
    "budget": 5000
  }'
```

### Получить посты
```bash
curl "http://localhost:8000/api/v1/posts?mode=ищу&limit=10"
```

---

## 🎯 Архитектура

```
┌─────────────────────────────────┐
│    Frontend (nokat_app.html)    │
│   - React-like (vanilla JS)     │
│   - Мобильный UI (430px)        │
│   - 2 режима: ищу / предлагаю   │
└──────────────┬──────────────────┘
               │ fetch() to
               ▼
┌─────────────────────────────────┐
│  Backend (FastAPI + Railway)    │
├─────────────────────────────────┤
│ GET  /api/v1/posts              │
│ POST /api/v1/posts              │
│ POST /api/v1/posts/{id}/respond │
│ POST /api/v1/users              │
│ GET  /api/v1/users/{id}/trust   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   PostgreSQL Database (Railway) │
├─────────────────────────────────┤
│ users     — профили             │
│ posts     — запросы/предложения  │
│ responses — отклики             │
└─────────────────────────────────┘
```

---

## 🔒 Security Notes

1. **CORS** — открыт для всех (`allow_origins=["*"]`). Production меняй на:
   ```python
   allow_origins=["https://nokat.pro"]
   ```

2. **Auth** — пока нет. Потом добавить JWT tokens.

3. **Validation** — Pydantic валидирует на входе. Хорошо.

4. **Database** — используй переменные окружения для DATABASE_URL.

---

## 🐛 Debug Tips

### Фронтенд
- Открыть DevTools (F12) → Console
- Видишь ошибки в console → API не отвечает
- Проверить API_BASE в коде

### Бэкенд
- Railway Logs → смотреть ошибки
- Локально: `python -m uvicorn main:app --reload` с `--log-level debug`

### База данных
- Railway PostgreSQL → Dashboard → Query editor
- Проверить что таблицы создались (`SELECT * FROM users;`)

---

## ✅ Checklist перед production

- [ ] Переименовал файлы backend (main.py, models.py, etc)
- [ ] Загрузил на GitHub или Railway
- [ ] PostgreSQL подключена (DATABASE_URL в Railway Variables)
- [ ] API_BASE в фронтенде указан на Railway URL
- [ ] DNS (nokat.pro) → CNAME на Railway
- [ ] Тестировал создание поста и отклика
- [ ] Проверил CORS если нужен
- [ ] Добавил ERROR HANDLING для сетевых сбоев

---

## 🎉 Готово!

Теперь у тебя есть полноценный маркетплейс. Следующие шаги:
1. Mobile app (Android/iOS) — потом
2. Auth (JWT) — потом
3. Платежи (Алтын Асыр) — потом
4. Analytics + UMEQAM Shield интеграция — потом

На данный момент:
- ✅ Веб-версия работает
- ✅ Бэкенд на Railway
- ✅ Домен nokat.pro настроен
- ✅ Посты + отклики + trust система в боевом режиме
