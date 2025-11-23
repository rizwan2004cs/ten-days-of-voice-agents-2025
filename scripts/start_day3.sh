#!/bin/bash
# Start Day 3 Wellness Agent (Apollo Pharmacy)
# Usage: ./start_day3.sh

echo "Starting Day 3 Wellness Agent (Apollo Pharmacy)..."

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

echo "Starting LiveKit server..."
livekit-server --dev &
LIVEKIT_PID=$!

sleep 2

echo "Starting backend agent (Day 3 - Apollo Pharmacy Wellness Agent)..."
(cd backend && AGENT_DAY=3 uv run python src/agent.py dev) &
BACKEND_PID=$!

sleep 2

echo "Starting frontend..."
(cd frontend && NEXT_PUBLIC_AGENT_DAY=3 pnpm dev) &
FRONTEND_PID=$!

echo ""
echo "All services started for Day 3!"
echo "  - LiveKit server: PID $LIVEKIT_PID (port 7880)"
echo "  - Backend agent: PID $BACKEND_PID (Day 3)"
echo "  - Frontend: PID $FRONTEND_PID (port 3000)"
echo ""
echo "Access the app at: http://localhost:3000"
echo "Press Ctrl+C to stop all services"

wait

