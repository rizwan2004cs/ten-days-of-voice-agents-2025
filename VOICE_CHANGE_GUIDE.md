# 🎙️ How to Change the Voice Agent's Voice

## Current Configuration

The voice is currently set in `backend/src/agent.py` at line 77:

```python
tts=murf.TTS(
    voice="en-US-matthew",  # ← Change this to change the voice
    style="Conversation",
    tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
    text_pacing=True
),
```

## Quick Change Steps

1. **Edit `backend/src/agent.py`**
2. **Change the `voice` parameter** (line 77)
3. **Restart the backend**

## Available Murf Voices

Murf offers a wide variety of voices. Here are some popular options:

### English (US) - Male Voices
- `en-US-matthew` (current) - Conversational, friendly
- `en-US-james` - Professional, clear
- `en-US-chris` - Warm, approachable
- `en-US-kenny` - Energetic, youthful

### English (US) - Female Voices
- `en-US-ella` - Professional, clear
- `en-US-sarah` - Friendly, conversational
- `en-US-rachel` - Warm, empathetic
- `en-US-michelle` - Energetic, upbeat

### English (UK) Voices
- `en-GB-alice` - British, professional
- `en-GB-charlie` - British, friendly
- `en-GB-george` - British, authoritative

### Other Languages
- `es-ES-maria` - Spanish (Spain)
- `fr-FR-amelie` - French
- `de-DE-klaus` - German
- `it-IT-fabiana` - Italian
- `pt-BR-fernanda` - Portuguese (Brazil)
- `ja-JP-akari` - Japanese
- `zh-CN-lulu` - Chinese (Mandarin)

## Example: Change to Female Voice

```python
tts=murf.TTS(
    voice="en-US-ella",  # Changed from "en-US-matthew"
    style="Conversation",
    tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
    text_pacing=True
),
```

## Voice Styles

You can also change the `style` parameter:
- `"Conversation"` - Natural conversational tone (current)
- `"Narration"` - Storytelling/narration style
- `"News"` - News anchor style
- `"Advertisement"` - Commercial/advertising style

## After Changing the Voice

1. **Save the file** (`backend/src/agent.py`)
2. **Restart the backend:**
   ```bash
   # Stop the current backend (Ctrl+C)
   cd backend
   source $HOME/.local/bin/env
   uv run python src/agent.py dev
   ```
3. **Test the new voice** at http://localhost:3000

## Finding More Voices

For a complete list of available Murf voices:
1. Visit: https://murf.ai/voices
2. Browse by language, gender, age, or use case
3. Note the voice ID (e.g., `en-US-ella`)
4. Use that ID in your code

## Pro Tips

- **Test different voices** to find the best fit for your use case
- **Match voice to use case**: Professional voices for business, friendly for customer service
- **Consider your audience**: Choose voices that resonate with your target users
- **Style matters**: The `style` parameter can dramatically change how the voice sounds

---

**Need help?** Check the Murf documentation or LiveKit Agents TTS documentation for more options.

