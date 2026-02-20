import json
import sqlite3
import os

def restore_from_backups():
    # 1. Restore Gallery from db_images.json
    db_path = 'backend/school.db'
    json_path = 'db_images.json'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found")
        return

    with open(json_path, 'r') as f:
        gallery_data = json.load(f)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clear current garbage gallery images
    cursor.execute('DELETE FROM gallery_images')
    
    added_count = 0
    for item in gallery_data:
        cursor.execute('''
            INSERT INTO gallery_images (title, image_url, category, description, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (item['title'], item['image_url'], item['category'], item.get('description', ''), item['created_at']))
        added_count += 1
    
    conn.commit()
    print(f"✅ Restored {added_count} gallery entries from db_images.json")

    # 2. Restore Announcements from seed_announcements.py logic (manually here)
    cursor.execute('DELETE FROM announcements')
    announcements = [
        {"title": "Admissions Open for Play Session at our New Campus!", "content": "We are excited to announce that admissions are now open for the Play Session at our newly inaugurated campus at Chainpur Rasulpur Road."},
        {"title": "New Campus Now Open: Chainpur Rasulpur Road, Banger Be Bari", "content": "Our state-of-the-art new campus is now ready to welcome students for the upcoming academic year."},
        {"title": "Academic Session 2026-27: Registration Started", "content": "Registration for all classes (Play to X) for the session 2026-27 has officially commenced at both campuses."}
    ]
    for ann in announcements:
        cursor.execute('INSERT INTO announcements (title, content, priority) VALUES (?, ?, ?)', (ann['title'], ann['content'], 'normal'))
    
    conn.commit()
    print(f"✅ Restored {len(announcements)} real announcements.")
    
    conn.close()

if __name__ == "__main__":
    restore_from_backups()
