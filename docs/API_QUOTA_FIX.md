# API Quota Exceeded - Solution Guide

## Problem Identified

**Error:** Google Gemini API quota exceeded
- Status: `429 Too Many Requests`
- Quota Limit: `250 requests/day` (Free Tier)
- Current Status: **QUOTA EXCEEDED**

## Error Details from Logs:
```
"You exceeded your current quota, please check your plan and billing details"
Quota: "GenerateRequestsPerDayPerProjectPerModel-FreeTier"
Limit: 250 requests per day
Model: gemini-2.5-flash
```

## Solutions

### Option 1: Wait for Quota Reset (Easiest)
- Free tier quota resets daily
- Check your usage: https://ai.dev/usage?tab=rate-limit
- Wait until quota resets (usually at midnight UTC)

### Option 2: Upgrade to Paid Tier
1. Go to Google Cloud Console
2. Enable billing for Gemini API
3. Upgrade to paid tier (higher limits)
4. Update your API key if needed

### Option 3: Switch to a Different LLM Model
You can temporarily switch to a different model in `backend/src/agent.py`:

**Option 3a: Use OpenAI (if you have an API key)**
```python
from livekit.plugins import openai

llm=openai.LLM(model="gpt-4o-mini"),
```

**Option 3b: Use Anthropic Claude (if you have an API key)**
```python
from livekit.plugins import anthropic

llm=anthropic.LLM(model="claude-3-haiku-20240307"),
```

### Option 4: Reduce API Calls
- This is difficult for a voice agent as it needs to respond to every user input
- Not recommended for this use case

## Current Status
- ✅ Backend agent is running
- ✅ Agent is registered with LiveKit
- ✅ STT (Deepgram) is working
- ✅ TTS (Murf) is likely working
- ❌ LLM (Google Gemini) - QUOTA EXCEEDED

## Quick Check
Visit: https://ai.dev/usage?tab=rate-limit
This will show your current usage and when quota resets.

