# Day 10 - Start Commands

## Quick Start (All Services)

Run these commands in **separate terminal windows/tabs**:

### Terminal 1: LiveKit Server
```bash
livekit-server --dev
```

### Terminal 2: Backend Agent
```bash
cd backend
python -m uv run python src/agent.py dev
```

Or if `uv` is in PATH:
```bash
cd backend
uv run python src/agent.py dev
```

### Terminal 3: Frontend
```bash
cd frontend
pnpm dev
```

---

## Alternative: Using the Start Script

If you prefer a single command (all services in background):

```bash
./start_app.sh
```

---

## Verify Services Are Running

1. **LiveKit Server**: http://localhost:7880
2. **Frontend**: http://localhost:3000
3. **Backend Agent**: Check terminal for "Agent started" message

---

## Access the Game

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the **Improv Battle** join screen!

---

## Troubleshooting

### If backend fails to start:
1. Make sure `.env.local` exists in `backend/` directory
2. Download required models first:
   ```bash
   cd backend
   python -m uv run python src/agent.py download-files
   ```

### If frontend fails to start:
1. Make sure `.env.local` exists in `frontend/` directory
2. Install dependencies:
   ```bash
   cd frontend
   pnpm install
   ```

### If LiveKit server fails:
1. Check if port 7880 is available
2. Install LiveKit CLI if needed:
   ```bash
   # macOS
   brew install livekit
   
   # Or download from: https://docs.livekit.io/home/cli/cli-setup
   ```

---

## Stop Services

Press `Ctrl+C` in each terminal window to stop the services.

