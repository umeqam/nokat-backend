from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    display_name = Column(String)
    region = Column(String)
    trust_score = Column(Integer, default=0)
    trust_level = Column(String, default='НОВИЧОК')

class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    title = Column(String)
    description = Column(Text)
    mode = Column(String)
    region = Column(String)
    budget = Column(String)
    category = Column(String)
    status = Column(String, default='активен')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
