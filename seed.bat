@echo off
echo ================================
echo Seeding Database with Sample Data
echo ================================
echo.

cd backend
python seed_data.py

echo.
echo Done!
pause
