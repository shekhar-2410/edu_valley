from typing import List, Optional
from datetime import datetime, timedelta
import os
import sys

# Ensure local imports work on Vercel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models
import schemas

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    status,
    File,
    UploadFile,
    Response,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext

# -------------------- SECURITY --------------------
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# -------------------- APP --------------------
app = FastAPI(
    title="School Management API",
    root_path="/api" if os.getenv("VERCEL_ENV") else ""
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- GLOBAL ERROR HANDLER --------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return Response(
        status_code=500,
        content='{"message":"Internal Server Error"}',
        media_type="application/json",
    )

# -------------------- HELPERS --------------------
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# -------------------- DATABASE --------------------
def get_db():
    try:
        import database
        db = database.SessionLocal()
        yield db
    finally:
        db.close()

# -------------------- AUTH --------------------
async def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)

    user = (
        db.query(models.AdminUser)
        .filter(models.AdminUser.email == email)
        .first()
    )
    if not user or not user.is_admin:
        raise HTTPException(status_code=401)
    return user

# -------------------- BASIC ROUTES --------------------
@app.get("/")
def root():
    return {"message": "School Management API running"}

@app.get("/ping")
def ping():
    return {"message": "pong"}

@app.get("/health")
def health(db: Session = Depends(get_db)):
    from sqlalchemy import text
    db.execute(text("SELECT 1"))
    return {"status": "healthy"}

# -------------------- AUTH ROUTES --------------------
@app.post("/auth/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(models.AdminUser)
        .filter(models.AdminUser.email == data.email)
        .first()
    )
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {"sub": user.email},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}

# -------------------- EVENTS --------------------
@app.get("/events", response_model=List[schemas.Event])
def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).all()

@app.post("/events", response_model=schemas.Event)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    obj = models.Event(**event.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# -------------------- FACULTY --------------------
@app.get("/faculty", response_model=List[schemas.Faculty])
def get_faculty(db: Session = Depends(get_db)):
    return db.query(models.Faculty).all()

# -------------------- GALLERY --------------------
@app.get("/gallery", response_model=List[schemas.GalleryImage])
def get_gallery(db: Session = Depends(get_db)):
    return db.query(models.GalleryImage).all()

# -------------------- CONTACTS --------------------
@app.post("/contacts", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    obj = models.Contact(**contact.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# -------------------- LOCAL RUN ONLY --------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)