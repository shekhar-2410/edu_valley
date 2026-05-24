# Narendra Edu Valley - School Website and ERP

A full-stack school website and lightweight ERP for Narendra Edu Valley, built with React/Vite on the frontend and FastAPI/SQLAlchemy on the backend.

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

### Backend (FastAPI + SQLAlchemy)
- RESTful API endpoints
- Database configured through `DATABASE_URL` for PostgreSQL or SQLite
- CRUD operations for:
  - Events
  - Faculty members
  - Gallery images
  - Contact messages
  - Announcements
- ERP workflows for students, teachers, and guardians:
  - Fees, receipts, and Razorpay order verification
  - Attendance, marks, leaves, messages, timetable, and analytics

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

### Prerequisites
- Python 3.10 or higher
- Node.js 20.x
- npm
- A `DATABASE_URL` value, for example `sqlite:///./school.db` for local development

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

4. Configure environment variables:
```powershell
$env:DATABASE_URL="sqlite:///./school.db"
$env:SECRET_KEY="replace-with-a-local-secret"
```

5. Start the FastAPI server:
```powershell
python main.py
```

The backend API will be running at `http://localhost:8000`

### Frontend Setup

1. Install dependencies from the project root:
```powershell
npm install
```

2. Point the frontend at the backend API:
```powershell
$env:VITE_API_URL="http://localhost:8000"
```

3. Start the development server from the project root:
```powershell
npm run dev
```

The frontend will be running at `http://localhost:3000`

## Deployment Notes

- Set `VITE_API_URL` in the frontend deployment when the backend is hosted on a different origin.
- Set `SECRET_KEY` in production; the backend refuses to start in production without it.
- Set `BACKEND_PUBLIC_URL` or `RENDER_EXTERNAL_URL` so uploaded image URLs resolve correctly from the public website.
- Keep demo setup disabled in production. `/setup-db` requires `ALLOW_DEMO_SETUP=true` and explicit `DEMO_*_PASSWORD` values.

## Project Structure

```
edu_valley/
├── backend/
│   ├── main.py              # FastAPI app and routes
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # DATABASE_URL engine/session setup
│   └── requirements.txt     # Python dependencies
├── public/
│   ├── images/              # Public website images and logo assets
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   └── prerender.mjs        # Optional static prerender script
├── src/
│   ├── components/          # Shared React components
│   ├── config/              # API, contact, SEO config
│   ├── locales/             # English/Hindi translations
│   ├── pages/               # Public, admin, and ERP routes
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
├── vercel.json
└── README.md
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
2. Use the administrator account provisioned for your environment. Demo setup requires `ALLOW_DEMO_SETUP=true` and explicit `DEMO_*_PASSWORD` values.
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
