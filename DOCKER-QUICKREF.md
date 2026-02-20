# Excellence Academy - Docker Quick Reference

## 🚀 Quick Commands

### Start Application (Production)
```powershell
docker-compose up -d
```
- Frontend: http://localhost
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Start Application (Development)
```powershell
docker-compose -f docker-compose.dev.yml up
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Hot-reload enabled for both services

### Stop Application
```powershell
docker-compose down
```

### View Logs
```powershell
docker-compose logs -f
```

### Seed Database
```powershell
docker-compose exec backend python seed_data.py
```

## 📋 Common Tasks

### Rebuild Images
```powershell
docker-compose build --no-cache
```

### Restart Services
```powershell
docker-compose restart
```

### Remove Everything
```powershell
docker-compose down -v --rmi all
```

### Check Status
```powershell
docker-compose ps
```

### Execute Commands
```powershell
# Backend shell
docker-compose exec backend bash

# Frontend shell  
docker-compose exec frontend sh
```

## 🔧 Troubleshooting

### Port Conflicts
Edit ports in `docker-compose.yml`:
```yaml
ports:
  - "8080:8000"  # Change host port
  - "3000:80"
```

### Reset Database
```powershell
docker-compose down -v
docker-compose up -d
docker-compose exec backend python seed_data.py
```

### View Container Logs
```powershell
docker-compose logs backend
docker-compose logs frontend
```

## 📚 Full Documentation
See [DOCKER.md](DOCKER.md) for complete guide.
