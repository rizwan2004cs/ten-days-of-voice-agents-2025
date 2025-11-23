#!/bin/bash
# Quick diagnostic script to check agent connection status (Git Bash compatible)

echo "========================================"
echo "Agent Connection Diagnostic Tool"
echo "========================================"
echo ""

echo "[1] Checking LiveKit Server..."
if netstat -an 2>/dev/null | grep -q ":7880" || ss -tuln 2>/dev/null | grep -q ":7880"; then
    echo "  ✓ LiveKit server is running on port 7880"
else
    echo "  ✗ LiveKit server is NOT running on port 7880"
    echo "    Start it with: livekit-server --dev"
fi
echo ""

echo "[2] Checking Frontend..."
if netstat -an 2>/dev/null | grep -q ":3000" || ss -tuln 2>/dev/null | grep -q ":3000"; then
    echo "  ✓ Frontend is running on port 3000"
else
    echo "  ✗ Frontend is NOT running on port 3000"
    echo "    Start it with: cd frontend && pnpm dev"
fi
echo ""

echo "[3] Checking Backend Process..."
if pgrep -f "python.*agent.py" > /dev/null 2>&1 || tasklist 2>/dev/null | grep -qi "python.*agent"; then
    echo "  ✓ Backend Python process detected"
else
    echo "  ✗ Backend agent process NOT found"
    echo "    Start it with: cd backend && AGENT_DAY=2 uv run python src/agent.py dev"
fi
echo ""

echo "[4] Checking Backend .env.local..."
if [ -f "backend/.env.local" ]; then
    echo "  ✓ backend/.env.local exists"
    echo ""
    echo "  Checking for required variables:"
    
    if grep -qi "LIVEKIT_URL" backend/.env.local 2>/dev/null; then
        echo "    ✓ LIVEKIT_URL found"
        grep -i "LIVEKIT_URL" backend/.env.local | head -1
    else
        echo "    ✗ LIVEKIT_URL missing"
    fi
    
    if grep -qi "LIVEKIT_API_KEY" backend/.env.local 2>/dev/null; then
        echo "    ✓ LIVEKIT_API_KEY found"
    else
        echo "    ✗ LIVEKIT_API_KEY missing"
    fi
    
    if grep -qi "LIVEKIT_API_SECRET" backend/.env.local 2>/dev/null; then
        echo "    ✓ LIVEKIT_API_SECRET found"
    else
        echo "    ✗ LIVEKIT_API_SECRET missing"
    fi
else
    echo "  ✗ backend/.env.local NOT found"
    echo "    Create it from backend/.env.example"
fi
echo ""

echo "[5] Checking Recent Backend Logs..."
if [ -f "backend.log" ]; then
    echo "  Recent backend log entries:"
    tail -n 5 backend.log 2>/dev/null | grep -i "registered\|connected\|failed" || echo "    (no relevant entries found)"
elif [ -f "backend/backend.log" ]; then
    echo "  Recent backend log entries:"
    tail -n 5 backend/backend.log 2>/dev/null | grep -i "registered\|connected\|failed" || echo "    (no relevant entries found)"
else
    echo "  (backend log file not found)"
fi
echo ""

echo "========================================"
echo "Diagnostic Complete"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. If backend is not running, start it:"
echo "   cd backend"
echo "   export AGENT_DAY=2"
echo "   uv run python src/agent.py dev"
echo ""
echo "2. Check backend logs for:"
echo "   'registered worker' - means connected ✓"
echo "   'failed to connect' - means connection issue ✗"
echo ""
echo "3. See AGENT_CONNECTION_TROUBLESHOOTING.md for details"
echo ""

