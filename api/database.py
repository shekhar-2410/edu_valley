import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuration
# Default fallback URL using standard port 5432 and sslmode=require
DEFAULT_DB_URL = "postgresql://postgres:Shekhar%4024101995@db.seodqvmvbrxhdmjoxvrh.supabase.co:5432/postgres?sslmode=require"

# Preferred: DATABASE_URL from environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = DEFAULT_DB_URL

# Clean up the URL for Vercel/Postgres compatibility (e.g. postgres:// -> postgresql://)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure SSL is enabled if not already in URL
if "sslmode" not in SQLALCHEMY_DATABASE_URL:
    separator = "&" if "?" in SQLALCHEMY_DATABASE_URL else "?"
    SQLALCHEMY_DATABASE_URL += f"{separator}sslmode=require"

# Define DB_HOST for diagnostic purposes
try:
    DB_HOST = SQLALCHEMY_DATABASE_URL.split("@")[1].split(":")[0]
except:
    DB_HOST = "unknown"

# Create the engine with serverless-friendly settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=5,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "connect_timeout": 30
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
