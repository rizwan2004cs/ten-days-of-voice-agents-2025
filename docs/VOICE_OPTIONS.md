# 🎙️ Voice Options for Your AI Agent

## Current Voice
- **Voice ID**: `en-US-matthew`
- **Type**: Male, US English
- **Style**: Conversation

## How to Change the Voice

### Step 1: Edit `backend/src/agent.py`

Find line 77 and change the `voice` parameter:

```python
tts=murf.TTS(
    voice="en-US-matthew",  # ← Change this value
    style="Conversation",
    tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
    text_pacing=True
),
```

### Step 2: Restart the Backend

After changing the voice, restart the backend for changes to take effect.

---

## Popular Voice Options

### English (US) - Male
- `en-US-matthew` - Current: Conversational, friendly
- `en-US-james` - Professional, clear
- `en-US-chris` - Warm, approachable
- `en-US-kenny` - Energetic, youthful

### English (US) - Female
- `en-US-ella` - Professional, clear
- `en-US-sarah` - Friendly, conversational
- `en-US-rachel` - Warm, empathetic
- `en-US-michelle` - Energetic, upbeat
- `en-US-lisa` - Calm, soothing

### English (UK)
- `en-GB-alice` - British, professional (female)
- `en-GB-charlie` - British, friendly (male)
- `en-GB-george` - British, authoritative (male)

### Other Languages
- `es-ES-maria` - Spanish (Spain, female)
- `fr-FR-amelie` - French (female)
- `de-DE-klaus` - German (male)
- `it-IT-fabiana` - Italian (female)
- `pt-BR-fernanda` - Portuguese/Brazil (female)
- `ja-JP-akari` - Japanese (female)
- `zh-CN-lulu` - Chinese/Mandarin (female)

## Voice Styles

You can also change the `style` parameter (line 78):
- `"Conversation"` - Natural conversational tone (current)
- `"Narration"` - Storytelling/narration style
- `"News"` - News anchor style
- `"Advertisement"` - Commercial/advertising style

## Example: Change to Female Voice

```python
tts=murf.TTS(
    voice="en-US-ella",  # Changed to female voice
    style="Conversation",
    tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
    text_pacing=True
),
```

## Finding More Voices

For a complete list of all available Murf voices:
1. Visit: https://murf.ai/voices
2. Browse by language, gender, age, or use case
3. Note the voice ID (format: `language-locale-name`)
4. Use that ID in your code

---

**After changing the voice, restart the backend to hear the new voice!**

