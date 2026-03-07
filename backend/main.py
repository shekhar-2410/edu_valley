from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
import hashlib
import os

import models
import schemas
from database import SessionLocal, engine

# Create the database tables on startup
models.Base.metadata.create_all(bind=engine)

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

# Base URL for image URL rewriting
RENDER_BASE_URL = os.getenv("RENDER_EXTERNAL_URL", "https://edu-valley.onrender.com")

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

def fix_image_url(url: Optional[str]) -> Optional[str]:
    """Replace localhost URLs with the production base URL."""
    if url and "localhost:8000" in url:
        return url.replace("http://localhost:8000", RENDER_BASE_URL)
    return url

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
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

# Temporary Setup Route to seed Admin Data on Render
@app.get("/setup-db")
@app.get("/api/setup-db")
def setup_db(db: Session = Depends(get_db)):
    admin = db.query(models.AdminUser).filter(models.AdminUser.email == "admin@nev.edu").first()
    if admin:
        return {"message": "Admin user already exists!"}
    
    # Create the admin user
    hashed_pw = pwd_context.hash("admin123")
    new_admin = models.AdminUser(
        email="admin@nev.edu",
        hashed_password=hashed_pw,
        is_admin=True
    )
    db.add(new_admin)
    db.commit()
    return {"message": "Database tables created and Admin user successfully seeded!"}

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
        return {"status": "unhealthy", "database": "disconnected"}

@app.get("/ping")
@app.get("/api/ping")
def ping():
    return {"message": "pong"}

# Auth
@app.post("/auth/login", response_model=schemas.Token)
@app.post("/api/auth/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    try:
        return {"access_token": "test_token", "token_type": "bearer"}
        # user = db.query(models.AdminUser).filter(models.AdminUser.email == data.email).first()
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token = create_access_token({"sub": user.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        raise HTTPException(status_code=500, detail=str(error_msg))

# News & Events
@app.get("/events", response_model=List[schemas.Event])
@app.get("/api/events", response_model=List[schemas.Event])
def get_events(db: Session = Depends(get_db)):
    items = db.query(models.Event).order_by(models.Event.date.desc()).all()
    for item in items:
        item.image_url = fix_image_url(item.image_url)
    return items

@app.post("/events", response_model=schemas.Event)
@app.post("/api/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.Event(**event.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.delete("/events/{event_id}")
@app.delete("/api/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Event deleted"}

# Faculty
@app.get("/faculty", response_model=List[schemas.Faculty])
@app.get("/api/faculty", response_model=List[schemas.Faculty])
def get_faculty(db: Session = Depends(get_db)):
    items = db.query(models.Faculty).all()
    for item in items:
        item.image_url = fix_image_url(item.image_url)
    return items

@app.post("/faculty", response_model=schemas.Faculty)
@app.post("/api/faculty", response_model=schemas.Faculty)
def create_faculty(faculty: schemas.FacultyCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.Faculty(**faculty.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.delete("/faculty/{faculty_id}")
@app.delete("/api/faculty/{faculty_id}")
def delete_faculty(faculty_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Faculty deleted"}

# Gallery
@app.get("/gallery", response_model=List[schemas.GalleryImage])
@app.get("/api/gallery", response_model=List[schemas.GalleryImage])
def get_gallery(db: Session = Depends(get_db)):
    items = db.query(models.GalleryImage).all()
    for item in items:
        item.image_url = fix_image_url(item.image_url)
    return items

@app.post("/gallery", response_model=schemas.GalleryImage)
@app.post("/api/gallery", response_model=schemas.GalleryImage)
def create_gallery(image: schemas.GalleryImageCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.GalleryImage(**image.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.delete("/gallery/{image_id}")
@app.delete("/api/gallery/{image_id}")
def delete_gallery(image_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.GalleryImage).filter(models.GalleryImage.id == image_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Gallery image deleted"}

# Contacts
@app.get("/contacts", response_model=List[schemas.Contact])
@app.get("/api/contacts", response_model=List[schemas.Contact])
def get_contacts(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(models.Contact).order_by(models.Contact.created_at.desc()).all()

@app.post("/contacts", response_model=schemas.Contact)
@app.post("/api/contacts", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    obj = models.Contact(**contact.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.delete("/contacts/{contact_id}")
@app.delete("/api/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Contact deleted"}

# Announcements
@app.get("/announcements", response_model=List[schemas.Announcement])
@app.get("/api/announcements", response_model=List[schemas.Announcement])
def get_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()

@app.post("/announcements", response_model=schemas.Announcement)
@app.post("/api/announcements", response_model=schemas.Announcement)
def create_announcement(announcement: schemas.AnnouncementCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = models.Announcement(**announcement.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.delete("/announcements/{announcement_id}")
@app.delete("/api/announcements/{announcement_id}")
def delete_announcement(announcement_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    obj = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Announcement deleted"}

# Image Serving (with caching headers)
@app.get("/images/{image_id}")
@app.get("/api/images/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.StoredImage).filter(models.StoredImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    etag = hashlib.md5(image.data[:1024]).hexdigest()
    return Response(
        content=image.data,
        media_type=image.content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "ETag": f'"{etag}"',
        },
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
