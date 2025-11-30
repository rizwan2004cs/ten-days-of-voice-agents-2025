# E-commerce Voice Agent - Internal Architecture Summary

## Overview
This document explains how the Day 9 E-commerce Voice Agent works internally, including the flow of data, function calls, and UI updates.

---

## 🏗️ Architecture Overview

```
User Voice Input
    ↓
[Deepgram STT] → Converts speech to text
    ↓
[Google Gemini LLM] → Processes text, decides which function to call
    ↓
[Function Tools] → Executes Python functions (browse_products, place_order, etc.)
    ↓
[Murf TTS] → Converts response to speech
    ↓
[LiveKit Data Channel] → Sends filter metadata to frontend
    ↓
[Frontend React] → Updates UI (product grid, orders)
```

---

## 📁 File Structure & Responsibilities

### Backend Files

#### `backend/src/agent.py`
**Purpose:** Main voice agent that handles conversation and function tool calls.

**Key Components:**
- **`Assistant` class** (inherits from `Agent`):
  - System prompt: "You are an Amazon shopping assistant. Concise, helpful. You can browse products and place orders. Always summarize the order price before confirming."
  - Defines 9 function tools using `@function_tool` decorator

**Function Tools:**
1. **`browse_products()`** - Searches and filters products
   - Parameters: `search_term`, `category`, `max_price`, `min_price`, `sort_by`
   - Calls: `commerce.get_products()`
   - Sends filter metadata via LiveKit data channel (`publish_data` with topic "chat")
   - Returns: Formatted product list string

2. **`place_order()`** - Places a direct order
   - Parameters: `product_name_or_id`, `quantity`
   - Calls: `commerce.find_product_by_name()` → `commerce.create_order()`
   - Returns: Order confirmation message

3. **`get_last_order_info()`** - Gets most recent order
   - Calls: `commerce.get_last_order()`
   - Returns: Order summary string

4. **`get_order_history()`** - Gets all past orders
   - Calls: `commerce.get_all_orders()`
   - Returns: List of all orders

5. **`add_to_cart()`** - Adds product to cart
   - Parameters: `product_name_or_id`, `quantity`
   - Calls: `commerce.add_to_cart()`
   - Saves to: `cart.json`

6. **`view_cart()`** - Views current cart
   - Calls: `commerce.get_cart()`
   - Returns: Cart contents summary

7. **`remove_from_cart()`** - Removes item from cart
   - Parameters: `product_name_or_id`
   - Calls: `commerce.remove_from_cart()`

8. **`checkout_cart()`** - Converts cart to order
   - Calls: `commerce.checkout_cart()`
   - Creates order and clears cart

9. **`get_product_details()`** - Gets product information
   - Parameters: `product_name_or_id`
   - Calls: `commerce.find_product_by_name()`
   - Returns: Detailed product info

**Voice Pipeline Configuration:**
- **STT:** `deepgram.STT(model="nova-3")` - Converts user speech to text
- **LLM:** `google.LLM(model="gemini-2.5-flash")` - Processes text and calls functions
- **TTS:** `murf.TTS(voice="en-US-matthew")` - Converts agent response to speech
- **VAD:** `silero.VAD` - Detects when user is speaking

**Key Flow:**
```python
User speaks → STT converts to text → LLM processes → LLM calls function tool → 
Function executes → Returns result → LLM formats response → TTS speaks response
```

---

#### `backend/src/commerce.py`
**Purpose:** Merchant API layer - handles all product catalog and order management.

**Key Components:**

1. **`CATALOG`** (List of 18 products):
   - Each product has: `id`, `name`, `description`, `price`, `currency`, `category`, `image_url`, `rating`, `reviews`
   - Hardcoded Amazon-style products (Echo Dot, Kindle, Fire TV, etc.)

2. **`get_products()`** function:
   - Parameters: `category`, `max_price`, `min_price`, `search_term`, `sort_by`
   - Filters products by:
     - Category (exact match)
     - Price range (min/max)
     - Search term (matches name, description, category)
   - Sorts by: price (asc/desc), rating (desc), name (A-Z/Z-A)
   - Returns: Filtered and sorted list of products

3. **`create_order()`** function:
   - Parameters: `product_id`, `quantity`
   - Finds product in catalog
   - Calculates total: `price * quantity`
   - Creates order object:
     ```python
     {
       "id": uuid4(),
       "items": [{"product_id", "product_name", "quantity", "unit_amount", "currency"}],
       "total": calculated_total,
       "currency": "INR",
       "status": "CONFIRMED",
       "created_at": datetime.utcnow().isoformat()
     }
     ```
   - Appends to `orders.json` file
   - Returns: Order dictionary

4. **Cart Management Functions:**
   - `add_to_cart()` - Adds/updates items in `cart.json`
   - `get_cart()` - Reads from `cart.json`
   - `remove_from_cart()` - Removes item from `cart.json`
   - `clear_cart()` - Empties `cart.json`
   - `checkout_cart()` - Creates order from cart, then clears cart

5. **Order History Functions:**
   - `get_last_order()` - Returns most recent order from `orders.json`
   - `get_all_orders()` - Returns all orders from `orders.json`

6. **Helper Functions:**
   - `find_product_by_name()` - Fuzzy matching to find products by name
   - `_load_orders()` / `_save_orders()` - File I/O for `orders.json`
   - `_load_cart()` / `_save_cart()` - File I/O for `cart.json`

**Data Persistence:**
- **`orders.json`** - Stores all orders (created in `backend/` directory)
- **`cart.json`** - Stores current shopping cart (created in `backend/` directory)

---

### Frontend Files

#### `frontend/components/app/ecommerce-session-view.tsx`
**Purpose:** Main React component that renders the e-commerce storefront UI.

**Key Features:**

1. **State Management:**
   - `products` - All products from catalog
   - `orders` - All orders (polled from API)
   - `searchTerm`, `filterCategory`, `filterMaxPrice`, `filterMinPrice`, `sortBy` - Filter state
   - `sidebarOpen` - Controls order history sidebar
   - `isListening`, `isAgentSpeaking` - Voice activity indicators

2. **Data Fetching:**
   - **Products:** Fetches from `/api/products` on mount
   - **Orders:** Polls `/api/orders` every 2.5 seconds (real-time updates)

3. **LiveKit Integration:**
   - **Data Channel Listener:** Listens for `RoomEvent.DataReceived` with topic "chat"
   - **Filter Metadata Parsing:** Extracts `[FILTER:...]` metadata from data messages
   - **Voice Activity Monitoring:** Tracks `isSpeaking` events for microphone indicator

4. **Filter Metadata Flow:**
   ```
   Backend sends: [FILTER:search_term=camera,category=electronics,sort_by=price_asc]
   ↓
   Frontend receives via RoomEvent.DataReceived
   ↓
   Parses metadata string
   ↓
   Updates filter state (setSearchTerm, setFilterCategory, setSortBy, etc.)
   ↓
   useMemo recalculates filteredProducts
   ↓
   UI updates to show filtered/sorted products
   ```

5. **Product Filtering & Sorting:**
   - `filteredProducts` (useMemo hook):
     - Filters by: search term, category, price range
     - Sorts by: price, rating, name (based on `sortBy` state)
     - Recalculates when filter state changes

6. **UI Components:**
   - **Navbar:** Amazon-style (#232F3E), logo, search bar, microphone indicator, hamburger menu
   - **Product Grid:** Responsive grid (1-4 columns), Amazon-style cards
   - **Order Sidebar:** Slide-out drawer (hidden by default), shows recent orders
   - **Bottom Bar:** "START CALL" button (when inactive) or control bar (when active)

7. **Auto-Open Sidebar:**
   - When new order detected (order count increases), sidebar auto-opens for 3 seconds

---

#### `frontend/app/api/products/route.ts`
**Purpose:** Next.js API route that serves the product catalog.

**Function:**
- **GET `/api/products`**: Returns hardcoded `CATALOG` array (matches backend catalog)
- Used by frontend to display products in the grid

---

#### `frontend/app/api/orders/route.ts`
**Purpose:** Next.js API route that reads/writes orders.

**Functions:**
- **GET `/api/orders`**: 
  - Reads `backend/orders.json` file
  - Returns array of orders (or empty array if file doesn't exist)
  - Frontend polls this every 2.5 seconds

- **POST `/api/orders`**:
  - Accepts: `{ product_id, quantity }`
  - Creates order (matches backend `create_order` logic)
  - Writes to `backend/orders.json`
  - Used by "Buy Now" buttons on product cards

---

#### `frontend/components/app/view-controller.tsx`
**Purpose:** Routes between welcome screen and session views.

**Logic:**
- Checks if Day 9: `NEXT_PUBLIC_AGENT_DAY === '9'`
- **For Day 9:**
  - Always shows `EcommerceSessionView` (even when session not active)
  - No welcome screen
- **For other days:**
  - Shows `WelcomeView` when inactive
  - Shows `SessionView` when active

---

#### `frontend/lib/catalog.ts`
**Purpose:** Shared product catalog constant (used by frontend API routes).

**Content:** Same 18 products as backend `CATALOG`

---

## 🔄 Complete Data Flow Examples

### Example 1: User says "Show me cameras"

```
1. User speaks: "Show me cameras"
   ↓
2. Deepgram STT converts to text: "Show me cameras"
   ↓
3. Google Gemini LLM processes text
   ↓
4. LLM decides to call: browse_products(search_term="camera")
   ↓
5. agent.py → browse_products() executes
   ↓
6. Calls commerce.get_products(search_term="camera")
   ↓
7. commerce.py filters CATALOG, finds camera products
   ↓
8. browse_products() formats response and sends metadata:
   - Returns: "I found 4 products matching 'camera'..."
   - Sends data message: "[FILTER:search_term=camera]"
   ↓
9. Frontend receives data message via RoomEvent.DataReceived
   ↓
10. Parses metadata, updates state: setSearchTerm("camera")
    ↓
11. useMemo recalculates filteredProducts
    ↓
12. UI updates: Product grid shows only cameras
    ↓
13. Murf TTS speaks: "I found 4 products matching 'camera'..."
```

### Example 2: User says "I'll buy the Echo Dot"

```
1. User speaks: "I'll buy the Echo Dot"
   ↓
2. STT → "I'll buy the Echo Dot"
   ↓
3. LLM calls: place_order(product_name_or_id="Echo Dot", quantity=1)
   ↓
4. agent.py → place_order() executes
   ↓
5. Calls commerce.find_product_by_name("Echo Dot")
   ↓
6. Finds product: { id: "echo-dot-5", name: "Echo Dot (5th Gen)", price: 4499 }
   ↓
7. Calls commerce.create_order(product_id="echo-dot-5", quantity=1)
   ↓
8. create_order() creates order object and appends to orders.json
   ↓
9. Returns: "Order confirmed! Order ID: abc123... Total: ₹4,499"
   ↓
10. TTS speaks confirmation
    ↓
11. Frontend polls /api/orders (every 2.5 seconds)
    ↓
12. Reads updated orders.json, sees new order
    ↓
13. Updates orders state, sidebar auto-opens for 3 seconds
    ↓
14. UI shows new order in sidebar
```

### Example 3: User clicks "Buy Now" button

```
1. User clicks "Buy Now" on product card
   ↓
2. Frontend sends POST /api/orders with { product_id: "echo-dot-5", quantity: 1 }
   ↓
3. frontend/app/api/orders/route.ts handles POST
   ↓
4. Creates order (same logic as backend create_order)
   ↓
5. Writes to backend/orders.json
   ↓
6. Returns order object
   ↓
7. Frontend shows alert: "Order placed! Order ID: ..."
   ↓
8. Frontend refreshes orders (calls GET /api/orders)
   ↓
9. Sidebar auto-opens showing new order
```

---

## 🎯 Key Integration Points

### 1. Filter Metadata Transmission
**Backend → Frontend:**
- **Method:** LiveKit Data Channel (`publish_data`)
- **Format:** `[FILTER:search_term=<term>,category=<cat>,max_price=<price>,sort_by=<sort>]`
- **Topic:** "chat"
- **Location:** `backend/src/agent.py` → `browse_products()` function

**Frontend Reception:**
- **Event:** `RoomEvent.DataReceived`
- **Location:** `frontend/components/app/ecommerce-session-view.tsx` → `useEffect` hook
- **Action:** Parses metadata, updates filter state

### 2. Order Synchronization
**Backend writes:** `backend/orders.json`
**Frontend reads:** Polls `/api/orders` every 2.5 seconds
**API Route:** `frontend/app/api/orders/route.ts` reads same file

### 3. Product Catalog Sync
**Backend:** `backend/src/commerce.py` → `CATALOG` constant
**Frontend API:** `frontend/app/api/products/route.ts` → Same catalog
**Frontend Component:** Fetches from `/api/products` on mount

---

## 🔧 Configuration Files

### `backend/.env.local` (or `env.template`)
Required environment variables:
- `LIVEKIT_URL` - WebSocket URL for LiveKit server
- `LIVEKIT_API_KEY` - API key for LiveKit
- `LIVEKIT_API_SECRET` - API secret for LiveKit
- `GOOGLE_API_KEY` - For Gemini LLM
- `DEEPGRAM_API_KEY` - For STT
- `MURF_API_KEY` - For TTS

### `frontend/.env.local`
- `NEXT_PUBLIC_AGENT_DAY=9` - Tells frontend to use e-commerce view
- Same LiveKit credentials as backend

---

## 📊 State Management Flow

### Backend State (Python)
- **In-Memory:** `CATALOG` list (loaded at import)
- **Persistent:** `orders.json`, `cart.json` (file-based)

### Frontend State (React)
- **Products:** Fetched once on mount, stored in `products` state
- **Orders:** Polled every 2.5 seconds, stored in `orders` state
- **Filters:** Managed via `useState` hooks, applied via `useMemo`
- **UI State:** `sidebarOpen`, `isListening`, `isAgentSpeaking`

---

## 🎨 UI Updates Trigger Points

1. **Product Filtering:**
   - Trigger: Data channel receives `[FILTER:...]` metadata
   - Updates: `filteredProducts` useMemo recalculates
   - Result: Product grid re-renders with filtered products

2. **Order Display:**
   - Trigger: Polling detects new order in `orders.json`
   - Updates: `orders` state changes
   - Result: Sidebar auto-opens, shows new order

3. **Voice Indicators:**
   - Trigger: LiveKit `isSpeakingChanged` events
   - Updates: `isListening`, `isAgentSpeaking` state
   - Result: Microphone button pulses/glows

---

## 🚀 Startup Sequence

1. **Backend starts:**
   - Loads `agent.py`, initializes `Assistant` class
   - Registers 9 function tools
   - Sets up voice pipeline (STT, LLM, TTS)
   - Waits for LiveKit room connection

2. **Frontend loads:**
   - `view-controller.tsx` detects `NEXT_PUBLIC_AGENT_DAY=9`
   - Renders `EcommerceSessionView` immediately (no welcome screen)
   - Fetches products from `/api/products`
   - Starts polling `/api/orders`
   - Shows "START CALL" button

3. **User clicks "START CALL":**
   - Frontend calls `startSession()` from `useSession()` hook
   - Connects to LiveKit room
   - Backend agent joins room
   - Voice pipeline activates
   - Control bar appears (replaces "START CALL" button)

4. **User speaks:**
   - STT converts to text
   - LLM processes and calls function tools
   - Results sent back via TTS
   - Filter metadata sent via data channel
   - Frontend updates UI automatically

---

## 🔍 Debugging Points

**Backend Logging:**
- `logger.info()` in `browse_products()` shows function calls
- `logger.error()` catches exceptions
- Check console for: "browse_products FUNCTION CALLED!", "Sent filter metadata"

**Frontend Logging:**
- Console logs: "📦 Received data message", "✅ Found FILTER metadata"
- React DevTools: Check state updates for filters, orders
- Network tab: Monitor `/api/orders` polling

**Common Issues:**
- Filter not applying: Check data channel listener is active
- Orders not updating: Verify `orders.json` file path matches
- Products not showing: Check `/api/products` returns data

---

## 📝 Summary

The e-commerce agent works by:
1. **Voice Input** → STT converts to text
2. **LLM Processing** → Decides which function to call
3. **Function Execution** → Python functions query catalog/orders
4. **Metadata Transmission** → Filter data sent via LiveKit data channel
5. **Frontend Updates** → React state updates trigger UI re-renders
6. **Voice Output** → TTS speaks the response

All data flows through:
- **Backend:** Python functions → JSON files
- **Frontend:** API routes → React state → UI components
- **Communication:** LiveKit WebRTC for audio, Data Channel for metadata

The architecture separates concerns:
- **Conversation logic** (agent.py) - handles voice interaction
- **Commerce logic** (commerce.py) - handles products/orders
- **UI logic** (ecommerce-session-view.tsx) - handles visual display

