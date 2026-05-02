# 🚀 NOKAT: Пошаговый гайд деплоя

## 📥 Шаг 1: Скачать файлы

Скачай все эти файлы:

### Backend (Python) — для Railway
```
nokat_main.py              ← переименуй в main.py
nokat_models.py            ← переименуй в models.py
nokat_schemas.py           ← переименуй в schemas.py
nokat_database.py          ← переименуй в database.py
nokat_requirements.txt      ← переименуй в requirements.txt
nokat_Procfile             ← переименуй в Procfile
```

### Frontend (HTML) — для веб/тестирования
```
nokat_app_updated.html     ← основной файл приложения
```

### Документация
```
README.md                  — что это всё
DEPLOYMENT.md              — детальная инструкция
```

---

## 🎯 Шаг 2: Подготовить файлы

### Создать папку `nokat-backend`
```
nokat-backend/
├── main.py                (из nokat_main.py)
├── models.py              (из nokat_models.py)
├── schemas.py             (из nokat_schemas.py)
├── database.py            (из nokat_database.py)
├── requirements.txt        (из nokat_requirements.txt)
└── Procfile               (из nokat_Procfile)
```

**Важно:** файлы должны быть названы ТОЧНО так (без "nokat_" префикса).

---

## 🐙 Шаг 3: Загрузить на Railway

### Вариант А: Через GitHub (проще, рекомендуется)

1. **Создать GitHub репозиторий:**
   - https://github.com/new
   - Имя: `nokat-backend`
   - Description: "NOKAT Marketplace Backend"
   - Public
   - Создать

2. **Загрузить файлы в GitHub:**
   ```bash
   git clone https://github.com/твой-ник/nokat-backend.git
   cd nokat-backend
   
   # Скопировать файлы сюда (main.py, models.py, etc)
   
   git add .
   git commit -m "Initial commit"
   git push
   ```

3. **Подключить к Railway:**
   - Открыть https://railway.app
   - New Project
   - GitHub → выбрать репозиторий `nokat-backend`
   - Railway автоматически:
     - Прочитает requirements.txt
     - Установит зависимости
     - Запустит через Procfile (uvicorn)

### Вариант Б: Через Railway CLI (альтернатива)

```bash
npm install -g railway
railway login

# В папке с файлами:
railway init
railway up
```

---

## 🗄️ Шаг 4: Подключить PostgreSQL

1. **В Railway dashboard:**
   - New → Database → PostgreSQL
   - Выбрать план (Starter/Development достаточно)
   - Create

2. **Railway автоматически создаст:**
   - Новую БД `nokat`
   - Переменную окружения `DATABASE_URL`
   - Приложение автоматически подключится

3. **Проверить что работает:**
   ```bash
   curl https://твой-railway-домен/health
   # Ответ: {"status":"ok","service":"nokat-api"}
   ```

---

## 🌐 Шаг 5: Настроить домен nokat.pro

Railway выдаст тебе URL типа:
```
https://nokat-backend-xxxx.up.railway.app
```

Чтобы привязать `nokat.pro`:

1. **В Hostinger (где зарегистрирован nokat.pro):**
   - Управление → nokat.pro → DNS
   - Найти CNAME запись (или создать новую)
   - Добавить:
     ```
     Имя: nokat
     Тип: CNAME
     Значение: nokat-backend-xxxx.up.railway.app
     ```
   - Сохранить

2. **Подождать 5-15 минут** (DNS пропагейшн)

3. **Проверить:**
   ```bash
   curl https://nokat.pro/health
   # Должно работать
   ```

---

## 💻 Шаг 6: Обновить фронтенд

В файле `nokat_app_updated.html` найди строку:

```javascript
const CONFIG = {
  API_BASE: window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api/v1'
    : 'https://nokat.pro/api/v1'
};
```

Когда Railway готов, это автоматически используется!

**Или явно задать:**
```javascript
const CONFIG = {
  API_BASE: 'https://nokat-backend-xxxx.up.railway.app/api/v1'
};
```

---

## ✅ Шаг 7: Тестировать

### Создать пользователя
```bash
curl -X POST https://nokat.pro/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","display_name":"Тест","avatar_emoji":"👤"}'
```

### Создать пост
```bash
curl -X POST https://nokat.pro/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "mode": "ищу",
    "title": "Тестовый запрос",
    "description": "Это тестовое описание для проверки",
    "region": "Ашгабат",
    "category": "Тест"
  }'
```

### Открыть фронтенд
- Сохрани `nokat_app_updated.html` на компе
- Открой в браузере (File → Open или `python -m http.server`)
- Должны видеть посты из БД

---

## 🎯 Финальный чеклист

- [ ] Скачал все файлы (main.py, models.py, etc)
- [ ] Переименовал с удалением "nokat_" префикса
- [ ] Загрузил на GitHub или Railway
- [ ] PostgreSQL подключена
- [ ] Railway выдал URL
- [ ] Домен nokat.pro → CNAME на Railway
- [ ] Тестировал API (curl /health)
- [ ] Фронтенд видит посты
- [ ] Может создать пост и отклик

---

## 🚨 Если что-то не работает

### "502 Bad Gateway"
→ Railway приложение не стартует
- Проверить Railway Logs → ищи ошибку
- Убедиться что зависимости в requirements.txt
- DATABASE_URL установлена

### "CORS error"
→ Фронтенд не может достучаться до бэкенда
- CORS уже включен в main.py
- Проверить что API_BASE правильный

### "Connection refused"
→ БД не подключена
- Railway → Plugins → PostgreSQL подключена?
- DATABASE_URL в переменных окружения?

### DNS не работает (nokat.pro → Railway)
- Hostinger: проверить что CNAME сохранен
- Подождать 15-30 мин
- Проверить через `nslookup nokat.pro`

---

## 📞 Дальше

Когда базовая версия работает:
1. ✅ Веб-приложение → готово
2. 🔜 Mobile app (Android/iOS)
3. 🔜 Auth система (JWT)
4. 🔜 Платежи (Алтын Асыр)
5. 🔜 UMEQAM Shield интеграция (скрытый анализ постов)

**Ты готов к продакшену! 🚀**
