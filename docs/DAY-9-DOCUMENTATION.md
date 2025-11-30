# Day 9 - Voice-Driven E-commerce Assistant Documentation

> **Note**: This implementation is synchronized with the `day-9` branch. Make sure you're on the correct branch before running the application.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [How It Works](#how-it-works)
7. [Features](#features)
8. [API Endpoints](#api-endpoints)
9. [File Structure](#file-structure)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Day 9 Voice-Driven E-commerce Assistant is an Amazon-style shopping assistant that allows users to browse products and place orders through natural voice commands. The system combines:

- **Backend**: Python-based voice AI agent using LiveKit Agents
- **Frontend**: Next.js web application with Amazon-themed UI
- **Voice Pipeline**: Deepgram STT → Google Gemini LLM → Murf AI TTS
- **Storage**: Local JSON file for order persistence

### Key Capabilities
- Voice-based product browsing and search
- Real-time product filtering based on voice commands
- Voice-based order placement
- Live order status tracking
- Chat transcript visualization
- Amazon-style UI with product grid and order panel

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Product Grid │  │ Order Status │  │ Chat Transcript│   │
│  │  (Filtered)  │  │   (Live)     │  │   (Voice)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP API
┌─────────────────────────────────────────────────────────────┐
│              Backend API Routes (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ /api/products│  │ /api/orders  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│            Voice Agent (Python - LiveKit)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Deepgram    │  │   Gemini      │  │   Murf AI    │     │
│  │     STT      │→ │     LLM       │→ │     TTS      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ↓                  ↓                  ↓             │
│  User Speech →  Text →  Processing →  Response →  Audio    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Commerce Module (Python)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Product    │  │   Order      │  │   Search     │     │
│  │   Catalog    │  │  Management  │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                            ↓                                │
│                    orders.json (Storage)                    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Python 3.9+
- LiveKit Agents SDK
- Deepgram (Speech-to-Text)
- Google Gemini 2.5 Flash (LLM)
- Murf AI Falcon (Text-to-Speech)
- Silero VAD (Voice Activity Detection)
- PyTorch (for turn detector)

**Frontend:**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- LiveKit Client SDK
- Motion (animations)

**Storage:**
- JSON file (`backend/orders.json`)

---

## Setup & Installation

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Python** (3.9 or higher)
3. **UV** (Python package manager) - Install from https://github.com/astral-sh/uv
4. **API Keys:**
   - LiveKit Cloud account (https://cloud.livekit.io/)
   - Google Gemini API key (https://aistudio.google.com/app/apikey)
   - Deepgram API key (https://console.deepgram.com/)
   - Murf AI API key (https://murf.ai/)

### Installation Steps

1. **Clone/Navigate to the project and switch to day-9 branch:**
   ```bash
   cd "C:\voice AI Challenge\ten-days-of-voice-agents-2025"
   git checkout day-9
   ```
   
   > **Important**: Ensure you're on the `day-9` branch. This documentation and all features are specific to this branch.

2. **Backend Setup:**
   ```bash
   cd backend
   uv sync
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   # or
   pnpm install
   ```

4. **Configure Environment Variables:**
   ```bash
   # Copy the template
   cp env.template .env.local
   
   # Edit .env.local with your API keys
   ```

---

## Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Google Gemini API Key
GOOGLE_API_KEY=your-google-api-key

# Deepgram API Key
DEEPGRAM_API_KEY=your-deepgram-api-key

# Murf AI API Key
MURF_API_KEY=your-murf-api-key
```

### Backend Configuration

**File:** `backend/src/agent.py`

- **STT Model**: Deepgram Nova-3 (line 233)
- **LLM Model**: Google Gemini 2.5 Flash (line 237)
- **TTS Voice**: Murf AI - en-US-matthew (line 242)
- **TTS Style**: Conversation (line 243)

**File:** `backend/src/commerce.py`

- **Product Catalog**: 24 products across 3 categories
- **Order Storage**: `backend/orders.json`
- **Categories**: `electronics`, `home-security`, `smart-home`

### Frontend Configuration

**File:** `frontend/app-config.ts`

- Configure LiveKit connection settings
- Set agent name and other app-specific settings

---

## Running the Application

### Start Backend Agent

```bash
cd backend
uv run python src/agent.py dev
```

The agent will:
- Load the VAD model
- Connect to LiveKit
- Start listening for voice connections
- Log metrics and usage

### Start Frontend

```bash
cd frontend
npm run dev
# or
pnpm dev
```

The frontend will start on `http://localhost:3000` (or the next available port).

### Access the Application

1. Open your browser to `http://localhost:3000`
2. Click "Start Session" or allow microphone access
3. Begin speaking to the voice assistant

---

## How It Works

### Voice Interaction Flow

1. **User Speaks** → Microphone captures audio
2. **Deepgram STT** → Converts speech to text
3. **Google Gemini LLM** → Processes text, understands intent
4. **Function Tools** → LLM calls `browse_products()` or `place_order()`
5. **Commerce Module** → Executes business logic
6. **LLM Response** → Generates natural language response
7. **Murf AI TTS** → Converts response to speech
8. **User Hears** → Audio playback

### Product Browsing Flow

```
User: "Show me cameras"
  ↓
Agent calls: browse_products(search_term="camera")
  ↓
commerce.get_products() filters catalog
  ↓
Returns matching products
  ↓
Agent responds: "I found 4 products matching your search..."
  ↓
Frontend detects "camera" in conversation
  ↓
Product grid filters to show only cameras
```

### Order Placement Flow

```
User: "I want to buy echo dot"
  ↓
Agent calls: place_order(product_name_or_id="echo dot", quantity=1)
  ↓
find_product_by_name() resolves "echo dot" → "echo-dot-5"
  ↓
create_order() creates order object
  ↓
Order saved to orders.json
  ↓
Agent responds: "Order confirmed! Order ID: ..."
  ↓
Frontend polls /api/orders and updates UI
```

### Frontend Auto-Filtering

The frontend automatically filters products based on voice commands:

1. **Message Monitoring**: `useChatMessages()` hook captures all messages
2. **Keyword Detection**: Extracts product keywords from user/agent messages
3. **State Update**: Sets `searchTerm` state
4. **Product Filtering**: `filteredProducts` filters the product array
5. **UI Update**: Product grid updates to show only matching products

**Supported Keywords:**
- `camera`, `cameras` → filters to cameras
- `echo`, `echo dot`, `echo show` → filters to Echo products
- `kindle` → filters to Kindle products
- `fire tv`, `fire tablet` → filters to Fire products
- `doorbell`, `ring` → filters to doorbell/ring products
- `plug`, `smart plug` → filters to smart plugs
- `hue`, `light`, `bulb` → filters to smart lights
- `lock`, `smart lock` → filters to smart locks
- `thermostat`, `nest` → filters to thermostats
- `switch`, `smart switch` → filters to switches
- `tablet` → filters to tablets
- `alarm`, `security` → filters to security products

---

## Features

### 1. Voice Product Browsing

**User Commands:**
- "What products do you have?" → Shows all products
- "Show me cameras" → Filters to cameras
- "Do you have echo dot?" → Shows Echo Dot products
- "What electronics do you have?" → Filters by category

**Agent Behavior:**
- Always calls `browse_products()` function
- Returns formatted product list
- Mentions that products are filtered in UI

### 2. Visual Product Filtering

- Product grid automatically filters based on voice commands
- Shows count of filtered products
- "Clear filter" button to reset view
- Real-time updates as user speaks

### 3. Voice Order Placement

**User Commands:**
- "I want to buy echo dot"
- "Order echo show 8"
- "Buy 2 kindle paperwhite"
- "Place order for fire tv stick"

**Order Processing:**
- Product name resolution (fuzzy matching)
- Order creation with unique ID
- Total calculation
- Persistence to `orders.json`

### 4. Live Order Status

- Real-time order polling (every 1 second)
- Displays last 5 orders
- Shows order ID, items, quantity, total
- Order status badges
- Timestamp display

### 5. Chat Transcript

- Displays user and agent messages
- Real-time updates
- Scrollable message history
- Message bubbles with timestamps

---

## API Endpoints

### Frontend API Routes

#### `GET /api/products`

Returns the complete product catalog.

**Response:**
```json
[
  {
    "id": "echo-dot-5",
    "name": "Echo Dot (5th Gen)",
    "description": "Smart speaker with Alexa - Charcoal",
    "price": 4499,
    "currency": "INR",
    "category": "electronics",
    "image_url": "https://placehold.co/300x300/232F3E/FFFFFF?text=Echo+Dot",
    "rating": 4.5,
    "reviews": 12500
  },
  ...
]
```

#### `GET /api/orders`

Returns all orders from `backend/orders.json`.

**Response:**
```json
[
  {
    "id": "uuid-here",
    "items": [
      {
        "product_id": "echo-dot-5",
        "product_name": "Echo Dot (5th Gen)",
        "quantity": 1,
        "unit_amount": 4499,
        "currency": "INR"
      }
    ],
    "total": 4499,
    "currency": "INR",
    "status": "CONFIRMED",
    "created_at": "2025-01-XX..."
  },
  ...
]
```

#### `POST /api/connection-details`

Creates a LiveKit connection token for the frontend.

**Request Body:**
```json
{
  "agentName": "ecommerce-assistant"
}
```

**Response:**
```json
{
  "serverUrl": "wss://...",
  "participantToken": "..."
}
```

---

## File Structure

```
ten-days-of-voice-agents-2025/
├── backend/
│   ├── src/
│   │   ├── agent.py              # Main voice agent (STT/LLM/TTS)
│   │   └── commerce.py           # Product catalog & order management
│   ├── orders.json               # Order storage (generated)
│   ├── pyproject.toml            # Python dependencies
│   └── .env.local                # Environment variables
│
├── frontend/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── page.tsx          # Main page
│   │   │   └── layout.tsx        # App layout
│   │   └── api/
│   │       ├── products/
│   │       │   └── route.ts       # Products API endpoint
│   │       ├── orders/
│   │       │   └── route.ts       # Orders API endpoint
│   │       └── connection-details/
│   │           └── route.ts       # LiveKit token endpoint
│   ├── components/
│   │   ├── app/
│   │   │   ├── ecommerce-session-view.tsx  # Main e-commerce UI
│   │   │   ├── chat-transcript.tsx         # Chat display
│   │   │   └── view-controller.tsx         # View routing
│   │   └── livekit/
│   │       ├── agent-control-bar/          # Voice controls
│   │       └── chat-entry.tsx              # Message component
│   └── hooks/
│       └── useChatMessages.ts              # Chat message hook
│
└── .env.local                    # Environment variables (root)
```

---

## Detailed Component Breakdown

### Backend Components

#### `backend/src/agent.py`

**Purpose**: Main voice agent implementation

**Key Classes:**

1. **`Assistant(Agent)`**
   - Extends LiveKit `Agent` class
   - System prompt: Amazon shopping assistant instructions
   - Function tools:
     - `browse_products()`: Search and filter products
     - `place_order()`: Create orders
     - `get_last_order_info()`: Retrieve last order

2. **`entrypoint(ctx: JobContext)`**
   - Initializes voice pipeline
   - Configures STT, LLM, TTS
   - Sets up metrics collection
   - Starts agent session

**Voice Pipeline Configuration:**
```python
session = AgentSession(
    stt=deepgram.STT(model="nova-3"),           # Speech-to-Text
    llm=google.LLM(model="gemini-2.5-flash"),   # Language Model
    tts=murf.TTS(voice="en-US-matthew"),        # Text-to-Speech
    turn_detection=MultilingualModel(),          # Turn detection
    vad=ctx.proc.userdata["vad"],                # Voice Activity Detection
    preemptive_generation=True,                  # Generate while user speaks
)
```

#### `backend/src/commerce.py`

**Purpose**: E-commerce business logic

**Key Functions:**

1. **`get_products(category, max_price, search_term)`**
   - Filters product catalog
   - Supports category, price, and text search
   - Returns matching products

2. **`create_order(product_id, quantity)`**
   - Validates product exists
   - Calculates totals
   - Creates order object
   - Saves to `orders.json`
   - Returns order details

3. **`find_product_by_name(product_name)`**
   - Fuzzy product name matching
   - Handles partial matches
   - Returns best matching product

4. **`_load_orders()` / `_save_orders()`**
   - JSON file I/O operations
   - Error handling for file operations

**Product Catalog:**
- 24 products total
- Categories: `electronics`, `home-security`, `smart-home`
- Each product has: `id`, `name`, `description`, `price`, `currency`, `category`, `image_url`, `rating`, `reviews`

### Frontend Components

#### `frontend/components/app/ecommerce-session-view.tsx`

**Purpose**: Main e-commerce UI component

**Key Features:**

1. **Product Grid (Left Column)**
   - Displays products in responsive grid
   - Auto-filters based on voice commands
   - Shows product cards with image, name, rating, price
   - "Prime" badge on each product

2. **Live Order Status (Right Column - Top)**
   - Polls `/api/orders` every 1 second
   - Displays last 5 orders
   - Shows order details, items, totals
   - Status badges

3. **Chat Transcript (Right Column - Bottom)**
   - Displays voice conversation
   - User and agent messages
   - Real-time updates

4. **Auto-Filtering Logic**
   - Monitors chat messages
   - Extracts product keywords
   - Updates `searchTerm` state
   - Filters product grid

#### `frontend/hooks/useChatMessages.ts`

**Purpose**: Merges chat messages and transcriptions

**Functionality:**
- Uses `useTranscriptions()` from LiveKit
- Uses `useChat()` from LiveKit
- Merges and sorts by timestamp
- Returns unified message list

#### `frontend/app/api/products/route.ts`

**Purpose**: Product catalog API endpoint

**Functionality:**
- Returns hardcoded product catalog
- Matches `backend/src/commerce.py` catalog
- JSON response

#### `frontend/app/api/orders/route.ts`

**Purpose**: Orders API endpoint

**Functionality:**
- Reads `backend/orders.json`
- Handles file not found (returns empty array)
- Returns all orders as JSON

---

## Voice Commands Examples

### Product Browsing

| User Says | Agent Action | Frontend Action |
|-----------|-------------|-----------------|
| "What products do you have?" | `browse_products()` | Shows all products |
| "Show me cameras" | `browse_products(search_term="camera")` | Filters to cameras |
| "Do you have echo dot?" | `browse_products(search_term="echo dot")` | Filters to Echo products |
| "What electronics do you have?" | `browse_products(category="electronics")` | Filters to electronics |
| "Show me products under 5000" | `browse_products(max_price=5000)` | Filters by price |

### Order Placement

| User Says | Agent Action | Result |
|-----------|-------------|--------|
| "I want to buy echo dot" | `place_order("echo dot")` | Order created, UI updates |
| "Order echo show 8" | `place_order("echo show 8")` | Order created |
| "Buy 2 kindle paperwhite" | `place_order("kindle paperwhite", 2)` | Order with quantity 2 |
| "Place order for fire tv stick" | `place_order("fire tv stick")` | Order created |

### Order Queries

| User Says | Agent Action | Result |
|-----------|-------------|--------|
| "What did I order?" | `get_last_order_info()` | Shows last order details |
| "Show me my last order" | `get_last_order_info()` | Shows last order details |

---

## Troubleshooting

### Common Issues

#### 1. "Internal error while fetching products"

**Cause**: Invalid input types or missing product fields

**Solution**: 
- Check backend logs for detailed error
- Ensure all products in catalog have required fields
- Verify function tool parameters

#### 2. Agent says "I can't fulfil the request"

**Cause**: Agent not calling `browse_products()` function

**Solution**:
- Check agent instructions in `agent.py`
- Ensure function tool is properly registered
- Verify LLM is receiving function definitions

#### 3. Products not filtering in UI

**Cause**: Keyword not detected in messages

**Solution**:
- Check `productKeywords` mapping in `ecommerce-session-view.tsx`
- Verify messages are being captured by `useChatMessages()`
- Check browser console for errors

#### 4. Orders not appearing

**Cause**: File path issues or polling not working

**Solution**:
- Verify `orders.json` exists in `backend/` directory
- Check `/api/orders` endpoint returns data
- Verify polling interval (should be 1000ms)
- Check file permissions

#### 5. Agent not listening

**Cause**: Microphone permissions or STT issues

**Solution**:
- Grant microphone permissions in browser
- Check Deepgram API key is valid
- Verify LiveKit connection
- Check browser console for errors

#### 6. Text not visible in chat transcript

**Cause**: Transcriptions not being forwarded

**Solution**:
- This is a known limitation - transcriptions may not always appear
- Check LiveKit Agents version
- Verify session configuration
- Text visibility depends on LiveKit Agents transcription forwarding

### Debugging

**Backend Logs:**
```bash
cd backend
uv run python src/agent.py dev
# Watch for function tool calls and errors
```

**Frontend Console:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls
- Verify WebSocket connection to LiveKit

**Check Orders File:**
```bash
cat backend/orders.json
# or on Windows
type backend\orders.json
```

---

## Product Catalog

The system includes **24 products** across 3 categories:

### Electronics (14 products)
- Echo Dot (5th Gen) - ₹4,499
- Echo Show 8 - ₹8,999
- Echo Show 10 (3rd Gen) - ₹24,999
- Echo Studio - ₹22,999
- Echo Buds (2nd Gen) - ₹8,999
- Kindle Paperwhite - ₹13,999
- Kindle Oasis - ₹27,999
- Fire TV Stick 4K - ₹4,999
- Fire TV Cube (3rd Gen) - ₹12,999
- Fire HD 10 Tablet - ₹12,499
- Roku Express 4K+ - ₹3,999
- TP-Link Smart Plug - ₹999
- And more...

### Home Security (5 products)
- Ring Video Doorbell - ₹9,999
- Blink Outdoor Camera - ₹7,999
- Blink Mini Camera - ₹2,999
- Ring Floodlight Cam Wired Pro - ₹18,999
- Ring Alarm 8-Piece Kit - ₹24,999
- Wyze Cam v3 - ₹3,499

### Smart Home (5 products)
- TP-Link Smart Plug - ₹999
- Philips Hue White and Color Ambiance - ₹5,499
- August Smart Lock Pro - ₹19,999
- Google Nest Learning Thermostat - ₹15,999
- TP-Link Kasa Smart Wi-Fi Light Switch - ₹1,999

---

## Development Commands

### Backend

```bash
# Install dependencies
cd backend
uv sync

# Run agent in development mode
uv run python src/agent.py dev

# Run tests
uv run pytest

# Format code
uv run ruff format .
```

### Frontend

```bash
# Install dependencies
cd frontend
npm install
# or
pnpm install

# Run development server
npm run dev
# or
pnpm dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Architecture Decisions

### Why JSON Storage?

- Simple and lightweight
- No database setup required
- Easy to inspect and debug
- Sufficient for demo/prototype

### Why Separate Frontend/Backend Catalogs?

- Frontend needs immediate access without API calls
- Backend catalog is source of truth
- Both must be kept in sync manually
- Future: Could be unified via API

### Why Auto-Filtering in Frontend?

- Provides immediate visual feedback
- Works even if agent response is delayed
- Enhances user experience
- Keyword-based matching is fast

### Why Function Tools?

- Allows LLM to call backend functions
- Type-safe function definitions
- Automatic parameter validation
- Clear separation of concerns

---

## Future Enhancements

Potential improvements:

1. **Database Integration**: Replace JSON with SQLite/PostgreSQL
2. **Unified Product API**: Single source of truth for catalog
3. **User Authentication**: Multi-user order tracking
4. **Payment Integration**: Real payment processing
5. **Order History**: Full order history with search
6. **Product Recommendations**: AI-powered suggestions
7. **Voice Shopping Cart**: Add to cart before checkout
8. **Order Modifications**: Cancel or modify orders
9. **Product Reviews**: Voice-based review system
10. **Inventory Management**: Stock tracking

---

## Support & Resources

- **LiveKit Agents Docs**: https://docs.livekit.io/agents/
- **Deepgram Docs**: https://developers.deepgram.com/
- **Google Gemini Docs**: https://ai.google.dev/docs
- **Murf AI Docs**: https://murf.ai/developers
- **Next.js Docs**: https://nextjs.org/docs

---

## License

See LICENSE file in project root.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Branch**: day-9
**Author**: Day 9 Voice Agent Challenge

> **Note**: This documentation is synchronized with the `day-9` branch. Ensure you're working on the correct branch when following this guide.

