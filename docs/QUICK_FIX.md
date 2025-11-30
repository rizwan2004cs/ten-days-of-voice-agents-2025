# QUICK FIX: Agent Not Joining Room

## The Problem
Frontend connects, but agent never joins the room. You see "Waiting for the show to begin..." forever.

## IMMEDIATE STEPS (Do These Now)

### Step 1: Check Backend Agent is Running

**Open your backend terminal** and look for:

```
INFO   starting worker
INFO   connected to livekit  
INFO   registered worker
```

**If you DON'T see this:**
- Backend agent is NOT running
- **FIX:** Start it:
  ```bash
  cd backend
  python -m uv run python src/agent.py dev
  ```

### Step 2: When You Click "Start Improv Battle"

**Watch your backend terminal.** You should IMMEDIATELY see:

```
INFO   received job request
INFO   Agent entrypoint called for room: voice_assistant_room_XXXX
```

**If you DON'T see "Agent entrypoint called":**
- Agent is not receiving job requests
- **FIX:** Restart both LiveKit server AND backend agent

### Step 3: Check for Errors

**Look for ERROR messages in backend terminal:**

- ❌ `GROQ_API_KEY not found` → Add to `backend/.env.local`
- ❌ `OpenAI plugin not available` → Run `cd backend && python -m uv sync`
- ❌ `Cannot connect to localhost:7880` → Start LiveKit server
- ❌ Any other ERROR → Share the full error message

## Complete Restart Procedure

If nothing works, do a COMPLETE restart:

1. **Stop everything** (Ctrl+C in all terminals)

2. **Terminal 1 - Start LiveKit Server:**
   ```bash
   npx livekit-server --dev
   ```
   Wait for: `listening on port 7880`

3. **Terminal 2 - Start Backend Agent:**
   ```bash
   cd backend
   python -m uv run python src/agent.py dev
   ```
   Wait for: `registered worker`

4. **Terminal 3 - Start Frontend:**
   ```bash
   cd frontend
   pnpm dev
   ```

5. **Test:**
   - Open http://localhost:3000
   - Click "Start Improv Battle"
   - **IMMEDIATELY check backend terminal** for "Agent entrypoint called"

## What You Should See

**In Backend Terminal (when room is created):**
```
INFO   received job request
INFO   Agent entrypoint called for room: voice_assistant_room_9827
INFO   Using Groq LLM (llama3-8b-8192) via OpenAI-compatible API
INFO   Setting up voice AI pipeline...
INFO   ✅ Voice AI pipeline configured successfully
INFO   Connecting to room: voice_assistant_room_9827
INFO   ✅ Agent successfully connected to room!
```

**If you see this:** Agent is working! Try speaking.

**If you DON'T see this:** Agent is not joining. Check errors above.

## Still Not Working?

**Share these details:**
1. Backend terminal output (full logs)
2. Any ERROR messages
3. Whether you see "registered worker"
4. Whether you see "Agent entrypoint called" when creating a room

