# 🔑 API Keys Setup - Required for Voice Agent

## ❌ Current Issue

Your backend `.env.local` file still has placeholder API keys. The agent is listening but **cannot process or respond** because it needs valid API keys for:

1. **Deepgram** - Speech-to-Text (converts your voice to text)
2. **Google Gemini** - Language Model (generates responses)
3. **Murf** - Text-to-Speech (converts responses to voice)

## ✅ Solution: Add Your API Keys

### Step 1: Get Your API Keys

#### 1. Google Gemini API Key (for LLM)
- Visit: https://ai.google.dev
- Sign in with your Google account
- Go to "API Keys" section
- Click "Create API Key"
- Copy the key

#### 2. Deepgram API Key (for Speech-to-Text)
- Visit: https://deepgram.com
- Sign up for a free account
- Go to API Keys section
- Create a new API key
- Copy the key

#### 3. Murf API Key (for Text-to-Speech)
- Visit: https://murf.ai
- Sign up/login
- Go to API section
- Get your API key
- Copy the key

### Step 2: Update backend/.env.local

Edit the file `backend/.env.local` and replace the placeholder values:

```env
# Replace these lines:
MURF_API_KEY=your_murf_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# With your actual keys:
MURF_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxx
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart the Backend

After updating the API keys, restart the backend agent:

```bash
# Stop the current backend (Ctrl+C in the terminal)
# Then restart:
cd backend
source $HOME/.local/bin/env
uv run python src/agent.py dev
```

Or restart all services:
```bash
./start_app.sh
```

## 🔍 How to Verify It's Working

After adding API keys and restarting:

1. **Check backend logs** for errors:
   ```bash
   tail -f /tmp/backend.log
   ```
   - ✅ Should see: "starting worker", "initializing process"
   - ❌ Should NOT see: "401", "Invalid", "authentication error"

2. **Test the voice agent:**
   - Open http://localhost:3000
   - Click "Start call"
   - Speak clearly into your microphone
   - The agent should respond with voice

3. **Look for these in logs:**
   - `stt_audio_duration` > 0 (audio being processed)
   - `llm_input_text_tokens` > 0 (text sent to LLM)
   - `tts_characters_count` > 0 (response being generated)

## 💡 Quick Test

If you want to test with just one API key first:

1. **Start with Google Gemini** (easiest to get, free tier available)
2. Add it to `.env.local`
3. Restart backend
4. Try speaking - you should at least see errors about missing Deepgram/Murf keys, which confirms Google key works

## 🆘 Troubleshooting

### Error: "401 Unauthorized"
- **Cause:** Invalid API key
- **Fix:** Double-check the API key is correct (no extra spaces, complete key)

### Error: "Invalid response"
- **Cause:** API key format is wrong or service is down
- **Fix:** Verify the key format matches the service's documentation

### Agent still not responding
- **Check:** Are all three keys set? (Deepgram, Google, Murf)
- **Check:** Did you restart the backend after updating keys?
- **Check:** Browser console for frontend errors

## 📝 Notes

- **Free tiers available:** All three services offer free tiers for testing
- **Security:** Never commit `.env.local` to git (it's already in .gitignore)
- **Rate limits:** Free tiers have usage limits, but enough for testing

---

**Once you add the API keys and restart, the agent will be able to:**
1. ✅ Hear your voice (Deepgram)
2. ✅ Understand what you said (Google Gemini)
3. ✅ Respond with voice (Murf)

