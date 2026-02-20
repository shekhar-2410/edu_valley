@echo off
echo ================================
echo Starting Excellence Academy
echo (Docker Development Mode)
echo ================================
echo.

echo Building and starting containers...
docker-compose -f docker-compose.dev.yml up --build

echo.
echo ================================
