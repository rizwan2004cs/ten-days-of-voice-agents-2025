#!/bin/bash
# Start the backend agent worker (Git Bash compatible)

# Get day parameter (default to 2)
AGENT_DAY=${1:-2}

# Validate day parameter
if [ "$AGENT_DAY" != "1" ] && [ "$AGENT_DAY" != "2" ] && [ "$AGENT_DAY" != "3" ]; then
    echo "Invalid day parameter: $AGENT_DAY"
    echo "Usage: ./start_backend_agent.sh [1|2|3]"
    echo "Defaulting to Day 2..."
    AGENT_DAY=2
fi

echo "Starting backend agent (Day $AGENT_DAY)..."

# Source uv environment if available
if [ -f "$HOME/.local/bin/env" ]; then
    source "$HOME/.local/bin/env"
fi

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not installed or not in PATH"
    echo "Please add uv to your PATH or run: source \$HOME/.local/bin/env"
    exit 1
fi

# Check if .env.local exists
if [ ! -f "backend/.env.local" ]; then
    echo "ERROR: backend/.env.local not found"
    echo "Please create it from backend/.env.example"
    exit 1
fi

# Start the backend agent
cd backend
export AGENT_DAY=$AGENT_DAY
echo "Running: AGENT_DAY=$AGENT_DAY uv run python src/agent.py dev"
echo ""
echo "Look for this message to confirm connection:"
echo "  INFO   livekit.agents   registered worker"
echo ""
uv run python src/agent.py dev

