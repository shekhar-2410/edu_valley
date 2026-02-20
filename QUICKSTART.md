# Quick Start Guide - Excellence Academy Website

## � Docker Setup (Easiest & Recommended)

### Prerequisites
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop/))

### Start in 2 Commands
```powershell
# 1. Build and start everything
docker-compose up -d

# 2. Seed sample data (optional)
docker-compose exec backend python seed_data.py
```

### Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Admin Panel**: http://localhost/admin

### Stop the Application
```powershell
docker-compose down
```

### Helper Scripts
- `docker-start.bat` - Start production containers
- `docker-start-dev.bat` - Start with hot-reload
- `docker-stop.bat` - Stop containers
- `docker-seed.bat` - Seed database

---

## 💻 Manual Setup (Without Docker)

## �🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies
Run the setup script to install all required packages:
```powershell
.\setup.bat
```

This will:
- Install Python packages for the backend
- Install Node.js packages for the frontend

### Step 2: Seed Sample Data (Optional but Recommended)
Populate the database with sample data:
```powershell
.\seed.bat
```

This adds:
- Sample events
- Faculty members
- Gallery images
- Announcements

### Step 3: Start the Application
Run both servers at once:
```powershell
.\start.bat
```

This will open two terminal windows:
- **Backend**: http://localhost:8000 (FastAPI)
- **Frontend**: http://localhost:3000 (React)

## 📱 Access the Website

Open your browser and go to:
**http://localhost:3000**

## 🎯 Features to Explore

### Public Pages
1. **Home** - Hero, announcements, events, statistics
2. **About** - School history, mission, vision, values
3. **Academics** - Programs and curriculum
4. **Admissions** - Application process and requirements
5. **Faculty** - Staff directory
6. **Events** - Upcoming and past events
7. **Gallery** - Photo gallery with filters
8. **Contact** - Contact form

### Admin Dashboard
Navigate to: **http://localhost:3000/admin**

Here you can:
- ✅ Add/Delete Events
- ✅ Manage Announcements
- ✅ Add/Delete Faculty Members
- ✅ Manage Gallery Images
- ✅ View Contact Form Submissions

## 🔧 Manual Setup (Alternative)

If the batch scripts don't work, follow these steps:

### Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
python main.py
```

### Frontend (in a new terminal)
```powershell
cd frontend
npm install
npm run dev
```

## 🛠️ Troubleshooting

### Backend won't start
- Make sure Python 3.8+ is installed: `python --version`
- Check if port 8000 is available
- Try: `pip install --upgrade pip` then reinstall dependencies

### Frontend won't start
- Make sure Node.js 16+ is installed: `node --version`
- Delete `node_modules` folder and run `npm install` again
- Check if port 3000 is available

### CORS errors
- Make sure backend is running before frontend
- Check that backend URL in frontend code is `http://localhost:8000`

### Database errors
- Delete `school.db` in backend folder
- Run `seed.bat` again to recreate database

## 📝 Development Commands

### Backend
```powershell
cd backend
python main.py          # Start server
python seed_data.py     # Seed database
```

### Frontend
```powershell
cd frontend
npm run dev            # Development server
npm run build          # Build for production
npm run preview        # Preview production build
```

## 🎨 Customization Tips

### Change School Name
1. Edit [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx)
2. Edit [frontend/index.html](frontend/index.html) - Update title and meta tags

### Change Colors
Edit CSS variables in [frontend/src/index.css](frontend/src/index.css):
```css
:root {
  --primary-color: #1e40af;    /* Main color */
  --secondary-color: #3b82f6;  /* Secondary color */
  --accent-color: #fbbf24;     /* Accent color */
}
```

### Add School Logo
1. Add logo image to `frontend/public/`
2. Update Navbar component to use the logo

## 📊 Database Management

### View Database
The SQLite database is located at: `backend/school.db`

You can use tools like:
- DB Browser for SQLite
- SQLite Studio
- VS Code SQLite extensions

### Reset Database
```powershell
cd backend
del school.db
python seed_data.py
```

## 🌐 Deployment

### Backend (FastAPI)
- Deploy to: Heroku, Railway, Render, or any Python hosting
- Update CORS origins for your production domain
- Use PostgreSQL or MySQL for production database

### Frontend (React)
- Deploy to: Vercel, Netlify, GitHub Pages
- Update API URL in frontend code
- Run `npm run build` to create production build

## 💡 Tips

1. **Test Responsiveness**: Resize browser window to see mobile/tablet views
2. **Admin Panel**: Use to quickly add content without manual database edits
3. **Contact Form**: Submissions appear in Admin Dashboard under "Messages"
4. **API Documentation**: Visit http://localhost:8000/docs for auto-generated API docs

## 🎓 Learning Resources

- **React**: https://react.dev/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Vite**: https://vitejs.dev/
- **SQLAlchemy**: https://www.sqlalchemy.org/

## ❓ Need Help?

Check the main [README.md](README.md) for detailed documentation.

---

**Enjoy building with Excellence Academy! 🎉**
