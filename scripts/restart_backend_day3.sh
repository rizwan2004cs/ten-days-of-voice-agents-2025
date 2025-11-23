#!/bin/bash
# Restart backend with Day 3 agent

cd "/c/voice AI Challenge/ten-days-of-voice-agents-2025/backend"

# Verify AGENT_DAY is set to 3
if grep -q "^AGENT_DAY=3" .env.local 2>/dev/null; then
    echo "✅ AGENT_DAY=3 is set in .env.local"
else
    echo "⚠️  AGENT_DAY=3 not found in .env.local, setting it now..."
    if grep -q "^AGENT_DAY=" .env.local 2>/dev/null; then
        sed -i 's/^AGENT_DAY=.*/AGENT_DAY=3/' .env.local
    else
        echo "AGENT_DAY=3" >> .env.local
    fi
fi

# Export AGENT_DAY for this session
export AGENT_DAY=3

echo ""
echo "🔄 Starting backend with Day 3 agent..."
echo "   (Make sure to stop the old backend process first with Ctrl+C)"
echo ""

# Start the backend
uv run python src/agent.py dev

