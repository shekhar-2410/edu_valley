import sys
import os
try:
    from passlib.context import CryptContext
    import bcrypt
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    sample_password = os.getenv("SMOKE_PASSWORD", "local-smoke-password")
    hashed = pwd_context.hash(sample_password)
    print("Hash generated:", hashed.startswith("$2"))
    print("Verify is:", pwd_context.verify(sample_password, hashed))
except Exception as e:
    import traceback
    traceback.print_exc()
