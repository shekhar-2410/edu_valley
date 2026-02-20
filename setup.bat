@echo off
echo ================================
echo Excellence Academy Website Setup
echo ================================
echo.

echo [1/4] Setting up Backend...
cd backend
echo Installing Python dependencies...
pip install -r requirements.txt
echo.

echo [2/4] Setting up Frontend...
cd ..\frontend
echo Installing Node dependencies...
call npm install
echo.

echo ================================
echo Setup Complete!
echo ================================
echo.
echo To run the application:
echo 1. Backend: cd backend && python main.py
echo 2. Frontend: cd frontend && npm run dev
echo.
echo Or run: start.bat
echo.
pause
