from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, EmailStr


# Event Schemas
class EventBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=5000)
    date: date
    location: Optional[str] = Field(None, max_length=200)
    image_url: Optional[str] = Field(None, max_length=500)


class EventCreate(EventBase):
    pass


class Event(EventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Faculty Schemas
class FacultyBase(BaseModel):
    name: str = Field(..., max_length=100)
    position: str = Field(..., max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    image_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=2000)


class FacultyCreate(FacultyBase):
    pass


class Faculty(FacultyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Gallery Schemas
class GalleryImageBase(BaseModel):
    title: str = Field(..., max_length=200)
    image_url: str = Field(..., max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)


class GalleryImageCreate(GalleryImageBase):
    pass


class GalleryImage(GalleryImageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Contact Schemas
class ContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)


class ContactCreate(ContactBase):
    pass


class Contact(ContactBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Announcement Schemas
class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=5000)
    priority: Optional[str] = Field("normal", pattern="^(low|normal|high)$")


class AnnouncementCreate(AnnouncementBase):
    pass


class Announcement(AnnouncementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str
