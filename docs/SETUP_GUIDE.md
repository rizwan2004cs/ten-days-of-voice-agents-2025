# AI Voice Agent Setup Guide

## ✅ Setup Complete!

Your AI Voice Agent application has been set up successfully. Here's what was configured:

### Prerequisites Status

- ✅ **Python 3.13.3** - Installed
- ✅ **Node.js v22.14.0** - Installed  
- ✅ **uv 0.9.11** - Installed (add to PATH: `source $HOME/.local/bin/env`)
- ✅ **pnpm 10.11.1** - Installed
- ⚠️ **livekit-server** - Needs installation (see below)

### Backend Setup

- ✅ Dependencies installed via `uv sync`
- ✅ `.env.local` created in `backend/` directory
- ✅ Required model files downloaded

### Frontend Setup

- ✅ Dependencies installed via `pnpm install`
- ✅ `.env.local` created in `frontend/` directory

---

## 🔧 Installing LiveKit Server

LiveKit server is required to run the voice agent. Here are installation options:

### Option 1: Download Binary (Windows)

1. Visit: https://github.com/livekit/livekit/releases
2. Download the latest `livekit-server-windows-amd64.zip`
3. Extract the `livekit-server.exe` file
4. Add it to your PATH or place it in a directory in your PATH

### Option 2: Use Package Manager

If you have Chocolatey or Scoop installed:

```bash
# Chocolatey
choco install livekit-server

# Scoop
scoop install livekit-server
```

### Option 3: Manual Installation Script

```bash
curl -sSL https://get.livekit.io | bash
```

After installation, verify it works:
```bash
livekit-server --version
```

---

## 🔑 Adding API Keys

Before running the application, you need to add your API keys to the `.env.local` files:

### Backend (`backend/.env.local`)

Edit the file and replace the placeholder values:

```env
MURF_API_KEY=your_actual_murf_api_key
GOOGLE_API_KEY=your_actual_google_api_key
DEEPGRAM_API_KEY=your_actual_deepgram_api_key
```

**Where to get API keys:**
- **Murf**: https://murf.ai (sign up/login)
- **Google Gemini**: https://ai.google.dev (free tier available)
- **Deepgram**: https://deepgram.com (free tier available)

### Frontend (`frontend/.env.local`)

The frontend `.env.local` is already configured for local development. No changes needed unless you're using LiveKit Cloud.

---

## 🚀 Starting the Application

### Option 1: Use the Startup Script (Recommended)

**On Windows (Git Bash):**
```bash
./start_app.sh
```

**On Windows (Command Prompt/PowerShell):**
```cmd
start_app.bat
```

### Option 2: Manual Start (3 Separate Terminals)

**Terminal 1 - LiveKit Server:**
```bash
livekit-server --dev
```

**Terminal 2 - Backend Agent:**
```bash
cd backend
source $HOME/.local/bin/env  # Only needed if uv not in PATH
uv run python src/agent.py dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
pnpm dev
```

---

## 🌐 Accessing the Application

Once all services are running:

- **Frontend**: http://localhost:3000
- **LiveKit Server**: ws://localhost:7880

Open your browser and navigate to http://localhost:3000 to interact with the voice agent.

---

## 🧪 Testing the Voice Agent

1. Open http://localhost:3000 in your browser
2. Click "Start call" or similar button
3. Allow microphone permissions when prompted
4. Speak to the agent and it will respond using:
   - **Deepgram** for speech-to-text (your voice → text)
   - **Google Gemini** for language understanding (text → response)
   - **Murf Falcon** for text-to-speech (response → voice)

---

## 🐛 Troubleshooting

### Issue: "uv: command not found"
**Solution:** Add uv to your PATH:
```bash
source $HOME/.local/bin/env
```
Or add `$HOME/.local/bin` to your PATH permanently.

### Issue: "livekit-server: command not found"
**Solution:** Install livekit-server (see installation section above).

### Issue: Backend fails to start
**Check:**
- API keys are set in `backend/.env.local`
- All dependencies installed: `cd backend && uv sync`
- Models downloaded: `cd backend && uv run python src/agent.py download-files`

### Issue: Frontend fails to start
**Check:**
- Dependencies installed: `cd frontend && pnpm install`
- `.env.local` exists in `frontend/` directory

### Issue: Can't connect to voice agent
**Check:**
- LiveKit server is running on port 7880
- Backend agent is running and connected
- Browser console for connection errors
- Firewall isn't blocking ports 7880 or 3000

---

## 📝 Next Steps

1. **Install livekit-server** (if not already done)
2. **Add your API keys** to `backend/.env.local`
3. **Start all services** using `start_app.sh` or manually
4. **Test the voice agent** at http://localhost:3000
5. **Customize the agent** by editing `backend/src/agent.py`

---

## 📚 Additional Resources

- [LiveKit Agents Documentation](https://docs.livekit.io/agents)
- [Murf AI Documentation](https://murf.ai/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Deepgram API](https://developers.deepgram.com)

---

**Happy coding! 🎙️✨**

