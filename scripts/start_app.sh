#!/bin/bash

# Usage: ./start_app.sh [day]
#   day: 1, 2, or 3 (defaults to 2 if not specified)

# Get day parameter (default to 2)
AGENT_DAY=${1:-2}

# Validate day parameter
if [ "$AGENT_DAY" != "1" ] && [ "$AGENT_DAY" != "2" ] && [ "$AGENT_DAY" != "3" ]; then
    echo "Invalid day parameter: $AGENT_DAY"
    echo "Usage: ./start_app.sh [1|2|3]"
    echo "Defaulting to Day 2..."
    AGENT_DAY=2
fi

echo "Starting services for Day $AGENT_DAY agent..."

# Source uv environment if available
if [ -f "$HOME/.local/bin/env" ]; then
    source "$HOME/.local/bin/env"
fi

# Check if livekit-server is available
if ! command -v livekit-server &> /dev/null; then
    echo "ERROR: livekit-server is not installed or not in PATH"
    echo "Please install livekit-server:"
    echo "  Windows: Download from https://github.com/livekit/livekit/releases"
    echo "  Or use: curl -sSL https://get.livekit.io | bash"
    exit 1
fi

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not installed or not in PATH"
    echo "Please add uv to your PATH or source $HOME/.local/bin/env"
    exit 1
fi

echo "Starting LiveKit server..."
livekit-server --dev &
LIVEKIT_PID=$!

sleep 2

echo "Starting backend agent (Day $AGENT_DAY)..."
(cd backend && AGENT_DAY=$AGENT_DAY uv run python src/agent.py dev) &
BACKEND_PID=$!

sleep 2

echo "Starting frontend..."
(cd frontend && NEXT_PUBLIC_AGENT_DAY=$AGENT_DAY pnpm dev) &
FRONTEND_PID=$!

echo ""
echo "All services started!"
echo "  - LiveKit server: PID $LIVEKIT_PID (port 7880)"
echo "  - Backend agent: PID $BACKEND_PID (Day $AGENT_DAY)"
echo "  - Frontend: PID $FRONTEND_PID (port 3000, Day $AGENT_DAY)"
echo ""
echo "Access the app at: http://localhost:3000"
echo "Press Ctrl+C to stop all services"

# Wait for all background jobs
wait