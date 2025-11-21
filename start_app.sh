#!/bin/bash

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

echo "Starting backend agent..."
(cd backend && uv run python src/agent.py dev) &
BACKEND_PID=$!

echo "Starting frontend..."
(cd frontend && pnpm dev) &
FRONTEND_PID=$!

echo ""
echo "All services started!"
echo "  - LiveKit server: PID $LIVEKIT_PID (port 7880)"
echo "  - Backend agent: PID $BACKEND_PID"
echo "  - Frontend: PID $FRONTEND_PID (port 3000)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background jobs
wait