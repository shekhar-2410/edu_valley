import sys
import os

# Set dummy env vars for local testing
os.environ["DATABASE_URL"] = "postgresql://edu_db_buh8_user:h752OQcRkQo138S86j29rRMY5gXw116D@dpg-cv0r8g56l47c73eq65lg-a.oregon-postgres.render.com/edu_db_buh8"
os.environ["SECRET_KEY"] = "test"

# run imports
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.database import SessionLocal
    from backend.models import AdminUser
    db = SessionLocal()
    user = db.query(AdminUser).filter(AdminUser.email == "admin@nev.edu").first()
    print("User found:", user.email if user else "None")
    
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    if user:
        print("Password match:", pwd_context.verify("admin123", user.hashed_password))
except Exception as e:
    import traceback
    traceback.print_exc()

