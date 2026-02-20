@echo off
echo ========================================
echo Starting Excellence Academy Website
echo ========================================
echo.

echo Starting Backend Server (FastAPI)...
start "Backend Server" cmd /k "cd backend && python main.py"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server (React + Vite)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to stop all servers...
pause > nul

taskkill /FI "WindowTitle eq Backend Server*" /T /F
taskkill /FI "WindowTitle eq Frontend Server*" /T /F
