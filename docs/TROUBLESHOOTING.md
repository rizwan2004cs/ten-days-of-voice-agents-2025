# Troubleshooting: Agent Not Joining Room

## Current Issue

The frontend is connecting to LiveKit, but the **backend agent is not joining the room**. This means:
- ❌ Agent is not listening to your voice
- ❌ Agent is not transcribing your speech
- ❌ Agent is not responding

## Quick Diagnosis

### Step 1: Check if Backend Agent is Running

**Look for a terminal window running the backend agent.** You should see:

```bash
cd backend
python -m uv run python src/agent.py dev
```

**Expected output:**
```
INFO   starting worker
INFO   connected to livekit
INFO   registered worker
INFO   Using Groq LLM (llama3-8b-8192) via OpenAI-compatible API
```

**If you don't see this:**
- The backend agent is **NOT running**
- **Solution:** Start it in a new terminal window

### Step 2: Check for Errors in Backend Terminal

**Common errors:**

#### Error: "GROQ_API_KEY not found"
```
ERROR  GROQ_API_KEY not found in environment variables!
```

**Solution:**
1. Open `backend/.env.local`
2. Add: `GROQ_API_KEY=your_key_here`
3. Get key from: https://console.groq.com
4. Restart backend agent

#### Error: "OpenAI plugin not available"
```
ERROR  OpenAI plugin not available. Cannot use Groq.
```

**Solution:**
```bash
cd backend
python -m uv sync
```

#### Error: "Cannot connect to host localhost:7880"
```
ERROR  Cannot connect to host localhost:7880
```

**Solution:**
- LiveKit server is not running
- Start it: `npx livekit-server --dev`

### Step 3: Verify All Services Are Running

You need **3 services** running simultaneously:

1. **LiveKit Server** (Terminal 1)
   ```bash
   npx livekit-server --dev
   ```
   Should show: `listening on port 7880`

2. **Backend Agent** (Terminal 2)
   ```bash
   cd backend
   python -m uv run python src/agent.py dev
   ```
   Should show: `registered worker`

3. **Frontend** (Terminal 3)
   ```bash
   cd frontend
   pnpm dev
   ```
   Should show: `Ready on http://localhost:3000`

### Step 4: Check Backend Logs When Room is Created

When you click "Start Improv Battle" in the frontend, you should see in the **backend terminal**:

```
INFO   Agent entrypoint called for room: voice_assistant_room_XXX
INFO   Setting up voice AI pipeline...
INFO   ✅ Voice AI pipeline configured successfully
INFO   Connecting to room: voice_assistant_room_XXX
INFO   ✅ Agent successfully connected to room!
```

**If you DON'T see these logs:**
- The agent is not being triggered to join the room
- Check that backend is connected to LiveKit (should see "registered worker")

## Common Issues & Solutions

### Issue: "Waiting for the show to begin..." Forever

**Cause:** Agent never joined the room

**Solutions:**
1. ✅ Make sure backend agent is running
2. ✅ Check backend terminal for errors
3. ✅ Verify `GROQ_API_KEY` is set
4. ✅ Restart backend agent after fixing issues

### Issue: Agent Joins But Doesn't Respond

**Check backend logs for:**
- STT metrics (should see when you speak)
- LLM errors
- TTS errors

**Common causes:**
- Missing API keys (Deepgram, Groq, or Murf)
- API quota exceeded
- Network issues

### Issue: "registered worker" But Agent Doesn't Join

**This means:**
- Backend is connected to LiveKit ✅
- But agent entrypoint is not being called ❌

**Solutions:**
1. Check that frontend is requesting an agent:
   - Look in frontend console for `agent_name` in connection details
2. Verify LiveKit server is in dev mode (auto-joins agents)
3. Restart both LiveKit server and backend agent

## Verification Checklist

Before testing, verify:

- [ ] LiveKit server is running (`npx livekit-server --dev`)
- [ ] Backend agent is running (`python -m uv run python src/agent.py dev`)
- [ ] Backend shows "registered worker"
- [ ] `GROQ_API_KEY` is set in `backend/.env.local`
- [ ] Frontend is running (`pnpm dev`)
- [ ] No errors in backend terminal

## Still Not Working?

1. **Share backend terminal output** - Copy the full error messages
2. **Check all API keys** - Verify they're set correctly
3. **Restart everything** - Stop all services and start fresh
4. **Check LiveKit server logs** - See if it's receiving agent registration

## Expected Flow

1. User clicks "Start Improv Battle" in frontend
2. Frontend creates room: `voice_assistant_room_XXX`
3. Backend agent **automatically joins** the room
4. Backend logs: "Agent entrypoint called for room: ..."
5. Agent connects and is ready to listen
6. User speaks → Agent transcribes → Agent responds

If step 3-4 don't happen, the agent is not joining the room!

