# Agent Not Replying - Diagnostic Guide

## Issue: Agent Not Responding

### Possible Causes:

1. **Backend Agent Process Not Running** (Most Likely)
   - The backend agent must be running to process voice input
   - Check: Is the backend terminal showing "connected to livekit"?

2. **API Rate Limits/Quota Issues**
   - Check backend logs for API errors
   - Google Gemini, Deepgram, or Murf API limits may be exceeded

3. **Agent Not Auto-Joining Rooms**
   - For local dev, agent should auto-join when rooms are created
   - Verify backend is connected to LiveKit server

## Quick Fixes:

### 1. Start Backend Agent
```bash
cd backend
python -m uv run python src/agent.py dev
```

Look for these messages:
- ✓ "starting worker"
- ✓ "connected to livekit" 
- ✓ "registered worker"
- ✗ Any ERROR messages

### 2. Check API Keys & Limits
```bash
cd backend
# Check if keys are set
grep -E "GOOGLE_API_KEY|DEEPGRAM_API_KEY|MURF_API_KEY" .env.local
```

### 3. Check Backend Logs
When you speak, you should see in backend terminal:
- "received user transcription"
- "LLM metrics"
- "sent text to tts"

If you see errors like:
- "API quota exceeded"
- "Invalid API key"
- "Rate limit exceeded"

Then you have an API issue.

### 4. Verify Services Running
```bash
# Check LiveKit
curl http://localhost:7880

# Check if backend process is running
ps aux | grep "agent.py"
```

## Expected Behavior:

1. User connects from frontend → Room created
2. Backend agent auto-joins room → "registered worker" in logs
3. User speaks → Backend processes → Agent responds
4. Agent speaks first → "Welcome to Improv Battle..."

## If Still Not Working:

1. Check backend terminal for specific error messages
2. Verify all three services are running:
   - LiveKit server (port 7880)
   - Backend agent (check terminal)
   - Frontend (port 3000)
3. Try restarting backend agent
4. Check API quotas/limits in provider dashboards

