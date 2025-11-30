# Check Agent Status - Quick Diagnostic

## The Problem
Frontend connects successfully, but agent never joins the room. It was working an hour ago.

## IMMEDIATE CHECK - Do This Now:

### 1. Is Backend Agent Running?

**Look at your backend terminal window.** You should see:

```
INFO   starting worker
INFO   connected to livekit
INFO   registered worker
```

**If you DON'T see "registered worker":**
- ❌ Backend agent is NOT connected to LiveKit
- **FIX:** Restart the backend agent

### 2. When You Click "Start Improv Battle"

**IMMEDIATELY check your backend terminal.** You should see:

```
INFO   received job request
INFO   🚀 Agent entrypoint called for room: voice_assistant_room_1883
```

**If you DON'T see "Agent entrypoint called":**
- ❌ Agent is not receiving job requests
- **Possible causes:**
  - Backend agent crashed
  - Backend agent not connected to LiveKit
  - LiveKit server restarted and lost connection

### 3. Common Issues After It Was Working

**Issue: Backend Agent Crashed**
- Check backend terminal for error messages
- Look for Python tracebacks or exceptions
- **FIX:** Restart backend agent

**Issue: LiveKit Server Restarted**
- If you restarted LiveKit server, backend agent lost connection
- **FIX:** Restart backend agent after LiveKit server

**Issue: Environment Variables Lost**
- If you closed/reopened terminal, env vars might be lost
- **FIX:** Make sure `.env.local` is loaded

## Quick Restart Procedure

1. **Stop backend agent** (Ctrl+C in backend terminal)

2. **Restart backend agent:**
   ```bash
   cd backend
   python -m uv run python src/agent.py dev
   ```

3. **Wait for:**
   ```
   INFO   registered worker
   ```

4. **Test again:** Click "Start Improv Battle" and watch backend terminal

## What to Share

If it's still not working, share:

1. **Backend terminal output** - Copy the last 20-30 lines
2. **Do you see "registered worker"?** - Yes/No
3. **When you create a room, do you see "Agent entrypoint called"?** - Yes/No
4. **Any ERROR messages?** - Copy them

