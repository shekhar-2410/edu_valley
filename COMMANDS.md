# Excellence Academy - Command Reference

## 🚀 Quick Start

### Docker (Recommended)
```bash
docker-compose up -d                    # Start production
docker-compose exec backend python seed_data.py  # Seed data
```

### Manual
```bash
# Backend
cd backend && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt && python main.py

# Frontend
cd frontend && npm install && npm run dev
```

## 📋 All Commands

### 🐳 Docker Commands

#### Production
| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start all services in background |
| `docker-compose up --build` | Rebuild and start |
| `docker-compose down` | Stop all services |
| `docker-compose down -v` | Stop and remove volumes |
| `docker-compose ps` | Check service status |
| `docker-compose logs -f` | Follow all logs |
| `docker-compose logs backend` | View backend logs |
| `docker-compose logs frontend` | View frontend logs |
| `docker-compose restart` | Restart all services |
| `docker-compose restart backend` | Restart backend only |

#### Development
| Command | Description |
|---------|-------------|
| `docker-compose -f docker-compose.dev.yml up` | Start with hot-reload |
| `docker-compose -f docker-compose.dev.yml down` | Stop dev environment |

#### Management
| Command | Description |
|---------|-------------|
| `docker-compose build` | Build all images |
| `docker-compose build --no-cache` | Build without cache |
| `docker-compose pull` | Pull latest images |
| `docker-compose exec backend bash` | Enter backend shell |
| `docker-compose exec frontend sh` | Enter frontend shell |
| `docker-compose exec backend python seed_data.py` | Seed database |

#### Cleanup
| Command | Description |
|---------|-------------|
| `docker-compose down --rmi all` | Remove everything |
| `docker system prune -a` | Clean up Docker |
| `docker volume prune` | Remove unused volumes |
| `docker image prune` | Remove unused images |

### 💻 Manual Development Commands

#### Backend
| Command | Description |
|---------|-------------|
| `cd backend` | Navigate to backend |
| `python -m venv venv` | Create virtual environment |
| `.\venv\Scripts\activate` | Activate venv (Windows) |
| `source venv/bin/activate` | Activate venv (Linux/Mac) |
| `pip install -r requirements.txt` | Install dependencies |
| `python main.py` | Start FastAPI server |
| `python seed_data.py` | Seed sample data |
| `uvicorn main:app --reload` | Start with auto-reload |
| `deactivate` | Deactivate venv |

#### Frontend
| Command | Description |
|---------|-------------|
| `cd frontend` | Navigate to frontend |
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### 🔧 Utility Commands

#### Database
| Command | Description |
|---------|-------------|
| `sqlite3 backend/school.db` | Open database |
| `docker-compose exec backend sqlite3 school.db` | Open DB in Docker |

#### Helper Scripts (Windows)
| Script | Description |
|--------|-------------|
| `setup.bat` | Install all dependencies |
| `start.bat` | Start both servers manually |
| `seed.bat` | Seed database manually |
| `docker-build.bat` | Build Docker images |
| `docker-start.bat` | Start Docker prod |
| `docker-start-dev.bat` | Start Docker dev |
| `docker-stop.bat` | Stop Docker containers |
| `docker-seed.bat` | Seed database in Docker |

#### Helper Scripts (Linux/Mac)
| Script | Description |
|--------|-------------|
| `./docker-build.sh` | Build Docker images |
| `./docker-start.sh` | Start Docker prod |
| `./docker-stop.sh` | Stop Docker containers |

### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend (Manual) | http://localhost:3000 | React dev server |
| Frontend (Docker) | http://localhost | Nginx production |
| Backend | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger UI |
| API Redoc | http://localhost:8000/redoc | ReDoc UI |
| Admin Panel | http://localhost:3000/admin | Content management |

### 🔍 Monitoring Commands

| Command | Description |
|---------|-------------|
| `docker stats` | Resource usage |
| `docker-compose top` | Process list |
| `docker inspect school-backend` | Container details |
| `docker inspect school-frontend` | Container details |

### 🧪 Testing Commands

| Command | Description |
|---------|-------------|
| `curl http://localhost:8000/` | Test backend |
| `curl http://localhost:8000/api/events` | Test API endpoint |
| `curl http://localhost/` | Test frontend |

### 📊 Status Checks

| Command | Description |
|---------|-------------|
| `docker-compose ps` | Service status |
| `docker ps` | Running containers |
| `docker images` | List images |
| `docker volume ls` | List volumes |
| `docker network ls` | List networks |

## 🎯 Common Workflows

### First Time Setup (Docker)
```bash
git clone <repository>
cd school-website
docker-compose up -d --build
docker-compose exec backend python seed_data.py
# Visit http://localhost
```

### First Time Setup (Manual)
```bash
git clone <repository>
cd school-website
.\setup.bat
.\seed.bat
.\start.bat
# Visit http://localhost:3000
```

### Daily Development (Docker)
```bash
docker-compose -f docker-compose.dev.yml up
# Edit code (auto-reloads)
# Ctrl+C to stop
```

### Daily Development (Manual)
```bash
# Terminal 1
cd backend && .\venv\Scripts\activate && python main.py

# Terminal 2
cd frontend && npm run dev
```

### Deploy Update (Docker)
```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Reset Everything
```bash
docker-compose down -v --rmi all
docker system prune -a
docker-compose up -d --build
docker-compose exec backend python seed_data.py
```

## 🆘 Emergency Commands

### Backend Won't Start
```bash
docker-compose logs backend
docker-compose restart backend
docker-compose down && docker-compose up -d
```

### Frontend Won't Start
```bash
docker-compose logs frontend
docker-compose restart frontend
docker-compose build --no-cache frontend
```

### Database Corrupted
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python seed_data.py
```

### Port Conflicts
```bash
# Stop conflicting services
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :80

# Or change ports in docker-compose.yml
```

### Out of Disk Space
```bash
docker system prune -a
docker volume prune
```

## 📝 Quick Reference Card

```
╔════════════════════════════════════════════╗
║     Excellence Academy - Quick Commands    ║
╠════════════════════════════════════════════╣
║ START (Docker):   docker-compose up -d     ║
║ STOP (Docker):    docker-compose down      ║
║ LOGS:             docker-compose logs -f   ║
║ SEED:             docker-seed.bat          ║
║ STATUS:           docker-compose ps        ║
║                                            ║
║ Frontend:         http://localhost         ║
║ Backend:          http://localhost:8000    ║
║ Admin:            http://localhost/admin   ║
╚════════════════════════════════════════════╝
```

---

**Save this file for quick reference! 📌**
