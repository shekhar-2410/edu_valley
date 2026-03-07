import sys
try:
    from passlib.context import CryptContext
    import bcrypt
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash("admin123")
    print("Hash is:", hashed)
    print("Verify is:", pwd_context.verify("admin123", hashed))
except Exception as e:
    import traceback
    traceback.print_exc()
