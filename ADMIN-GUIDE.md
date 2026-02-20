# Admin Panel Documentation

## Overview

The School Website Admin Panel provides a secure, intuitive interface for managing all website content including events, announcements, faculty, gallery images, and contact messages.

## Features

### 🔐 **Authentication**
- Secure JWT-based authentication system
- Token-based authorization for all administrative actions (POST, PUT, DELETE)
- Protected frontend routes with automatic login redirection
- Backend dependency injection for unauthorized access prevention

### ✏️ **Full CRUD Operations**
- **Create**: Add new content across all sections
- **Read**: View all existing content in organized tables
- **Update**: Edit existing content with pre-filled forms
- **Delete**: Remove content with confirmation dialogs

### 📱 **Content Management Sections**

1. **Events Management**
   - Add/Edit/Delete events
   - Fields: Title, Description, Date, Location, Image URL
   - Displays upcoming and past events

2. **Announcements Management**
   - Add/Edit/Delete announcements
   - Fields: Title, Content, Priority (High/Normal/Low)
   - Priority-based visual badges

3. **Faculty Management**
   - Add/Edit/Delete faculty members
   - Fields: Name, Position, Department, Email, Phone, Bio, Image URL
   - Departmental organization

4. **Gallery Management**
   - Add/Edit/Delete images
   - Fields: Title, Image URL, Category, Description
   - Category-based filtering

5. **Messages/Contacts**
   - View contact form submissions
   - Full message details modal
   - Delete processed messages

## Access Information

### Login Credentials

**URL**: `http://localhost/admin-login` (or `http://localhost:80/admin-login`)

**System Administrator**: `admin@nev.edu`  
**Password**: `admin123`

**School Director**: `director@nev.edu`  
**Password**: `admin123`

> ⚠️ **IMPORTANT**: Change these credentials for production use!

## How to Use

### 1. Login Process

1. Navigate to `/admin-login`
2. Enter email: `admin@nev.edu`
3. Enter password: `admin123`
4. Click "Authorize Access"
5. You'll be redirected to the secure admin dashboard

### 2. Managing Content

#### Adding New Content

1. Click the **"Add New"** button in the header
2. Fill out the form fields
3. Click **"Save"** or the specific save button (e.g., "Save Event")
4. The form will close and the table will refresh

#### Editing Existing Content

1. Find the item you want to edit in the table
2. Click the **blue edit button** (pencil icon)
3. The form will open with pre-filled data
4. Modify the fields as needed
5. Click **"Update"** to save changes

#### Deleting Content

1. Find the item you want to delete
2. Click the **red delete button** (trash icon)
3. Confirm the deletion in the dialog
4. The item will be removed immediately

### 3. Logout

Click the **"Logout"** button in the top-right corner of the admin header.

## API Integration

The admin panel communicates with the backend API through the following endpoints:

### API Endpoints

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Events | `/api/events` | GET, POST, PUT, DELETE |
| Announcements | `/api/announcements` | GET, POST, PUT, DELETE |
| Faculty | `/api/faculty` | GET, POST, PUT, DELETE |
| Gallery | `/api/gallery` | GET, POST, PUT, DELETE |
| Contacts | `/api/contacts` | GET, DELETE |

### Configuration

The API URL is configured through environment variables:

**Development**: `VITE_API_URL=http://localhost:8000`  
**Docker**: Automatically configured to `http://localhost:8000`

To change the API URL, update:
- **File**: `frontend/.env`
- **Docker**: `docker-compose.yml` under frontend build args

## Security Features

### Current Implementation

- **Client-side authentication** using localStorage
- **Protected routes** with automatic redirects
- **CORS enabled** on the backend for cross-origin requests

### Recommended Enhancements for Production

1. **JWT Authentication** (Implemented ✅)
   - Using `python-jose` for secure token generation
   - Using `passlib[bcrypt]` for password hashing
   - Tokens expire after 60 minutes for security

2. **User Database** (Implemented ✅)
   - Passwords stored as Bcrypt hashes in `AdminUser` table
   - `is_admin` flag determines access levels

3. **HTTPS**
   - Enable SSL/TLS certificates
   - Use secure cookies
   - Implement CSRF protection

4. **Rate Limiting**
   - Limit login attempts
   - Add API rate limiting

## Customization

Authorization is handled via the `/api/auth/login` endpoint which returns a JWT access token. This token is stored in the browser and sent in the `Authorization: Bearer <token>` header for all content management operations.

### Adding New Fields

1. Update the model in [backend/models.py](backend/models.py)
2. Update the schema in [backend/schemas.py](backend/schemas.py)
3. Add form fields in the corresponding manager component
4. Run database migration if needed

### Styling

Admin panel styles are located in [Admin.css](frontend/src/pages/Admin.css):

- `.btn-edit`: Edit button styling
- `.btn-delete`: Delete button styling
- `.admin-form`: Form container styling
- `.data-table`: Table styling

## Troubleshooting

### Login Issues

**Problem**: Login doesn't work  
**Solution**: 
- Check browser console for errors
- Verify credentials match in code
- Clear localStorage: `localStorage.clear()`

### API Connection Issues

**Problem**: API calls fail  
**Solution**:
- Verify backend is running: `http://localhost:8000`
- Check API URL in `frontend/src/config/api.js`
- Verify CORS settings in `backend/main.py`

### Form Not Submitting

**Problem**: Forms don't save data  
**Solution**:
- Check browser console for errors
- Verify all required fields are filled
- Check API endpoint responses in Network tab

### Edit Button Not Working

**Problem**: Edit button doesn't populate form  
**Solution**:
- Verify `editingId` state is being set
- Check that form data is being populated correctly
- Look for console errors

## Database Seeding

To populate the database with sample data:

```bash
# Local Development
cd backend
python seed_data.py

# Docker
docker exec -it school-backend python seed_data.py
# OR
docker-compose exec backend python seed_data.py
```

## File Structure

```
frontend/src/
├── config/
│   └── api.js                 # API configuration
├── pages/
│   ├── Admin.jsx              # Main admin dashboard
│   ├── Admin.css              # Admin styles
│   ├── AdminLogin.jsx         # Login page
│   └── AdminLogin.css         # Login styles
└── App.jsx                    # Route protection

backend/
├── main.py                    # API endpoints
├── models.py                  # Database models
└── schemas.py                 # Pydantic schemas
```

## Best Practices

1. **Always logout** when finished
2. **Double-check** before deleting content
3. **Use descriptive titles** for better organization
4. **Add images** using full URLs (https://...)
5. **Test changes** on the public site
6. **Back up data** before major updates
7. **Keep credentials secure** and private

## Support

For issues or questions:
1. Check the logs: `docker-compose logs frontend` or `docker-compose logs backend`
2. Review the browser console for errors
3. Verify all services are running: `docker-compose ps`
4. Restart services if needed: `docker-compose restart`

## Future Enhancements

Potential features for future development:

- [ ] Multi-user support with roles (Super Admin, Editor, Viewer)
- [ ] Image upload functionality (instead of URLs)
- [ ] Rich text editor for content
- [ ] Activity logs and audit trail
- [ ] Bulk operations (delete multiple items)
- [ ] Content preview before publishing
- [ ] Schedule posts for future publication
- [ ] Email notifications for new contact messages
- [ ] Dashboard analytics (page views, popular content)
- [ ] Search and filter functionality in tables

---

## Quick Reference

| Action | Steps |
|--------|-------|
| Login | Navigate to `/admin-login` → Enter credentials → Login |
| Add Content | Click "Add New" → Fill form → Save |
| Edit Content | Click edit icon → Modify → Update |
| Delete Content | Click delete icon → Confirm |
| Logout | Click "Logout" button |
| View Messages | Go to Messages tab → Click "View" on message |

---

**Last Updated**: February 2026  
**Version**: 1.0.0
