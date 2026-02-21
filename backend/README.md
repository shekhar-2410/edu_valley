# School Management API

Backend API for School Management Website.

## Deployment on Render (Option A: No Docker)

1. **New Web Service**: Connect your GitHub repo.
2. **Environment**: Python
3. **Build Command**: `pip install -r backend/api/requirements.txt`
4. **Start Command**: `uvicorn backend.api.index:app --host 0.0.0.0 --port 10000`
5. **Environment Variables**:
   - `DATABASE_URL`: Your Supabase PostgreSQL URL (ensure `sslmode=require` is added)
   - `SECRET_KEY`: A random secret string for JWT

Note: If you set the **Root Directory** to `backend` in Render settings, then use:
- **Build Command**: `pip install -r api/requirements.txt`
- **Start Command**: `uvicorn api.index:app --host 0.0.0.0 --port 10000`
