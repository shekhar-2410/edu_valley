from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
import os

import models
import schemas
from database import SessionLocal

app = FastAPI(title="School Management API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Constants
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helpers
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    user = db.query(models.AdminUser).filter(models.AdminUser.email == email).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

# Basic Routes
@app.get("/")
@app.get("/api")
def root():
    return {"message": "Edu Valley API running on Render"}

@app.get("/health")
@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

@app.get("/ping")
@app.get("/api/ping")
def ping():
    return {"message": "pong"}

# Auth
@app.post("/auth/login", response_model=schemas.Token)
@app.post("/api/auth/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.AdminUser).filter(models.AdminUser.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}

# News & Events
@app.get("/events", response_model=List[schemas.Event])
@app.get("/api/events", response_model=List[schemas.Event])
def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.date.desc()).all()

@app.post("/events", response_model=schemas.Event)
@app.post("/api/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.Event(**event.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# Faculty
@app.get("/faculty", response_model=List[schemas.Faculty])
@app.get("/api/faculty", response_model=List[schemas.Faculty])
def get_faculty(db: Session = Depends(get_db)):
    base_url = os.getenv("RENDER_EXTERNAL_URL", "https://edu-valley.onrender.com")
    items = db.query(models.Faculty).all()
    for item in items:
        if item.image_url and "localhost:8000" in item.image_url:
            item.image_url = item.image_url.replace("http://localhost:8000", base_url)
    return items

# Gallery
@app.get("/gallery", response_model=List[schemas.GalleryImage])
@app.get("/api/gallery", response_model=List[schemas.GalleryImage])
def get_gallery(db: Session = Depends(get_db)):
    base_url = os.getenv("RENDER_EXTERNAL_URL", "https://edu-valley.onrender.com")
    items = db.query(models.GalleryImage).all()
    for item in items:
        if item.image_url and "localhost:8000" in item.image_url:
            item.image_url = item.image_url.replace("http://localhost:8000", base_url)
    return items

# Contacts
@app.post("/contacts", response_model=schemas.Contact)
@app.post("/api/contacts", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    obj = models.Contact(**contact.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# Announcements
@app.get("/announcements", response_model=List[schemas.Announcement])
@app.get("/api/announcements", response_model=List[schemas.Announcement])
def get_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()

# Image Serving
@app.get("/images/{image_id}")
@app.get("/api/images/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.StoredImage).filter(models.StoredImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=image.data, media_type=image.content_type)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
