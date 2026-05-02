# NOKAT API — Примеры запросов

Используй эти команды для тестирования бэкенда после деплоя.

## 🌐 Base URL

```
Local: http://localhost:8000
Production: https://nokat.pro
```

---

## 👤 Users API

### Создать пользователя
```bash
curl -X POST https://nokat.pro/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ahmetiar",
    "display_name": "Ахметяр",
    "avatar_emoji": "👨",
    "region": "Ашгабат"
  }'
```

**Ответ:**
```json
{
  "id": 1,
  "username": "ahmetiar",
  "display_name": "Ахметяр",
  "avatar_emoji": "👨",
  "region": "Ашгабат",
  "trust_score": 0,
  "trust_level": "НОВИЧОК",
  "created_at": "2024-05-02T16:00:00"
}
```

### Получить профиль пользователя
```bash
curl https://nokat.pro/api/v1/users/1
```

### Получить информацию о trust score
```bash
curl https://nokat.pro/api/v1/users/1/trust
```

---

## 📝 Posts API

### Создать пост (ищу)
```bash
curl -X POST https://nokat.pro/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "mode": "ищу",
    "title": "Нужен веб-разработчик для проекта",
    "description": "Ищу опытного разработчика на FastAPI. Проект: маркетплейс для Туркменистана. Бюджет: 3000-5000 $. Сроки: 2 недели.",
    "region": "Ашгабат",
    "category": "Услуги",
    "budget": 4000
  }'
```

### Создать пост (предлагаю)
```bash
curl -X POST https://nokat.pro/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "mode": "предлагаю",
    "title": "Переводы на туркменский язык",
    "description": "Профессиональные переводы на туркменский язык. Опыт: 5 лет. Специализация: техническая документация, маркетинг, локализация",
    "region": "Онлайн",
    "category": "Услуги",
    "budget": 50
  }'
```

### Получить все посты
```bash
curl "https://nokat.pro/api/v1/posts"
```

### Получить посты по режиму (ищу)
```bash
curl "https://nokat.pro/api/v1/posts?mode=ищу&limit=10"
```

### Получить посты по регионе
```bash
curl "https://nokat.pro/api/v1/posts?mode=ищу&region=Ашгабат&limit=10"
```

### Получить конкретный пост
```bash
curl https://nokat.pro/api/v1/posts/1
```

### Обновить статус поста
```bash
curl -X PUT https://nokat.pro/api/v1/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "завершен"}'
```

---

## 💬 Responses API (Отклики)

### Отклик на пост
```bash
curl -X POST https://nokat.pro/api/v1/posts/1/respond \
  -H "Content-Type: application/json" \
  -d '{
    "responder_id": 2,
    "message": "Интересует меня, готов стартовать в понедельник. Вот мой портфолио: github.com/..."
  }'
```

### Получить все отклики на пост
```bash
curl https://nokat.pro/api/v1/posts/1/responses
```

---

## ⭐ Trust Score API

### Добавить баллы доверия
```bash
curl -X POST "https://nokat.pro/api/v1/users/1/trust/add?points=10&reason=Успешно завершил проект"
```

---

## 📊 Stats API

### Получить статистику платформы
```bash
curl https://nokat.pro/api/v1/stats
```

**Ответ:**
```json
{
  "total_users": 42,
  "total_posts": 156,
  "active_posts": 89,
  "timestamp": "2024-05-02T16:00:00.123456"
}
```

---

## ✅ Health Check

### Проверить что API работает
```bash
curl https://nokat.pro/health
```

**Ответ:**
```json
{
  "status": "ok",
  "service": "nokat-api"
}
```

---

## 🧪 JavaScript (для фронтенда)

### Fetch запрос
```javascript
const API = 'https://nokat.pro/api/v1';

// Получить посты
fetch(`${API}/posts?mode=ищу&limit=20`)
  .then(r => r.json())
  .then(posts => console.log(posts));

// Создать пост
fetch(`${API}/posts`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    user_id: 1,
    mode: 'ищу',
    title: 'Test',
    description: 'Test description',
    region: 'Ашгабат'
  })
})
.then(r => r.json())
.then(newPost => console.log(newPost));

// Отклик
fetch(`${API}/posts/1/respond`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    responder_id: 2,
    message: 'Interested!'
  })
})
.then(r => r.json())
.then(response => console.log(response));
```

---

## 🔒 Error Responses

### 400 Bad Request
```json
{
  "detail": "Пользователь уже существует"
}
```

### 404 Not Found
```json
{
  "detail": "Пост не найден"
}
```

### 500 Server Error
```json
{
  "detail": "Internal Server Error"
}
```

---

## 📋 Trust Levels

```
НОВИЧОК      — 0-9 баллов       (👤)
НАДЁЖНЫЙ     — 10-49 баллов     (✓)
ПРОВЕРЕННЫЙ  — 50-99 баллов     (★)
МАСТЕР       — 100+ баллов      (★★★)
```

---

## 💡 Tips

1. **Используй Postman** для удобства (импортировать эти примеры)
2. **Проверяй Response headers** для ошибок
3. **Логируй console** при разработке фронтенда
4. **PostgreSQL query editor** в Railway для прямого доступа к БД

---

## Готово!

Теперь ты знаешь все endpoints NOKAT API 🚀
