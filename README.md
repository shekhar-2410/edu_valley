# Excellence Academy - School Website

A comprehensive, full-stack school management website built with React (frontend) and FastAPI (backend), featuring a responsive design for both desktop and mobile devices.

## Features

### Frontend (React + Vite)
- **Home Page**: Hero section, announcements, upcoming events, statistics
- **About Page**: School history, mission, vision, core values, achievements
- **Academics Page**: Programs, grade levels, academic features
- **Admissions Page**: Application process, requirements, financial aid information
- **Faculty Page**: Staff directory with detailed profiles
- **Events Page**: Calendar of upcoming and past events
- **Gallery Page**: Photo gallery with category filtering
- **Contact Page**: Contact form with school information
- **Admin Dashboard**: Content management system for all sections

### Backend (FastAPI + SQLite)
- RESTful API endpoints
- SQLite database for data persistence
- CRUD operations for:
  - Events
  - Faculty members
  - Gallery images
  - Contact messages
  - Announcements

### Key Features
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Modern, user-friendly interface
- ✅ Admin panel for content management
- ✅ Dynamic content loading from database
- ✅ Form validation and error handling
- ✅ Clean and maintainable code structure

## Tech Stack

### Frontend
- React 18
- React Router DOM for navigation
- Vite for fast development
- Lucide React for icons
- Axios for API calls
- CSS3 with responsive design

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite database
- Pydantic for data validation
- Uvicorn server
- CORS middleware

## Installation & Setup

### 🐳 **Docker Deployment (Recommended)**

The easiest way to run the application is using Docker:

#### Quick Start with Docker
```powershell
# Build and start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost
# Backend: http://localhost:8000
```

#### Seed Sample Data
```powershell
docker-compose exec backend python seed_data.py
```

For detailed Docker instructions, see [DOCKER.md](DOCKER.md)

### 💻 **Manual Setup (Alternative)**

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- **(Optional)** Docker & Docker Compose

### Backend Setup

1. Navigate to the backend directory:
```powershell
cd backend
```

2. Create a virtual environment (recommended):
```powershell
python -m venv venv
.\venv\Scripts\activate
```

3. Install Python dependencies:
```powershell
pip install -r requirements.txt
```

4. Start the FastAPI server:
```powershell
python main.py
```

The backend API will be running at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```powershell
cd frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

The frontend will be running at `http://localhost:3000`

## Deployment Options

### 🐳 Docker (Recommended)

#### Production Mode
```powershell
docker-compose up -d              # Start services
docker-compose logs -f            # View logs
docker-compose down               # Stop services
```

#### Development Mode (with hot-reload)
```powershell
docker-compose -f docker-compose.dev.yml up
```

#### Helper Scripts
- `docker-build.bat` - Build Docker images
- `docker-start.bat` - Start production containers
- `docker-start-dev.bat` - Start development containers
- `docker-stop.bat` - Stop all containers
- `docker-seed.bat` - Seed database in Docker

See [DOCKER.md](DOCKER.md) for complete Docker documentation.

## Project Structure

```
school-website/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # Database configuration
│   ├── seed_data.py         # Sample data seeder
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Docker image definition
│   ├── .dockerignore        # Docker ignore file
│   └── school.db           # SQLite database (auto-generated)
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Navbar.css
│   │   │   ├── Footer.jsx
│   │   │   └── Footer.css
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Home.css
│   │   │   ├── About.jsx
│   │   │   ├── About.css
│   │   │   ├── Academics.jsx
│   │   │   ├── Academics.css
│   │   │   ├── Admissions.jsx
│   │   │   ├── Admissions.css
│   │   │   ├── Faculty.jsx
│   │   │   ├── Faculty.css
│   │   │   ├── Events.jsx
│   │   │   ├── Events.css
│   │   │   ├── Gallery.jsx
│   │   │   ├── Gallery.css
│   │   │   ├── Contact.jsx
│   │   │   ├── Contact.css
│   │   │   ├── Admin.jsx
│   │   │   └── Admin.css
│   │   ├── App.jsx          # Main app component with routing
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf           # Nginx configuration for production
│   ├── Dockerfile           # Production Docker image
│   ├── Dockerfile.dev       # Development Docker image
│   └── .dockerignore        # Docker ignore file
│
├── docker-compose.yml       # Production Docker Compose
├── docker-compose.dev.yml   # Development Docker Compose
├── README.md                # Main documentation
├── DOCKER.md                # Docker deployment guide
├── QUICKSTART.md            # Quick start guide
├── .gitignore               # Git ignore file
│
└── Helper Scripts:
    ├── setup.bat            # Install dependencies
    ├── start.bat            # Start both servers
    ├── seed.bat             # Seed database
    ├── docker-build.bat     # Build Docker images
    ├── docker-start.bat     # Start Docker containers
    ├── docker-start-dev.bat # Start Docker (dev mode)
    ├── docker-stop.bat      # Stop Docker containers
    └── docker-seed.bat      # Seed database in Docker
```

## API Endpoints

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `DELETE /api/events/{id}` - Delete event

### Faculty
- `GET /api/faculty` - Get all faculty members
- `POST /api/faculty` - Create new faculty member
- `DELETE /api/faculty/{id}` - Delete faculty member

### Gallery
- `GET /api/gallery` - Get all gallery images
- `POST /api/gallery` - Add new image
- `DELETE /api/gallery/{id}` - Delete image

### Contacts
- `GET /api/contacts` - Get all contact messages
- `POST /api/contacts` - Submit contact form
- `DELETE /api/contacts/{id}` - Delete contact message

### Announcements
- `GET /api/announcements` - Get all announcements
- `POST /api/announcements` - Create announcement
- `DELETE /api/announcements/{id}` - Delete announcement

## Usage

### For Users
1. Browse through different pages using the navigation menu
2. View upcoming events and announcements on the home page
3. Learn about the school, academics, and faculty
4. Submit inquiries through the contact form
5. Apply for admission through the admissions page

### For Administrators
1. Access the admin dashboard at `/admin`
2. **Login Credentials**:
   - Email: `admin@nev.edu`
   - Password: `admin123`
3. Add, edit, or delete:
   - Events
   - Announcements
   - Faculty members
   - Gallery images
4. View and manage contact form submissions

## Responsive Design

The website is fully responsive and optimized for:
- **Desktop**: Full-width layout with multiple columns
- **Tablet**: Adjusted grid layouts for optimal viewing
- **Mobile**: Single-column layout with hamburger menu navigation

## Customization

### Changing Colors
Edit CSS variables in `frontend/src/index.css`:
```css
:root {
  --primary-color: #1e40af;
  --secondary-color: #3b82f6;
  --accent-color: #fbbf24;
  /* ... other colors */
}
```

### Adding New Pages
1. Create new component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Add navigation link in `frontend/src/components/Navbar.jsx`

### Database Schema
Modify models in `backend/models.py` and restart the server to auto-create new tables.

## Future Enhancements

Potential features to add:
- [ ] User authentication and authorization
- [ ] Student portal for grades and assignments
- [ ] Online payment integration
- [ ] Email notifications
- [ ] Blog/News section
- [ ] File upload functionality
- [ ] Multi-language support
- [ ] Dark mode theme

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for Excellence Academy**
