@echo off
echo ========================================
echo Starting LiveKit Voice Agent Services
echo ========================================
echo.

REM Check if Node.js is installed
where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js/npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python/uv is available
where uv >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: uv not found in PATH. Make sure Python is installed.
)

echo [1/3] Starting LiveKit Server...
start "LiveKit Server" cmd /k "echo Starting LiveKit Server... && npx livekit-server --dev"
timeout /t 5 /nobreak >nul

echo [2/3] Starting Backend Agent...
cd backend
start "Backend Agent" cmd /k "echo Starting Backend Agent... && python -m uv run python src/agent.py dev"
cd ..
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend...
cd frontend
start "Frontend" cmd /k "echo Starting Frontend... && pnpm dev"
cd ..

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo LiveKit Server: http://localhost:7880
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit (services will continue running)...
pause >nul

