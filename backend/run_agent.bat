@echo off
cd /d "%~dp0"
echo Starting Day-9 Voice Agent...
echo.
:loop
uv run python src/agent.py dev
echo.
echo Agent stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
