from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from datetime import datetime
from base import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    display_name = Column(String)
    avatar_emoji = Column(String, default='😊')
    region = Column(String)
    trust_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    mode = Column(String)
    title = Column(String)
    description = Column(Text)
    category = Column(String)
    region = Column(String)
    budget = Column(String)
    status = Column(String, default='активен')
    created_at = Column(DateTime, default=datetime.utcnow)

class Response(Base):
    __tablename__ = 'responses'
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer)
    responder_id = Column(Integer)
    message = Column(Text)
    status = Column(String, default='новый')
    created_at = Column(DateTime, default=datetime.utcnow)
