import sys
import os

# Add the backend directory to the path so we can import models and database
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def seed():
    db = SessionLocal()
    try:
        announcements = [
            {"title": "Admissions Open for Play Session at our New Campus!", "content": "We are excited to announce that admissions are now open for the Play Session at our newly inaugurated campus at Chainpur Rasulpur Road."},
            {"title": "New Campus Now Open: Chainpur Rasulpur Road, Banger Be Bari", "content": "Our state-of-the-art new campus is now ready to welcome students for the upcoming academic year."},
            {"title": "Academic Session 2026-27: Registration Started", "content": "Registration for all classes (Play to X) for the session 2026-27 has officially commenced at both campuses."}
        ]
        
        for ann in announcements:
            db_ann = models.Announcement(title=ann["title"], content=ann["content"])
            db.add(db_ann)
        
        db.commit()
        print("Announcements seeded successfully!")
    except Exception as e:
        print(f"Error seeding announcements: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
