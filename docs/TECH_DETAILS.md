# Technical Details - Voice AI Agents Challenge Project

## Project Overview

This is a **monorepo** for building voice AI agents as part of the **Murf AI Voice Agents Challenge**. The project implements a voice-first improv game show (Day 10) using LiveKit Agents framework with Murf Falcon TTS integration.

## Architecture

### System Architecture
- **Backend**: Python-based LiveKit Agents server
- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Real-time Communication**: LiveKit WebRTC infrastructure
- **Voice Pipeline**: STT → LLM → TTS with turn detection

### Repository Structure
```
ten-days-of-voice-agents-2025/
├── backend/          # Python LiveKit Agents backend
│   ├── src/
│   │   └── agent.py  # Main agent implementation
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/         # Next.js React frontend
│   ├── app/          # Next.js app router
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   └── package.json
└── challenges/       # Daily challenge tasks
```

## Backend Technology Stack

### Core Framework
- **LiveKit Agents** (`livekit-agents~=1.2`): Voice AI agent framework
- **Python 3.9+**: Runtime environment
- **uv**: Modern Python package manager

### AI/ML Models & Services

#### Speech-to-Text (STT)
- **Deepgram Nova-3**: Primary STT model
  - Provider: `livekit.plugins.deepgram`
  - Model: `"nova-3"`

#### Large Language Model (LLM)
- **Google Gemini 2.5 Flash**: Primary LLM
  - Provider: `livekit.plugins.google`
  - Model: `"gemini-2.5-flash"`
  - Used for: Conversation logic, improv scenario generation, host reactions

#### Text-to-Speech (TTS)
- **Murf Falcon**: Ultra-fast TTS API
  - Provider: `livekit-murf>=0.1.0`
  - Voice: `"en-US-matthew"`
  - Style: `"Conversation"`
  - Features:
    - Sentence tokenization with `tokenize.basic.SentenceTokenizer`
    - Text pacing enabled
    - Streaming support

#### Voice Activity Detection (VAD)
- **Silero VAD**: Voice activity detection
  - Provider: `livekit.plugins.silero`
  - Used for: Detecting when user starts/stops speaking

#### Turn Detection
- **Multilingual Turn Detector**: Contextually-aware speaker detection
  - Provider: `livekit.plugins.turn_detector.multilingual.MultilingualModel`
  - Features: Multilingual support, contextual turn-taking

#### Noise Cancellation
- **BVC (Background Voice Cancellation)**: LiveKit Cloud noise cancellation
  - Provider: `livekit.plugins.noise_cancellation.BVC()`
  - Used in: `RoomInputOptions` for telephony-quality audio

### Backend Dependencies
```python
dependencies = [
    "livekit-agents[assemblyai,deepgram,google,silero,turn-detector]~=1.2",
    "livekit-murf>=0.1.0",
    "livekit-plugins-noise-cancellation~=0.2",
    "python-dotenv",
]
```

### Agent Implementation Details

#### Agent Class Structure
```python
class Assistant(Agent):
    def __init__(self):
        super().__init__(
            instructions="""[System prompt defining agent persona]"""
        )
```

#### Session Configuration
- **Preemptive Generation**: Enabled (LLM generates response while waiting for turn end)
- **Room Input Options**: BVC noise cancellation enabled
- **Metrics Collection**: Integrated usage tracking

#### Key Features
- Real-time voice interaction
- Turn-based conversation management
- Background voice cancellation
- Metrics and logging
- Production-ready Dockerfile

## Frontend Technology Stack

### Core Framework
- **Next.js 15.5.2**: React framework with App Router
- **React 19.0.0**: UI library
- **TypeScript 5**: Type safety
- **Turbopack**: Fast bundler (dev mode)

### LiveKit Integration
- **livekit-client** (`^2.15.8`): Client SDK for WebRTC
- **@livekit/components-react** (`^2.9.15`): React components
- **livekit-server-sdk** (`^2.13.2`): Server-side token generation

### UI Libraries
- **Tailwind CSS 4**: Styling
- **Radix UI**: Accessible component primitives
  - `@radix-ui/react-select`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-toggle`
- **Phosphor Icons**: Icon library
- **Motion** (`^12.16.0`): Animations
- **Sonner**: Toast notifications

### Frontend Architecture

#### Connection Flow
1. User clicks "Start Improv Battle" in welcome view
2. Frontend calls `/api/connection-details` endpoint
3. Backend generates LiveKit participant token
4. Frontend connects to LiveKit room using `livekit-client`
5. Agent automatically joins room (triggered by LiveKit Cloud)

#### Key Components
- **WelcomeView**: Join screen with name input
- **SessionView**: Active voice session interface
- **AgentControlBar**: Controls for mic, camera, screen share, chat
- **ChatTranscript**: Real-time conversation transcript

#### Custom Hooks
- `useRoom`: Manages LiveKit room connection
- `useChatMessages`: Handles chat/transcript messages
- `useConnectionTimeout`: Handles connection timeouts
- `useInputControls`: Manages media device controls

### Frontend Configuration
- **App Config** (`app-config.ts`): Centralized UI configuration
  - Branding (logo, colors, company name)
  - Feature flags (chat, video, screen share)
  - Theme support (light/dark)

## Day 10 Implementation Requirements

### Game State Management
```python
improv_state = {
    "player_name": None,
    "current_round": 0,
    "max_rounds": 3,
    "rounds": [],  # {"scenario": str, "host_reaction": str}
    "phase": "intro",  # "intro" | "awaiting_improv" | "reacting" | "done"
}
```

### Host Persona
- **Role**: TV improv show host ("Improv Battle")
- **Style**: High-energy, witty, clear about rules
- **Reactions**: Varied (amused, unimpressed, pleasantly surprised)
- **Tone**: Mix of supportive, neutral, and mildly critical (constructive)

### Game Flow
1. **Intro Phase**: Host introduces show and explains rules
2. **Round Loop** (3-5 rounds):
   - Host sets scenario
   - Player improvises
   - Host reacts and moves to next round
3. **Closing**: Summary of player's improv style and standout moments

### Scenario Examples
- "You are a time-travelling tour guide explaining modern smartphones to someone from the 1800s."
- "You are a restaurant waiter who must calmly tell a customer that their order has escaped the kitchen."
- "You are a customer trying to return an obviously cursed object to a very skeptical shop owner."

### End-of-Scene Detection
- Specific phrase detection ("End scene")
- Maximum time/turn limits
- Pause-based heuristics

## Environment Variables

### Backend (.env.local)
```env
LIVEKIT_URL=https://your-livekit-server-url
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
MURF_API_KEY=your_murf_api_key
GOOGLE_API_KEY=your_google_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Frontend (.env.local)
```env
LIVEKIT_URL=https://your-livekit-server-url
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

## Development Workflow

### Running Locally
1. **LiveKit Server**: `livekit-server --dev`
2. **Backend**: `cd backend && uv run python src/agent.py dev`
3. **Frontend**: `cd frontend && pnpm dev`

### Convenience Script
```bash
./start_app.sh  # Starts all services
```

### Testing
```bash
cd backend
uv run pytest
```

## Key LiveKit Concepts

### Agent Session
- Manages the complete voice AI pipeline
- Handles STT, LLM, TTS coordination
- Manages turn detection and VAD

### Room Connection
- WebRTC-based real-time communication
- Automatic agent joining via LiveKit Cloud
- Token-based authentication

### Turn Detection
- Contextually-aware speaker detection
- Multilingual support
- Prevents interruptions

### Tools & Functions
- `@function_tool` decorator for adding capabilities
- Example: Weather lookup, API integrations

## Production Deployment

### Backend
- Dockerfile included
- Deployable to LiveKit Cloud or self-hosted
- Environment-based configuration

### Frontend
- Next.js production build: `pnpm build`
- Static export support
- Environment variable configuration

## Resources & Documentation

- [Murf Falcon TTS Docs](https://murf.ai/api/docs/text-to-speech/streaming)
- [LiveKit Agents Docs](https://docs.livekit.io/agents)
- [LiveKit Prompting Guide](https://docs.livekit.io/agents/build/prompting/)
- [LiveKit Tools Guide](https://docs.livekit.io/agents/build/tools/)
- [LiveKit Nodes Reference](https://docs.livekit.io/agents/build/nodes/)

## Advanced Features (Optional)

### Multi-Player Support
- Room code-based joining
- Turn-based relay improv
- Player role assignment (P1/P2)
- Transition quality assessment

### Scoreboard UI
- Per-player scoring
- Qualitative tags ("Bold", "Story-focused")
- Real-time updates via data messages

## Performance Optimizations

- **Preemptive Generation**: LLM generates while waiting for turn end
- **Text Pacing**: Murf Falcon text pacing for natural speech
- **Sentence Tokenization**: Efficient TTS streaming
- **Pre-connect Buffer**: Reduced latency for audio input
- **Background Voice Cancellation**: Improved audio quality

## Security Considerations

- Token-based authentication
- Environment variable secrets
- Secure WebRTC connections
- No hardcoded credentials

## Testing Framework

- LiveKit Agents testing framework
- Pytest with asyncio support
- Evaluation suite included
- Metrics collection for performance monitoring

