@echo off
echo ================================
echo Seeding Database in Docker
echo ================================
echo.

docker-compose exec backend python seed_data.py

echo.
echo Done!
pause
