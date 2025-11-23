#!/bin/bash
# Start Backend Agent Worker - Run this in Git Bash

echo "=========================================="
echo "Starting Backend Agent Worker"
echo "=========================================="
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Source uv environment if available
if [ -f "$HOME/.local/bin/env" ]; then
    echo "Loading uv environment..."
    source "$HOME/.local/bin/env"
fi

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not installed or not in PATH"
    echo "Please run: source \$HOME/.local/bin/env"
    exit 1
fi

# Set agent day (default to 3 for Day 3 Wellness Agent)
export AGENT_DAY=${1:-3}
echo "Using AGENT_DAY=$AGENT_DAY"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "WARNING: .env.local not found!"
    echo "Please create it from .env.example"
    exit 1
fi

echo "Starting backend agent worker..."
echo "Look for: 'registered worker' to confirm connection"
echo "Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

# Start the agent
uv run python src/agent.py dev

