@echo off
REM Start Day 3 Wellness Agent (Apollo Pharmacy)
REM Usage: start_day3.bat

echo Starting Day 3 Wellness Agent (Apollo Pharmacy)...

REM Source uv environment if available
if exist "%USERPROFILE%\.local\bin\uv.exe" (
    set PATH=%USERPROFILE%\.local\bin;%PATH%
)

REM Check if livekit-server is available
where livekit-server >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: livekit-server is not installed or not in PATH
    echo Please install livekit-server
    pause
    exit /b 1
)

REM Check if uv is available
where uv >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: uv is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting LiveKit server...
start "LiveKit Server" cmd /k livekit-server --dev

timeout /t 2 /nobreak >nul

echo Starting backend agent (Day 3 - Apollo Pharmacy Wellness Agent)...
start "Backend Agent Day 3" cmd /k "cd backend && set AGENT_DAY=3 && uv run python src/agent.py dev"

timeout /t 2 /nobreak >nul

echo Starting frontend...
start "Frontend Day 3" cmd /k "cd frontend && set NEXT_PUBLIC_AGENT_DAY=3 && pnpm dev"

echo.
echo All services started for Day 3!
echo   - LiveKit server: http://localhost:7880
echo   - Frontend: http://localhost:3000
echo   - Agent: Day 3 - Apollo Pharmacy Wellness Agent
echo.
echo Close the windows to stop the services
pause

