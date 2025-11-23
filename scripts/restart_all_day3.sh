#!/bin/bash
# Stop everything and restart for Day 3

echo "=========================================="
echo "Restarting All Services for Day 3"
echo "=========================================="
echo ""

# First, stop everything
./stop_all.sh

echo ""
echo "Waiting 3 seconds for ports to be released..."
sleep 3

echo ""
echo "=========================================="
echo "Starting All Services for Day 3"
echo "=========================================="
echo ""

# Source uv environment if available
if [ -f "$HOME/.local/bin/env" ]; then
    source "$HOME/.local/bin/env"
fi

# Check if livekit-server is available
if ! command -v livekit-server &> /dev/null; then
    echo "ERROR: livekit-server is not installed or not in PATH"
    exit 1
fi

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not installed or not in PATH"
    exit 1
fi

# Ensure backend .env.local has AGENT_DAY=3
cd "$(dirname "$0")/backend" || exit 1
if [ -f ".env.local" ]; then
    if grep -q "^AGENT_DAY=" .env.local; then
        sed -i 's/^AGENT_DAY=.*/AGENT_DAY=3/' .env.local
    else
        echo "AGENT_DAY=3" >> .env.local
    fi
else
    echo "ERROR: backend/.env.local not found!"
    exit 1
fi

# Ensure frontend .env.local has NEXT_PUBLIC_AGENT_DAY=3
cd "$(dirname "$0")/frontend" || exit 1
if [ -f ".env.local" ]; then
    if grep -q "^NEXT_PUBLIC_AGENT_DAY=" .env.local; then
        sed -i 's/^NEXT_PUBLIC_AGENT_DAY=.*/NEXT_PUBLIC_AGENT_DAY=3/' .env.local
    else
        echo "NEXT_PUBLIC_AGENT_DAY=3" >> .env.local
    fi
else
    echo "NEXT_PUBLIC_AGENT_DAY=3" > .env.local
fi

cd "$(dirname "$0")" || exit 1

echo "✅ Configuration updated for Day 3"
echo ""

# Start LiveKit server
echo "Starting LiveKit server..."
livekit-server --dev > livekit.log 2>&1 &
LIVEKIT_PID=$!
echo "  LiveKit server started (PID: $LIVEKIT_PID, port 7880)"
echo "  Logs: livekit.log"

sleep 3

# Start backend
echo ""
echo "Starting backend agent (Day 3)..."
cd backend || exit 1
unset AGENT_DAY  # Ensure .env.local is used
uv run python src/agent.py dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend started (PID: $BACKEND_PID, Day 3)"
echo "  Logs: backend.log"

sleep 3

# Start frontend
echo ""
echo "Starting frontend..."
cd ../frontend || exit 1
pnpm dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend started (PID: $FRONTEND_PID, port 3000)"
echo "  Logs: frontend.log"

cd ..

echo ""
echo "=========================================="
echo "All Services Started for Day 3!"
echo "=========================================="
echo ""
echo "Services:"
echo "  ✅ LiveKit server: PID $LIVEKIT_PID (port 7880)"
echo "  ✅ Backend agent: PID $BACKEND_PID (Day 3 - Apollo Pharmacy)"
echo "  ✅ Frontend: PID $FRONTEND_PID (port 3000)"
echo ""
echo "Access the app at: http://localhost:3000"
echo ""
echo "Logs:"
echo "  - LiveKit: livekit.log"
echo "  - Backend: backend.log"
echo "  - Frontend: frontend.log"
echo ""
echo "To stop all services, run: ./stop_all.sh"
echo ""
echo "Waiting for services to initialize..."
sleep 5

echo ""
echo "Checking service status..."
echo ""

# Check LiveKit
if netstat -ano 2>/dev/null | grep -q ":7880.*LISTENING"; then
    echo "  ✅ LiveKit server is running on port 7880"
else
    echo "  ⚠️  LiveKit server may not be running (check livekit.log)"
fi

# Check Frontend
if netstat -ano 2>/dev/null | grep -q ":3000.*LISTENING"; then
    echo "  ✅ Frontend is running on port 3000"
else
    echo "  ⚠️  Frontend may not be running (check frontend.log)"
fi

# Check Backend
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "  ✅ Backend is running (PID: $BACKEND_PID)"
else
    echo "  ⚠️  Backend may not be running (check backend.log)"
fi

echo ""
echo "=========================================="
echo "Ready! Open http://localhost:3000 in your browser"
echo "=========================================="

