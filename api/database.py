import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Configuration with safe fallbacks
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "Shekhar@24101995")
DB_HOST = os.getenv("DB_HOST", "db.seodqvmvbrxhdmjoxvrh.supabase.co")
DB_NAME = os.getenv("DB_NAME", "postgres")

# USE PORT 6543 (Transaction Pooler) - Much more stable for Vercel
DB_PORT = os.getenv("DB_PORT", "6543") 

# Priority 1: Use the full DATABASE_URL if it exists (highly recommended for Vercel)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # Priority 2: Build from components
    encoded_pass = urllib.parse.quote_plus(DB_PASS)
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{encoded_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Vercel Fixes:
# A. Ensure postgresql:// prefix
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# B. Add SSL and Pooling arguments for serverless stability
if "?" not in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL += "?sslmode=require&prepare_threshold=0"
else:
    if "sslmode" not in SQLALCHEMY_DATABASE_URL:
        SQLALCHEMY_DATABASE_URL += "&sslmode=require"
    if "prepare_threshold" not in SQLALCHEMY_DATABASE_URL:
        SQLALCHEMY_DATABASE_URL += "&prepare_threshold=0"

# C. Optimize engine for Serverless (Short timeouts, ping before use)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
