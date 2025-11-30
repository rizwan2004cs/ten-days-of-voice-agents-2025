# How to Start LiveKit Server

## The Problem

Your backend agent is trying to connect to LiveKit server at `localhost:7880`, but the server isn't running. You'll see errors like:

```
Cannot connect to host localhost:7880
[The remote computer refused the network connection]
```

## Solution: Start LiveKit Server

### Option 1: Using npm/npx (Easiest for Windows)

1. **Install Node.js** (if not already installed):
   - Download from [nodejs.org](https://nodejs.org/)
   - Make sure npm is available

2. **Start LiveKit Server**:
   ```bash
   npx livekit-server --dev
   ```

   This will:
   - Download and run LiveKit server in development mode
   - Start on `localhost:7880`
   - Run until you press Ctrl+C

### Option 2: Install LiveKit CLI (Recommended)

1. **Install LiveKit CLI globally**:
   ```bash
   npm install -g livekit-cli
   ```

2. **Start the server**:
   ```bash
   livekit-server --dev
   ```

### Option 3: Using Docker (If you have Docker installed)

```bash
docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp livekit/livekit-server --dev
```

## Verify Server is Running

Once started, you should see output like:
```
INFO    starting LiveKit server    {"version": "1.x.x", "dev": true}
INFO    listening on port 7880
```

You can also verify by opening: http://localhost:7880 in your browser (should show LiveKit server info)

## Running Everything Together

You need **3 terminal windows**:

### Terminal 1: LiveKit Server
```bash
npx livekit-server --dev
```

### Terminal 2: Backend Agent
```bash
cd backend
python -m uv run python src/agent.py dev
```

### Terminal 3: Frontend
```bash
cd frontend
pnpm dev
```

## Quick Start Script (Windows)

Create a file `start_livekit.bat`:

```batch
@echo off
echo Starting LiveKit Server...
start "LiveKit Server" cmd /k "npx livekit-server --dev"
timeout /t 3
echo Starting Backend Agent...
start "Backend Agent" cmd /k "cd backend && python -m uv run python src/agent.py dev"
timeout /t 3
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && pnpm dev"
echo All services starting in separate windows...
```

Then double-click `start_livekit.bat` to start everything.

## Troubleshooting

### Port 7880 already in use
- Another process is using port 7880
- Find and stop it, or use a different port:
  ```bash
  livekit-server --dev --port 7881
  ```

### Cannot find livekit-server command
- Make sure npm/npx is installed
- Try: `npx livekit-server --dev` (doesn't require installation)

### Still can't connect
- Check Windows Firewall isn't blocking port 7880
- Make sure LiveKit server is actually running (check the terminal output)
- Verify the server is listening on the correct port

## Next Steps

Once LiveKit server is running:
1. ✅ Backend agent should connect successfully
2. ✅ Frontend can connect to create rooms
3. ✅ Agent will respond to voice input (with Groq LLM)

