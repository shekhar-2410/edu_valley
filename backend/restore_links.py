import models
from database import SessionLocal

def restore_gallery_links():
    db = SessionLocal()
    try:
        # Get all stored images
        stored_images = db.query(models.StoredImage).all()
        
        # Get already linked gallery images to avoid duplicates
        existing_urls = [img.image_url for img in db.query(models.GalleryImage).all()]
        
        added_count = 0
        for stored in stored_images:
            image_url = f"http://localhost:8000/api/images/{stored.id}"
            
            if image_url not in existing_urls:
                # Create a gallery entry for the stored image
                # Try to guess title from filename
                title = stored.filename.split('.')[0].replace('-', ' ').replace('_', ' ').capitalize()
                if "Whatsapp" in title:
                    title = "Campus Life"
                
                new_gallery_img = models.GalleryImage(
                    title=title,
                    image_url=image_url,
                    category="Campus",
                    description=f"Uploaded photo: {stored.filename}"
                )
                db.add(new_gallery_img)
                added_count += 1
        
        db.commit()
        print(f"✅ Restored {added_count} gallery links from stored images.")
    except Exception as e:
        print(f"❌ Error restoring links: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    restore_gallery_links()
