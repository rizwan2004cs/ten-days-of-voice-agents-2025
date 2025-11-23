#!/bin/bash
# Script to restart backend and monitor logs for TTS errors

echo "=========================================="
echo "Backend Restart & Log Monitoring"
echo "=========================================="
echo ""

cd "$(dirname "$0")/backend" || exit 1

# Source uv environment if available
if [ -f "$HOME/.local/bin/env" ]; then
    source "$HOME/.local/bin/env"
fi

# Check if backend is already running
if pgrep -f "python.*agent.py" > /dev/null 2>&1; then
    echo "⚠️  Backend is already running!"
    echo "   Please stop it first (Ctrl+C in the backend terminal)"
    echo "   Then run this script again"
    exit 1
fi

# Set agent day (default to 3 for Day 3 Wellness Agent)
export AGENT_DAY=${1:-3}
echo "Using AGENT_DAY=$AGENT_DAY"
echo ""

# Check API keys
echo "Checking API keys..."
if ! grep -q "MURF_API_KEY=" .env.local 2>/dev/null || grep -q "MURF_API_KEY=your_" .env.local 2>/dev/null; then
    echo "⚠️  WARNING: MURF_API_KEY may not be set correctly in .env.local"
fi

if ! grep -q "GOOGLE_API_KEY=" .env.local 2>/dev/null || grep -q "GOOGLE_API_KEY=your_" .env.local 2>/dev/null; then
    echo "⚠️  WARNING: GOOGLE_API_KEY may not be set correctly in .env.local"
fi

if ! grep -q "DEEPGRAM_API_KEY=" .env.local 2>/dev/null || grep -q "DEEPGRAM_API_KEY=your_" .env.local 2>/dev/null; then
    echo "⚠️  WARNING: DEEPGRAM_API_KEY may not be set correctly in .env.local"
fi

echo ""
echo "Starting backend agent worker..."
echo "=========================================="
echo ""
echo "Watch for these messages:"
echo "  ✅ 'registered worker' - Backend connected"
echo "  ✅ 'received job request' - Agent got a job"
echo "  ✅ 'Day X Agent connected to room' - Agent joined"
echo ""
echo "  ❌ 'APIConnectionError' - Murf TTS connection issue"
echo "  ❌ 'AttributeError' - Plugin bug"
echo "  ❌ 'failed to synthesize speech' - TTS failing"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="
echo ""

# Start the backend and monitor for errors
uv run python src/agent.py dev 2>&1 | tee -a ../backend_restart.log | grep --line-buffered -E "registered|error|Error|APIConnection|AttributeError|TTS|murf|User speech|Agent speech|LLM response|failed to synthesize" || uv run python src/agent.py dev

