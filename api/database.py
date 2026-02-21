import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # During build/local dev if env is missing, we might want a fallback or error
    # For Vercel production, this MUST be set.
    if os.getenv("VERCEL_ENV"):
        raise RuntimeError("DATABASE_URL is not set")
    else:
        # Local development fallback
        DATABASE_URL = "postgresql://postgres:Shekhar%4024101995@db.seodqvmvbrxhdmjoxvrh.supabase.co:5432/postgres?sslmode=require"

# Normalize postgres scheme
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure SSL for Supabase
if "sslmode" not in DATABASE_URL:
    sep = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL += f"{sep}sslmode=require"

# engine with NullPool to disable pooling for serverless
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    pool_pre_ping=True,
    connect_args={
        "connect_timeout": 30
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Export DB_HOST for compatibility with index.py diagnostics
try:
    DB_HOST = DATABASE_URL.split("@")[1].split(":")[0]
except:
    DB_HOST = "unknown"
