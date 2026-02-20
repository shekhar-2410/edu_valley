from datetime import date
from passlib.context import CryptContext

import models
from database import SessionLocal, engine

# Create tables
models.Base.metadata.create_all(bind=engine)


def seed_data():
    db = SessionLocal()

    try:
        # Check if we already have data to avoid duplicates
        if db.query(models.AdminUser).first():
            print("⚠️ Database already seeded. Skipping initial seed.")
            return

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_password = pwd_context.hash("admin123")

        # Seed Admin Users
        admin_users = [
            models.AdminUser(
                email="admin@nev.edu",
                hashed_password=hashed_password,
                is_admin=1
            ),
            models.AdminUser(
                email="director@nev.edu",
                hashed_password=hashed_password,
                is_admin=1
            )
        ]
        db.add_all(admin_users)

        # Seed Events
        events = [
            models.Event(
                title="Spring Science Fair",
                description="Annual science fair showcasing student projects and innovations in STEM.",
                date=date(2026, 3, 15),
                location="Main Auditorium",
                image_url="",
            ),
            models.Event(
                title="Parent-Teacher Conference",
                description="Meet with teachers to discuss student progress and development.",
                date=date(2026, 3, 20),
                location="Various Classrooms",
                image_url="",
            ),
            models.Event(
                title="Spring Musical Performance",
                description="Students present 'The Sound of Music' - a spectacular musical performance.",
                date=date(2026, 4, 5),
                location="School Theater",
                image_url="",
            ),
            models.Event(
                title="Sports Day",
                description="Annual inter-house sports competition with various athletic events.",
                date=date(2026, 4, 15),
                location="School Sports Complex",
                image_url="",
            ),
        ]
        db.add_all(events)

        # Seed Faculty
        faculty = [
            models.Faculty(
                name="Dr. Sarah Johnson",
                position="Principal",
                department="Administration",
                email="sarah.johnson@excellenceacademy.edu",
                phone="+1 (555) 123-4501",
                bio="Dr. Johnson has over 20 years of experience in education and holds a PhD in Educational Leadership.",
                image_url="",
            ),
            models.Faculty(
                name="Michael Chen",
                position="Head of Mathematics",
                department="Mathematics",
                email="michael.chen@excellenceacademy.edu",
                phone="+1 (555) 123-4502",
                bio="Michael specializes in advanced mathematics and has been teaching for 15 years.",
                image_url="",
            ),
            models.Faculty(
                name="Emily Rodriguez",
                position="Science Teacher",
                department="Science",
                email="emily.rodriguez@excellenceacademy.edu",
                phone="+1 (555) 123-4503",
                bio="Emily has a Master's in Biology and passion for environmental education.",
                image_url="",
            ),
            models.Faculty(
                name="James Williams",
                position="English Department Chair",
                department="English",
                email="james.williams@excellenceacademy.edu",
                phone="+1 (555) 123-4504",
                bio="James is an award-winning educator with expertise in literature and creative writing.",
                image_url="",
            ),
        ]
        db.add_all(faculty)

        # Seed Gallery Images
        gallery = [
            models.GalleryImage(
                title="Science Laboratory",
                description="Students conducting experiments in our state-of-the-art science laboratory",
                category="Facilities",
                image_url="https://images.unsplash.com/photo-1564910443496-5fd2d06847ea?auto=format&fit=crop&q=80&w=800",
            ),
            models.GalleryImage(
                title="Annual Sports Day",
                description="Students competing in various athletic events",
                category="Sports",
                image_url="https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800",
            ),
            models.GalleryImage(
                title="Music Concert",
                description="Orchestra performance at the annual music concert",
                category="Arts",
                image_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
            ),
            models.GalleryImage(
                title="Library",
                description="Our extensive library with over 10,000 books",
                category="Facilities",
                image_url="https://images.unsplash.com/photo-1507738911718-9945b3684061?auto=format&fit=crop&q=80&w=800",
            ),
            models.GalleryImage(
                title="Art Class",
                description="Exploring creativity through various painting techniques",
                category="Arts",
                image_url="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
            ),
            models.GalleryImage(
                title="Campus Architecture",
                description="A view of our modern school building",
                category="Campus",
                image_url="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
            ),
        ]
        db.add_all(gallery)

        # Seed Announcements
        announcements = [
            models.Announcement(
                title="Spring Break Schedule",
                content="School will be closed from March 25-29 for Spring Break. Classes resume on April 1st.",
                priority="high",
            ),
            models.Announcement(
                title="New After-School Programs",
                content="We're excited to announce new robotics and coding clubs starting next month!",
                priority="normal",
            ),
            models.Announcement(
                title="Parent Survey",
                content="Please complete our annual parent satisfaction survey by the end of the month.",
                priority="low",
            ),
        ]
        db.add_all(announcements)

        db.commit()
        print("✅ Database seeded successfully!")
        print(f"Added {len(events)} events")
        print(f"Added {len(faculty)} faculty members")
        print(f"Added {len(gallery)} gallery images")
        print(f"Added {len(announcements)} announcements")
        print(f"Added {len(admin_users)} admin users")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed_data()
