@echo off
REM Quick diagnostic script to check agent connection status

echo ========================================
echo Agent Connection Diagnostic Tool
echo ========================================
echo.

echo [1] Checking LiveKit Server...
netstat -an | findstr ":7880" >nul
if %ERRORLEVEL% EQU 0 (
    echo   ✓ LiveKit server is running on port 7880
) else (
    echo   ✗ LiveKit server is NOT running on port 7880
    echo     Start it with: livekit-server --dev
)
echo.

echo [2] Checking Frontend...
netstat -an | findstr ":3000" >nul
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Frontend is running on port 3000
) else (
    echo   ✗ Frontend is NOT running on port 3000
    echo     Start it with: cd frontend ^&^& pnpm dev
)
echo.

echo [3] Checking Backend Process...
tasklist | findstr /i "python.*agent" >nul
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Backend Python process detected
) else (
    echo   ✗ Backend agent process NOT found
    echo     Start it with: cd backend ^&^& uv run python src/agent.py dev
)
echo.

echo [4] Checking Backend .env.local...
if exist "backend\.env.local" (
    echo   ✓ backend\.env.local exists
    echo.
    echo   Checking for required variables:
    findstr /i "LIVEKIT_URL" backend\.env.local >nul
    if %ERRORLEVEL% EQU 0 (
        echo     ✓ LIVEKIT_URL found
    ) else (
        echo     ✗ LIVEKIT_URL missing
    )
    
    findstr /i "LIVEKIT_API_KEY" backend\.env.local >nul
    if %ERRORLEVEL% EQU 0 (
        echo     ✓ LIVEKIT_API_KEY found
    ) else (
        echo     ✗ LIVEKIT_API_KEY missing
    )
    
    findstr /i "LIVEKIT_API_SECRET" backend\.env.local >nul
    if %ERRORLEVEL% EQU 0 (
        echo     ✓ LIVEKIT_API_SECRET found
    ) else (
        echo     ✗ LIVEKIT_API_SECRET missing
    )
) else (
    echo   ✗ backend\.env.local NOT found
    echo     Create it from backend\.env.example
)
echo.

echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
echo Next steps:
echo 1. If backend is not running, start it:
echo    cd backend
echo    set AGENT_DAY=2
echo    uv run python src/agent.py dev
echo.
echo 2. Check backend logs for:
echo    "registered worker" - means connected
echo    "failed to connect" - means connection issue
echo.
echo 3. See AGENT_CONNECTION_TROUBLESHOOTING.md for details
echo.
pause

