import sys
try:
    from datetime import datetime, timedelta, timezone
    from jose import jwt
    SECRET_KEY = "test"
    ALGORITHM = "HS256"
    to_encode = {"sub": "admin@nev.edu"}
    expire = datetime.now(timezone.utc) + timedelta(minutes=60*24*30)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print("Token is:", token)
except Exception as e:
    import traceback
    traceback.print_exc()
