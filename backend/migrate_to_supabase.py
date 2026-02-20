import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the directory containing this script to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

import models
from database import Base

# Configuration
# Search for school.db in the same directory as the script
LOCAL_DB_PATH = os.path.join(script_dir, "school.db")
if not os.path.exists(LOCAL_DB_PATH):
    # Try the parent directory
    LOCAL_DB_PATH = os.path.join(os.path.dirname(script_dir), "school.db")

if not os.path.exists(LOCAL_DB_PATH):
    print(f"❌ ERROR: school.db not found. Looked in {script_dir} and parent.")
    sys.exit(1)

LOCAL_DB_URL = f"sqlite:///{LOCAL_DB_PATH}"

# PROD_DB = Environment variable DATABASE_URL
PROD_DB = os.getenv("DATABASE_URL")

if not PROD_DB:
    print("❌ ERROR: DATABASE_URL environment variable not set.")
    print("Please run: export DATABASE_URL='your_supabase_url'")
    sys.exit(1)

# Initialize engines
print(f"🔌 Connecting to Local DB: {LOCAL_DB_URL}")
local_engine = create_engine(LOCAL_DB_URL)
LocalSession = sessionmaker(bind=local_engine)

print(f"🔌 Connecting to Supabase...")
# Fix for postgres:// vs postgresql://
if PROD_DB.startswith("postgres://"):
    PROD_DB = PROD_DB.replace("postgres://", "postgresql://", 1)
prod_engine = create_engine(PROD_DB)
ProdSession = sessionmaker(bind=prod_engine)

def migrate():
    # 1. Create tables in Supabase
    print("🏗️  Creating tables in Supabase (if they don't exist)...")
    models.Base.metadata.create_all(bind=prod_engine)
    
    local_session = LocalSession()
    prod_session = ProdSession()

    tables = [
        models.AdminUser,
        models.Event,
        models.Faculty,
        models.GalleryImage,
        models.Contact,
        models.StoredImage,
        models.Announcement
    ]

    try:
        for model in tables:
            print(f"📦 Migrating table: {model.__tablename__}...")
            
            # Get all data from local
            items = local_session.query(model).all()
            print(f"   Found {len(items)} records.")
            
            # Add to prod
            for item in items:
                # Merge is better as it handles primary key conflicts
                prod_session.merge(item)
            
            prod_session.commit()
            print(f"   ✅ Done.")

        print("\n🎉 Migration completed successfully!")
        print("Your Supabase database now has all your local data.")

    except Exception as e:
        print(f"\n❌ ERROR during migration: {e}")
        prod_session.rollback()
    finally:
        local_session.close()
        prod_session.close()

if __name__ == "__main__":
    migrate()
