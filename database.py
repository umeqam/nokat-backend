"""
NOKAT Database Configuration
PostgreSQL connection + Session management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# DATABASE_URL из Railway environment переменной или локально
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/nokat"
)

# Для Railway совместимости (меняет postgres:// на postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True для debug SQL queries
    pool_pre_ping=True,  # Проверка подключения перед использованием
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class для моделей
Base = declarative_base()
