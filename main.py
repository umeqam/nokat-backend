from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from models import Base, User, Post, Response
from schemas import UserCreate, PostCreate, ResponseCreate
from database import get_db, engine

app = FastAPI(title='NOKAT API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event('startup')
def startup():
    Base.metadata.create_all(bind=engine)

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.post('/api/v1/users')
def create_user(user: UserCreate):
    return {'id': 1, 'username': user.username}

@app.get('/api/v1/posts')
def get_posts(mode: str = None, region: str = None, limit: int = 20):
    return []
