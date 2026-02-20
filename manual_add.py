import sqlite3
import datetime

def add_manual_data():
    conn = sqlite3.connect('backend/school.db')
    cursor = conn.cursor()

    # Get some recent image IDs to reuse
    # Using IDs 46, 45, 44... which likely correspond to the latest uploads
    # Adjust these IDs if specific images are needed
    
    # 1. Add Principal (Faculty)
    # Using image ID 46 (latest uploaded) for Principal
    principal_img = "http://localhost:8000/api/images/46"
    
    cursor.execute('''
        INSERT INTO faculty (name, position, department, email, phone, bio, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        "Principal Name", 
        "Principal", 
        "Administration", 
        "principal@nev.edu", 
        "+91 91234 56789", 
        "Leading our school with a vision for excellence and holistic development.", 
        principal_img,
        datetime.datetime.now()
    ))
    
    # 2. Add Events
    # Using other recent images for events
    event_img_1 = "http://localhost:8000/api/images/45"
    event_img_2 = "http://localhost:8000/api/images/44"
    event_img_3 = "http://localhost:8000/api/images/43"

    events = [
        ("Republic Day Celebration", "Grand celebration at school ground with cultural performances.", "2026-01-26", "School Ground", event_img_1),
        ("Annual Sports Meet", "Inter-house sports competitions showcasing student talent.", "2026-02-15", "Sports Complex", event_img_2),
        ("Science Exhibition", "Students presenting innovative science models.", "2026-02-28", "Main Hall", event_img_3)
    ]

    for title, desc, date, loc, img in events:
        cursor.execute('''
            INSERT INTO events (title, description, date, location, image_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (title, desc, date, loc, img, datetime.datetime.now()))

    conn.commit()
    print("✅ Successfully added Principal and 3 Events using your uploaded images.")
    conn.close()

if __name__ == "__main__":
    add_manual_data()
