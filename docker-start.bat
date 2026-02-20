@echo off
echo ================================
echo Starting Excellence Academy
echo (Docker Production Mode)
echo ================================
echo.

echo Building and starting containers...
docker-compose up -d --build

echo.
echo ================================
echo Waiting for services to start...
timeout /t 5 /nobreak > nul

docker-compose ps

echo.
echo ================================
echo Services Started!
echo ================================
echo.
echo Frontend: http://localhost
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo To view logs: docker-compose logs -f
echo To stop:      docker-compose down
echo.
echo ================================
pause
