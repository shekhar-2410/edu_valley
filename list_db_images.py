import requests
import json

try:
    response = requests.get('http://localhost:8000/api/gallery')
    if response.status_code == 200:
        images = response.json()
        print(f"Total images found: {len(images)}")
        for img in images:
            print(f"ID: {img['id']}, Title: {img['title']}, URL: {img['image_url']}, Category: {img.get('category')}")
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Connection failed: {e}")
