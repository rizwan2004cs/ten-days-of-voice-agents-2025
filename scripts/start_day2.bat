@echo off
REM Start Day 2 agent - opens in separate window
start "LiveKit Server" cmd /k livekit-server --dev
timeout /t 3 /nobreak >nul
start "Backend Agent Day 2" cmd /k "cd backend && set AGENT_DAY=2 && uv run python src/agent.py dev"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd frontend && pnpm dev"
echo All services starting in separate windows!
echo   - LiveKit server
echo   - Backend agent (Day 2 - Barista)
echo   - Frontend (http://localhost:3000)

