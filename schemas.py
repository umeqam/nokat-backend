"""
NOKAT Pydantic Schemas (для валидации и сериализации)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ==================== USER SCHEMAS ====================
class UserCreate(BaseModel):
    """Создание пользователя"""
    username: str = Field(..., min_length=3, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    avatar_emoji: Optional[str] = "👤"
    region: Optional[str] = "Ашгабат"


class UserResponse(BaseModel):
    """Ответ профиля пользователя"""
    id: int
    username: str
    display_name: str
    avatar_emoji: str
    region: str
    trust_score: int
    trust_level: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== POST SCHEMAS ====================
class PostCreate(BaseModel):
    """Создание поста"""
    user_id: int
    mode: str = Field(..., pattern="^(ищу|предлагаю)$")  # ищу или предлагаю
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    region: Optional[str] = "Ашгабат"
    category: Optional[str] = "Разное"
    budget: Optional[float] = None


class PostResponse(BaseModel):
    """Ответ поста"""
    id: int
    user_id: int
    mode: str
    title: str
    description: str
    region: str
    category: str
    budget: Optional[float]
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Embedded автор
    author: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True


# ==================== RESPONSE SCHEMAS ====================
class ResponseCreate(BaseModel):
    """Отклик на пост"""
    responder_id: int
    message: Optional[str] = ""


class ResponseResponse(BaseModel):
    """Ответ отклика"""
    id: int
    post_id: int
    responder_id: int
    message: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
