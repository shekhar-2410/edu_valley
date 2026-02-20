# Docker Deployment Guide

## 🐳 Docker Setup

This application is fully containerized with Docker and Docker Compose for easy deployment.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+

### Install Docker Desktop
- **Windows**: https://docs.docker.com/desktop/install/windows-install/
- **Mac**: https://docs.docker.com/desktop/install/mac-install/
- **Linux**: https://docs.docker.com/engine/install/

## Quick Start

### Production Deployment

1. **Build and start all services**:
```powershell
docker-compose up -d
```

2. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

3. **Stop all services**:
```powershell
docker-compose down
```

### Development Mode

For development with hot-reloading:

```powershell
docker-compose -f docker-compose.dev.yml up
```

This will:
- Enable hot-reload for both frontend and backend
- Mount local files as volumes for live editing
- Run backend with `--reload` flag
- Run frontend with Vite dev server

## Docker Commands

### Build Services
```powershell
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### Start Services
```powershell
# Start in foreground (see logs)
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Start specific service
docker-compose up backend
```

### Stop Services
```powershell
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers, volumes, and images
docker-compose down -v --rmi all
```

### View Logs
```powershell
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Execute Commands in Containers
```powershell
# Backend container
docker-compose exec backend bash
docker-compose exec backend python seed_data.py

# Frontend container
docker-compose exec frontend sh
```

### Check Service Status
```powershell
# List running services
docker-compose ps

# Check service health
docker-compose ps
```

## Architecture

### Services

#### Backend (FastAPI)
- **Image**: Python 3.11 slim
- **Port**: 8000
- **Volume**: Backend data persisted
- **Health Check**: HTTP check on port 8000

#### Frontend (React + Nginx)
- **Build**: Multi-stage build (Node.js → Nginx)
- **Port**: 80
- **Server**: Nginx for production serving
- **Optimization**: Gzip, caching, security headers

### Networking
- Internal network: `school-network`
- Services communicate through container names
- Frontend can access backend at `http://backend:8000`

### Volumes
- `backend-data`: Persists database and application data

## Configuration Files

### docker-compose.yml (Production)
- Production-optimized builds
- Nginx for frontend serving
- Health checks enabled
- Auto-restart on failure

### docker-compose.dev.yml (Development)
- Hot-reload enabled
- Volume mounts for live editing
- Development servers running
- No build optimization

### Dockerfiles

#### backend/Dockerfile
```dockerfile
FROM python:3.11-slim
# Install Python dependencies
# Copy application code
# Run with uvicorn
```

#### frontend/Dockerfile (Production)
```dockerfile
# Stage 1: Build with Node.js
FROM node:18-alpine AS builder
# Install and build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy built files
# Configure Nginx
```

#### frontend/Dockerfile.dev (Development)
```dockerfile
FROM node:18-alpine
# Run Vite dev server with hot-reload
```

## Database Management

### Seed Database in Docker
```powershell
docker-compose exec backend python seed_data.py
```

### Access Database
```powershell
docker-compose exec backend bash
# Inside container
sqlite3 school.db
```

### Backup Database
```powershell
docker cp school-backend:/app/school.db ./backup_school.db
```

### Restore Database
```powershell
docker cp ./backup_school.db school-backend:/app/school.db
```

## Environment Variables

Create `.env` file in root directory:
```env
# Backend
BACKEND_PORT=8000

# Frontend
FRONTEND_PORT=80
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Port Already in Use
```powershell
# Change ports in docker-compose.yml
ports:
  - "8080:8000"  # Change 8000 to 8080
  - "3000:80"    # Change 80 to 3000
```

### Container Not Starting
```powershell
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Permission Issues (Linux)
```bash
sudo chown -R $USER:$USER .
```

### Reset Everything
```powershell
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Cannot Connect to Backend from Frontend
- Check CORS settings in `backend/main.py`
- Verify network configuration
- Check if backend is healthy: `docker-compose ps`

## Production Deployment

### Deploy to Cloud

#### Using Docker Hub
```powershell
# Build and tag images
docker build -t yourusername/school-backend:latest ./backend
docker build -t yourusername/school-frontend:latest ./frontend

# Push to Docker Hub
docker push yourusername/school-backend:latest
docker push yourusername/school-frontend:latest

# Pull and run on server
docker pull yourusername/school-backend:latest
docker pull yourusername/school-frontend:latest
```

#### Deploy to AWS ECS, GCP Cloud Run, or Azure Container Instances
- Use the Dockerfiles provided
- Configure environment variables
- Set up load balancer for frontend
- Use managed database (RDS, Cloud SQL) instead of SQLite

### Production Checklist
- [ ] Change CORS origins to specific domains
- [ ] Use environment variables for sensitive data
- [ ] Set up SSL/TLS certificates
- [ ] Use managed database service
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging
- [ ] Enable auto-scaling
- [ ] Configure CDN for frontend assets

## Performance Optimization

### Frontend
- Nginx serves static files
- Gzip compression enabled
- Browser caching configured
- Security headers added

### Backend
- Slim Python image for smaller size
- Dependencies cached in Docker layers
- Health checks for reliability

## Monitoring

### View Resource Usage
```powershell
docker stats
```

### Check Logs
```powershell
# Real-time logs
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail=50
```

## Scaling

### Scale Services
```powershell
# Run multiple backend instances
docker-compose up -d --scale backend=3
```

### Load Balancing
Add a load balancer service in docker-compose.yml:
```yaml
nginx-lb:
  image: nginx:alpine
  ports:
    - "80:80"
  depends_on:
    - backend
```

## cleanup

```powershell
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a
```

## Support

For issues related to Docker deployment, check:
1. Docker logs: `docker-compose logs`
2. Container status: `docker-compose ps`
3. System resources: `docker stats`

---

**Happy Dockerizing! 🐳**
