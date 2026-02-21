from typing import List, Optional
from datetime import datetime, timedelta

import os
import sys

# Add the current directory to sys.path so that local modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


import database
import models
import schemas
from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-school-website-nev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

app = FastAPI(
    title="School Management API",
    root_path="/api" if os.getenv("VERCEL_ENV") else ""
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables only on demand or via a specific endpoint
def init_db():
    try:
        models.Base.metadata.create_all(bind=database.engine)
        return True
    except Exception as e:
        print(f"Database initialization error: {e}")
        return False

# Skip auto-initialization at top level to avoid Vercel timeouts
# models.Base.metadata.create_all(bind=database.engine)

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal Server Error",
            "detail": str(exc),
            "type": str(type(exc).__name__),
            "path": request.url.path
        }
    )


# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.AdminUser).filter(models.AdminUser.email == token_data.email).first()
    if user is None or not user.is_admin:
        raise credentials_exception
    return user


@app.get("/debug/packages")
def list_packages():

    import pkg_resources
    installed_packages = {d.project_name: d.version for d in pkg_resources.working_set}
    return {
        "packages": installed_packages,
        "python_version": sys.version,
        "sys_path": sys.path
    }


@app.get("/")
def read_root():
    return {"message": "Welcome to School Management API"}



@app.get("/path/{full_path:path}")
def show_path(full_path: str, request: Request):
    return {
        "full_path": full_path,
        "request_url_path": request.url.path,
        "message": "Debug path info"
    }


@app.get("/init-db")
def initialize_database():
    success = init_db()
    if success:
        return {"message": "Database initialized successfully"}
    return {"message": "Database initialization failed"}, 500

@app.get("/ping")
def ping():
    return {"message": "pong", "sys_path": sys.path[:3]}




# Auth Routes
@app.post("/auth/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.AdminUser).filter(models.AdminUser.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}



# Image Upload
@app.post("/upload")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        data = await file.read()
        db_image = models.StoredImage(
            filename=file.filename,
            content_type=file.content_type,
            data=data
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        # Return URL to access this image
        return {"url": f"/api/images/{db_image.id}", "id": db_image.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/images/{image_id}")
async def get_image(image_id: int, db: Session = Depends(get_db)):
    db_image = db.query(models.StoredImage).filter(models.StoredImage.id == image_id).first()
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return Response(content=db_image.data, media_type=db_image.content_type)


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Test DB connection
        from sqlalchemy import text
        result = db.execute(text("SELECT 1")).fetchone()
        return {
            "status": "healthy",
            "database": "connected",
            "db_result": str(result),
            "environment": os.getenv("VERCEL_ENV", "local"),
            "python_version": sys.version,
            "db_host": database.DB_HOST
        }
    except Exception as e:
        import traceback
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "environment": os.getenv("VERCEL_ENV", "local")
        }


# News & Events
@app.get("/events", response_model=List[schemas.Event])
def get_events(db: Session = Depends(get_db)):
    try:
        events = db.query(models.Event).order_by(models.Event.date.desc()).all()
        return events
    except Exception as e:
        print(f"Error fetching events: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@app.post("/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@app.put("/events/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, event_update: schemas.EventCreate, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event


@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted"}


# Faculty
@app.get("/faculty", response_model=List[schemas.Faculty])
def get_faculty(db: Session = Depends(get_db)):
    faculty = db.query(models.Faculty).all()
    return faculty


@app.post("/faculty", response_model=schemas.Faculty)
def create_faculty(faculty: schemas.FacultyCreate, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    db_faculty = models.Faculty(**faculty.dict())
    db.add(db_faculty)
    db.commit()
    db.refresh(db_faculty)
    return db_faculty


@app.put("/faculty/{faculty_id}", response_model=schemas.Faculty)
def update_faculty(faculty_id: int, faculty_update: schemas.FacultyCreate, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    db_faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not db_faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    update_data = faculty_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_faculty, key, value)
    
    db.commit()
    db.refresh(db_faculty)
    return db_faculty


@app.delete("/faculty/{faculty_id}")
def delete_faculty(faculty_id: int, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(faculty)
    db.commit()
    return {"message": "Faculty deleted"}


# Gallery
@app.get("/gallery", response_model=List[schemas.GalleryImage])
def get_gallery(db: Session = Depends(get_db)):
    try:
        images = db.query(models.GalleryImage).all()
        return images
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gallery database error: {str(e)}"
        )



@app.post("/gallery", response_model=schemas.GalleryImage)
def create_gallery_image(
    image: schemas.GalleryImageCreate, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)
):
    db_image = models.GalleryImage(**image.dict())
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


@app.put("/gallery/{image_id}", response_model=schemas.GalleryImage)
def update_gallery_image(image_id: int, image_update: schemas.GalleryImageCreate, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    db_image = db.query(models.GalleryImage).filter(models.GalleryImage.id == image_id).first()
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    update_data = image_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_image, key, value)
    
    db.commit()
    db.refresh(db_image)
    return db_image


@app.delete("/gallery/{image_id}")
def delete_gallery_image(image_id: int, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    image = (
        db.query(models.GalleryImage).filter(models.GalleryImage.id == image_id).first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(image)
    db.commit()
    return {"message": "Image deleted"}


# Contact Messages
@app.get("/contacts", response_model=List[schemas.Contact])
def get_contacts(db: Session = Depends(get_db)):
    contacts = db.query(models.Contact).order_by(models.Contact.created_at.desc()).all()
    return contacts


@app.post("/contacts", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    db_contact = models.Contact(**contact.dict())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


@app.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted"}


# Announcements
@app.get("/announcements", response_model=List[schemas.Announcement])
def get_announcements(db: Session = Depends(get_db)):
    announcements = (
        db.query(models.Announcement)
        .order_by(models.Announcement.created_at.desc())
        .all()
    )
    return announcements


@app.post("/announcements", response_model=schemas.Announcement)
def create_announcement(
    announcement: schemas.AnnouncementCreate, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)
):
    db_announcement = models.Announcement(**announcement.dict())
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement


@app.put("/announcements/{announcement_id}", response_model=schemas.Announcement)
def update_announcement(announcement_id: int, announcement_update: schemas.AnnouncementCreate, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    update_data = announcement_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_announcement, key, value)
    
    db.commit()
    db.refresh(db_announcement)
    return db_announcement


@app.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: int, db: Session = Depends(get_db), current_admin: models.AdminUser = Depends(get_current_admin)):
    announcement = (
        db.query(models.Announcement)
        .filter(models.Announcement.id == announcement_id)
        .first()
    )
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
