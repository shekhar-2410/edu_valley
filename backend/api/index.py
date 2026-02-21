from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

try:
    from . import models
    from . import schemas
    from .database import SessionLocal
except ImportError:
    import models
    import schemas
    from database import SessionLocal

app = FastAPI(title="School Management API")

# ---------------- DB DEPENDENCY ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- HEALTH ----------------
@app.get("/health")
def health():
    return {"status": "ok"}

# ---------------- EVENTS ----------------
@app.get("/events", response_model=List[schemas.Event])
def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.date.desc()).all()

# ---------------- FACULTY ----------------
@app.get("/faculty", response_model=List[schemas.Faculty])
def get_faculty(db: Session = Depends(get_db)):
    return db.query(models.Faculty).all()

# ---------------- GALLERY ----------------
@app.get("/gallery", response_model=List[schemas.GalleryImage])
def get_gallery(db: Session = Depends(get_db)):
    return db.query(models.GalleryImage).all()

# ---------------- CONTACT ----------------
@app.post("/contacts", response_model=schemas.Contact)
def create_contact(data: schemas.ContactCreate, db: Session = Depends(get_db)):
    obj = models.Contact(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
