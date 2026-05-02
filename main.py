"""
NOKAT Backend - FastAPI Application
Маркетплейс платформа (ищу/предлагаю)
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List
import os

from database import engine, SessionLocal, Base
from models import User, Post, Response as ResponseModel
from schemas import (
    UserCreate, UserResponse,
    PostCreate, PostResponse,
    ResponseCreate, ResponseResponse
)

# Инициализация БД
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NOKAT API",
    description="Маркетплейс платформа Туркменистана",
    version="1.0.0"
)

# CORS конфиг (для фронтенда с разных источников)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production: ["https://nokat.pro"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Зависимость для БД сессии
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== HEALTH CHECK ====================
@app.get("/health")
async def health():
    return {"status": "ok", "service": "nokat-api"}


# ==================== USER ENDPOINTS ====================
@app.post("/api/v1/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Создать новый профиль пользователя"""
    # Проверка дубликата
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    
    db_user = User(
        username=user.username,
        display_name=user.display_name,
        avatar_emoji=user.avatar_emoji or "👤",
        region=user.region or "Ашгабат",
        trust_score=0,
        trust_level="НОВИЧОК"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/api/v1/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Получить профиль пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


# ==================== POST ENDPOINTS ====================
@app.get("/api/v1/posts", response_model=List[PostResponse])
async def get_posts(
    mode: str = "ищу",  # или "предлагаю"
    region: str = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Получить список постов (с фильтром по режиму и региону)"""
    query = db.query(Post).filter(Post.mode == mode)
    
    if region:
        query = query.filter(Post.region == region)
    
    posts = query.order_by(desc(Post.created_at)).offset(skip).limit(limit).all()
    return posts


@app.get("/api/v1/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: int, db: Session = Depends(get_db)):
    """Получить конкретный пост"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пост не найден")
    return post


@app.post("/api/v1/posts", response_model=PostResponse)
async def create_post(post: PostCreate, db: Session = Depends(get_db)):
    """Создать новый пост (ищу/предлагаю)"""
    # Проверка что пользователь существует
    user = db.query(User).filter(User.id == post.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    db_post = Post(
        user_id=post.user_id,
        mode=post.mode,  # "ищу" или "предлагаю"
        title=post.title,
        description=post.description,
        region=post.region,
        category=post.category or "Разное",
        budget=post.budget,
        status="активен"
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


@app.put("/api/v1/posts/{post_id}")
async def update_post(post_id: int, updates: dict, db: Session = Depends(get_db)):
    """Обновить статус поста"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")
    
    if "status" in updates:
        post.status = updates["status"]  # "активен", "завершен", "отменен"
    
    db.commit()
    db.refresh(post)
    return post


# ==================== RESPONSE ENDPOINTS ====================
@app.post("/api/v1/posts/{post_id}/respond", response_model=ResponseResponse)
async def respond_to_post(post_id: int, response: ResponseCreate, db: Session = Depends(get_db)):
    """Отклик на пост"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")
    
    responder = db.query(User).filter(User.id == response.responder_id).first()
    if not responder:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверка что пользователь не откликается на свой пост
    if post.user_id == response.responder_id:
        raise HTTPException(status_code=400, detail="Нельзя откликаться на свой пост")
    
    db_response = ResponseModel(
        post_id=post_id,
        responder_id=response.responder_id,
        message=response.message or "",
        status="новый"  # новый, принят, отклонен
    )
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    return db_response


@app.get("/api/v1/posts/{post_id}/responses")
async def get_post_responses(post_id: int, db: Session = Depends(get_db)):
    """Получить все отклики на пост"""
    responses = db.query(ResponseModel).filter(ResponseModel.post_id == post_id).all()
    return responses


# ==================== TRUST SCORE ENDPOINTS ====================
@app.post("/api/v1/users/{user_id}/trust/add")
async def add_trust_score(user_id: int, points: int, reason: str = "", db: Session = Depends(get_db)):
    """Добавить баллы в trust score"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.trust_score += points
    
    # Обновить уровень в зависимости от баллов
    if user.trust_score >= 100:
        user.trust_level = "МАСТЕР"
    elif user.trust_score >= 50:
        user.trust_level = "ПРОВЕРЕННЫЙ"
    elif user.trust_score >= 10:
        user.trust_level = "НАДЁЖНЫЙ"
    else:
        user.trust_level = "НОВИЧОК"
    
    db.commit()
    db.refresh(user)
    return {
        "user_id": user.id,
        "trust_score": user.trust_score,
        "trust_level": user.trust_level,
        "reason": reason
    }


@app.get("/api/v1/users/{user_id}/trust")
async def get_trust_info(user_id: int, db: Session = Depends(get_db)):
    """Получить информацию о trust score"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return {
        "user_id": user.id,
        "trust_score": user.trust_score,
        "trust_level": user.trust_level,
        "display_name": user.display_name
    }


# ==================== STATS ENDPOINTS ====================
@app.get("/api/v1/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Общая статистика платформы"""
    total_users = db.query(User).count()
    total_posts = db.query(Post).count()
    active_posts = db.query(Post).filter(Post.status == "активен").count()
    
    return {
        "total_users": total_users,
        "total_posts": total_posts,
        "active_posts": active_posts,
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
