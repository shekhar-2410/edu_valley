import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Try to get the full DATABASE_URL (standard Vercel/Supabase way)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # 2. Fallback to building it from components
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASS = os.getenv("DB_PASSWORD", "Shekhar@24101995")
    DB_HOST = os.getenv("DB_HOST", "db.seodqvmvbrxhdmjoxvrh.supabase.co")
    DB_PORT = os.getenv("DB_PORT", "6543") # Use Pooler port by default
    DB_NAME = os.getenv("DB_NAME", "postgres")
    
    encoded_pass = urllib.parse.quote_plus(DB_PASS)
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{encoded_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Ensure sslmode is set for Supabase
if "sslmode" not in SQLALCHEMY_DATABASE_URL:
    if "?" in SQLALCHEMY_DATABASE_URL:
        SQLALCHEMY_DATABASE_URL += "&sslmode=require"
    else:
        SQLALCHEMY_DATABASE_URL += "?sslmode=require"

# Fix for Vercel/Postgres (replaces postgres:// with postgresql://)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 10}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
