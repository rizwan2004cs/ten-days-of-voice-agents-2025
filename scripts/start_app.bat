@echo off
REM Start all services for Windows
REM Usage: start_app.bat [day]
REM   day: 1, 2, or 3 (defaults to 2 if not specified)

REM Get day parameter (default to 2)
set AGENT_DAY=%1
if "%AGENT_DAY%"=="" set AGENT_DAY=2

REM Validate day parameter
if not "%AGENT_DAY%"=="1" if not "%AGENT_DAY%"=="2" if not "%AGENT_DAY%"=="3" (
    echo Invalid day parameter: %AGENT_DAY%
    echo Usage: start_app.bat [1^|2^|3]
    echo Defaulting to Day 2...
    set AGENT_DAY=2
)

echo Starting services for Day %AGENT_DAY% agent...

REM Source uv environment if available
if exist "%USERPROFILE%\.local\bin\uv.exe" (
    set PATH=%USERPROFILE%\.local\bin;%PATH%
)

REM Check if livekit-server is available
where livekit-server >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: livekit-server is not installed or not in PATH
    echo Please install livekit-server:
    echo   Download from https://github.com/livekit/livekit/releases
    echo   Or use: curl -sSL https://get.livekit.io ^| bash
    pause
    exit /b 1
)

REM Check if uv is available
where uv >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: uv is not installed or not in PATH
    echo Please add uv to your PATH
    pause
    exit /b 1
)

echo Starting LiveKit server...
start "LiveKit Server" cmd /k livekit-server --dev

timeout /t 2 /nobreak >nul

echo Starting backend agent (Day %AGENT_DAY%)...
start "Backend Agent" cmd /k "cd backend && set AGENT_DAY=%AGENT_DAY% && uv run python src/agent.py dev"

timeout /t 2 /nobreak >nul

echo Starting frontend...
start "Frontend" cmd /k "cd frontend && set NEXT_PUBLIC_AGENT_DAY=%AGENT_DAY% && pnpm dev"

echo.
echo All services started in separate windows!
echo   - LiveKit server: http://localhost:7880
echo   - Frontend: http://localhost:3000
echo   - Agent Day: %AGENT_DAY%
echo.
echo Close the windows to stop the services
pause

