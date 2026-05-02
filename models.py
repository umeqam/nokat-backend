"""
NOKAT Database Models (SQLAlchemy ORM)
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    """Профиль пользователя"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    avatar_emoji = Column(String(10), default="👤")
    region = Column(String(100), default="Ашгабат")
    
    # Trust система
    trust_score = Column(Integer, default=0)  # Баллы доверия (0-100+)
    trust_level = Column(String(20), default="НОВИЧОК")  # НОВИЧОК, НАДЁЖНЫЙ, ПРОВЕРЕННЫЙ, МАСТЕР
    
    # Временные метки
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Отношения
    posts = relationship("Post", back_populates="author")
    responses = relationship("Response", back_populates="responder")
    
    def __repr__(self):
        return f"<User {self.username} ({self.trust_level})>"


class Post(Base):
    """Пост (запрос или предложение)"""
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Тип поста
    mode = Column(String(20), nullable=False)  # "ищу" или "предлагаю"
    
    # Содержание
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="Разное")
    region = Column(String(100), default="Ашгабат")
    
    # Бюджет/цена
    budget = Column(Float, nullable=True)  # В манатах или условных единицах
    
    # Статус
    status = Column(String(20), default="активен")  # активен, завершен, отменен
    
    # Временные метки
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Отношения
    author = relationship("User", back_populates="posts")
    responses = relationship("Response", back_populates="post")
    
    def __repr__(self):
        return f"<Post #{self.id} ({self.mode}) by {self.user_id}>"


class Response(Base):
    """Отклик на пост"""
    __tablename__ = "responses"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    responder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Сообщение отклика
    message = Column(Text, nullable=True)
    
    # Статус
    status = Column(String(20), default="новый")  # новый, принят, отклонен, выполнен
    
    # Временные метки
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Отношения
    post = relationship("Post", back_populates="responses")
    responder = relationship("User", back_populates="responses")
    
    def __repr__(self):
        return f"<Response #{self.id} to Post {self.post_id}>"
