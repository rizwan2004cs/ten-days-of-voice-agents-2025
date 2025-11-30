# Fix: Agent Not Joining Room

## Quick Diagnostic Steps

### Step 1: Verify Backend Agent is Running

**Check your backend terminal.** You MUST see:

```
INFO   starting worker
INFO   connected to livekit
INFO   registered worker
```

**If you DON'T see "registered worker":**
- ❌ Backend agent is NOT connected to LiveKit
- **FIX:** Restart backend agent

### Step 2: When You Create a Room

**IMMEDIATELY check backend terminal.** You should see:

```
================================================================================
🚀 AGENT ENTRYPOINT CALLED FOR ROOM: voice_assistant_room_XXXX
================================================================================
Setting up voice AI pipeline...
  - STT: Deepgram (nova-3)
  - LLM: Google Gemini (gemini-2.5-flash)
  - TTS: Murf Falcon
✅ Voice AI pipeline configured successfully
Connecting to room: voice_assistant_room_XXXX
✅ Agent successfully connected to room!
```

**If you DON'T see "AGENT ENTRYPOINT CALLED":**
- ❌ Agent is not receiving job requests
- **Possible causes:**
  1. Backend agent crashed
  2. Backend agent not connected to LiveKit
  3. LiveKit server restarted

## Complete Fix Procedure

### 1. Stop Everything
Press Ctrl+C in all terminals (LiveKit, Backend, Frontend)

### 2. Start LiveKit Server (Terminal 1)
```bash
npx livekit-server --dev
```
**Wait for:** `listening on port 7880`

### 3. Start Backend Agent (Terminal 2)
```bash
cd backend
python -m uv run python src/agent.py dev
```
**Wait for:** `INFO registered worker`

### 4. Start Frontend (Terminal 3)
```bash
cd frontend
pnpm dev
```

### 5. Test
1. Open http://localhost:3000
2. Click "Start Improv Battle"
3. **IMMEDIATELY watch backend terminal**
4. You should see: `🚀 AGENT ENTRYPOINT CALLED FOR ROOM: ...`

## Common Errors & Fixes

### Error: "Cannot connect to localhost:7880"
- LiveKit server is not running
- **FIX:** Start it: `npx livekit-server --dev`

### Error: "GOOGLE_API_KEY not found"
- Missing API key
- **FIX:** Add to `backend/.env.local`:
  ```
  GOOGLE_API_KEY=your_key_here
  ```

### Error: "API quota exceeded" (429)
- Google Gemini quota limit reached
- **FIX:** Wait for quota reset or upgrade plan

### No "registered worker" message
- Backend agent not connecting to LiveKit
- **FIX:** 
  1. Check LiveKit server is running
  2. Check `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` in `.env.local`
  3. Restart backend agent

## Verification

**When everything works, you'll see in backend terminal:**

1. On startup:
   ```
   INFO   starting worker
   INFO   connected to livekit
   INFO   registered worker
   ```

2. When room is created:
   ```
   🚀 AGENT ENTRYPOINT CALLED FOR ROOM: voice_assistant_room_XXXX
   Setting up voice AI pipeline...
   ✅ Voice AI pipeline configured successfully
   ✅ Agent successfully connected to room!
   ```

3. When you speak:
   ```
   STT metrics (showing transcription)
   LLM metrics (showing response generation)
   ```

## Still Not Working?

Share:
1. Backend terminal output (last 30-50 lines)
2. Do you see "registered worker"? (Yes/No)
3. When you create a room, do you see "AGENT ENTRYPOINT CALLED"? (Yes/No)
4. Any ERROR messages? (Copy them)

