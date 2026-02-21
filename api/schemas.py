from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# ---------------- Event ----------------
class EventBase(BaseModel):
    title: str
    description: str
    date: date
    location: Optional[str] = None
    image_url: Optional[str] = None


class EventCreate(EventBase):
    pass


class Event(EventBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------- Faculty ----------------
class FacultyBase(BaseModel):
    name: str
    position: str
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None


class FacultyCreate(FacultyBase):
    pass


class Faculty(FacultyBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------- Gallery ----------------
class GalleryImageBase(BaseModel):
    title: str
    image_url: str
    category: Optional[str] = None
    description: Optional[str] = None


class GalleryImageCreate(GalleryImageBase):
    pass


class GalleryImage(GalleryImageBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------- Contact ----------------
class ContactBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str


class ContactCreate(ContactBase):
    pass


class Contact(ContactBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------- Announcement ----------------
class AnnouncementBase(BaseModel):
    title: str
    content: str
    priority: Optional[str] = "normal"


class AnnouncementCreate(AnnouncementBase):
    pass


class Announcement(AnnouncementBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------------- Auth ----------------
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str