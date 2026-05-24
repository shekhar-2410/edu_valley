import os
import sys


os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/edu_valley_smoke.db")
os.environ.setdefault("SECRET_KEY", "local-smoke-secret")

sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from backend.database import SessionLocal, engine
    from backend.models import AdminUser, Base

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user = db.query(AdminUser).filter(AdminUser.email == os.getenv("SMOKE_ADMIN_EMAIL", "admin@nev.edu")).first()
        print("Database connection OK")
        print("Admin user found:", bool(user))
    finally:
        db.close()
except Exception:
    import traceback
    traceback.print_exc()
    raise
