# How to Switch to a Different Google Account's API Key

## The Problem
Your current Google API key has exceeded its quota. You can use a different Google account's API key to continue.

## Steps to Get a New API Key

### 1. Get API Key from Different Google Account

1. **Go to Google AI Studio:**
   - Visit: https://aistudio.google.com/apikey
   - **Important:** Sign in with a DIFFERENT Google account (not the one that's hitting quota limits)

2. **Create API Key:**
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy the API key that's generated

### 2. Update Your .env.local File

1. **Open the file:**
   ```
   backend/.env.local
   ```

2. **Update or add the GOOGLE_API_KEY:**
   ```env
   GOOGLE_API_KEY=your_new_api_key_here
   ```

3. **Save the file**

### 3. Restart Backend Agent

1. **Stop the backend agent** (Ctrl+C in the backend terminal)

2. **Restart it:**
   ```bash
   cd backend
   python -m uv run python src/agent.py dev
   ```

3. **Verify it's working:**
   - You should see: `✅ Voice AI pipeline configured successfully`
   - No errors about API keys

## Current Configuration

- **Model:** `gemini-2.5-flash` (Flash model - faster and cheaper than Pro)
- **Why Flash?** 
  - Faster response times
  - Lower cost
  - Good quality for voice conversations
  - Free tier available

## Troubleshooting

### Error: "GOOGLE_API_KEY not found"
- Make sure the key is in `backend/.env.local`
- Make sure there are no extra spaces or quotes around the key
- Restart the backend agent after adding the key

### Error: "429 Too Many Requests" (Quota Exceeded)
- The new API key also hit quota limits
- Wait for quota reset (usually daily)
- Or use another Google account

### Error: "Invalid API Key"
- Check that you copied the full key
- Make sure there are no extra characters
- Verify the key is active in Google AI Studio

## Multiple API Keys

If you want to switch between multiple keys easily, you can:

1. **Create multiple .env files:**
   - `backend/.env.local` (default)
   - `backend/.env.account1`
   - `backend/.env.account2`

2. **Switch by copying:**
   ```bash
   cp backend/.env.account1 backend/.env.local
   ```

3. **Restart the backend agent**

## Free Tier Limits

Google Gemini Flash free tier typically includes:
- 15 requests per minute (RPM)
- 1 million tokens per day
- 1,500 requests per day

If you exceed these, you'll need to:
- Wait for the daily reset
- Upgrade to a paid plan
- Use a different Google account

