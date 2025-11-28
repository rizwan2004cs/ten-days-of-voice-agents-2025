# Day 8 Game Master Agent - Testing Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup & Running](#setup--running)
3. [Test Cases - Primary Goal](#test-cases---primary-goal)
4. [Test Cases - Advanced Features](#test-cases---advanced-features)
5. [UI/UX Testing](#uiux-testing)
6. [World State Testing](#world-state-testing)
7. [Edge Cases](#edge-cases)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before testing, ensure you have:

- ✅ Python 3.9+ with `uv` package manager
- ✅ Node.js 18+ with `pnpm`
- ✅ LiveKit Server installed (`brew install livekit` or download from [livekit.io](https://livekit.io))
- ✅ Environment variables configured in `.env.local` files:
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
  - `MURF_API_KEY`
  - `GOOGLE_API_KEY`
  - `DEEPGRAM_API_KEY`

---

## Setup & Running

### Step 1: Download Required Models

```bash
cd backend
uv run python src/agent.py download-files
```

### Step 2: Start All Services

**Option A: Use the convenience script**
```bash
# From root directory
chmod +x start_app.sh
./start_app.sh
```

**Option B: Run individually (3 terminals)**

**Terminal 1 - LiveKit Server:**
```bash
livekit-server --dev
```

**Terminal 2 - Backend Agent:**
```bash
cd backend
uv run python src/agent.py dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
pnpm dev
```

### Step 3: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

---

## Test Cases - Primary Goal

### ✅ Test Case 1: Game Master Persona

**Objective:** Verify the GM has a clear cyberpunk persona

**Steps:**
1. Connect to the agent
2. Wait for the startup sequence to complete
3. Observe the first GM message

**Expected Results:**
- ✅ Startup sequence shows: "System initializing...", "Connecting to neural net...", "Link established."
- ✅ First GM message describes a cyberpunk scene (neon lights, rain, megacity, etc.)
- ✅ Tone is dramatic and atmospheric
- ✅ Uses cyberpunk terminology (neural implants, data-pads, synth-rain, etc.)

**Pass Criteria:**
- GM introduces a cyberpunk setting
- Message ends with "What do you do?" or similar prompt

---

### ✅ Test Case 2: Interactive Story Flow

**Objective:** Verify the story progresses through player actions

**Steps:**
1. Listen to the opening scene
2. Respond with an action (e.g., "I look around", "I pick up the data-pad")
3. Continue for 3-5 exchanges

**Expected Results:**
- ✅ GM describes scenes vividly
- ✅ GM responds to player actions
- ✅ Story progresses based on player decisions
- ✅ Each GM message ends with a prompt for action

**Pass Criteria:**
- Story adapts to player input
- At least 3-5 meaningful exchanges occur
- GM maintains narrative flow

---

### ✅ Test Case 3: Continuity & Memory

**Objective:** Verify the GM remembers past decisions and events

**Steps:**
1. Make a decision (e.g., "I pick up the katana")
2. Continue the story
3. Reference the previous decision (e.g., "I use the katana")

**Expected Results:**
- ✅ GM remembers items picked up
- ✅ GM remembers locations visited
- ✅ GM references past decisions naturally
- ✅ Named NPCs are remembered

**Pass Criteria:**
- GM references previous player actions
- No contradictions in the story
- Continuity is maintained across 5+ exchanges

---

### ✅ Test Case 4: Session Length

**Objective:** Verify a complete session can run 8-15 exchanges

**Steps:**
1. Start a new session
2. Play through the adventure
3. Count the number of exchanges

**Expected Results:**
- ✅ Session lasts at least 8 exchanges
- ✅ Story reaches a mini-arc or conclusion
- ✅ Adventure feels complete

**Pass Criteria:**
- Minimum 8 exchanges completed
- Story has a beginning, middle, and end
- Player reaches some kind of resolution

---

### ✅ Test Case 5: Basic UI Display

**Objective:** Verify all UI elements display correctly

**Steps:**
1. Open the application
2. Observe all three panels
3. Check control bar

**Expected Results:**
- ✅ **Panel 1 (Neuro-Link):** Shows voice visualizer with green bars
- ✅ **Panel 2 (Mainframe Log):** Shows chat history with:
  - `> USER (YOU):` for player messages (amber)
  - `> SYSTEM (GM):` for GM messages (green with glow)
- ✅ **Panel 3 (System Status):** Shows player stats, character info, inventory, location
- ✅ **Control Bar:** Microphone toggle, chat button, end call button
- ✅ No XML tags visible in chat messages

**Pass Criteria:**
- All three panels are visible
- Text is readable (green/amber on black)
- No scrollbars visible
- Messages format correctly

---

## Test Cases - Advanced Features

### ✅ Test Case 6: JSON World State Tracking

**Objective:** Verify world state is tracked and displayed

**Steps:**
1. Start a new session
2. Play until GM mentions items or location changes
3. Check System Status panel

**Expected Results:**
- ✅ **PLAYER STATS:** HP and Mana bars update
- ✅ **CHARACTER:** Name and Class appear
- ✅ **ATTRIBUTES:** STR, INT, LUCK values shown
- ✅ **INVENTORY:** Items appear when picked up
- ✅ **LOCATION:** Current location updates
- ✅ **ACTIVE QUESTS:** Quests appear when created

**Pass Criteria:**
- World state updates appear in System Status panel
- Data persists across multiple exchanges
- No duplicate entries

---

### ✅ Test Case 7: Player Character Sheet

**Objective:** Verify character stats are tracked

**Steps:**
1. Start a session
2. Wait for character initialization
3. Check System Status panel

**Expected Results:**
- ✅ Character name appears (e.g., "Anya")
- ✅ Character class appears (e.g., "Street Samurai")
- ✅ HP bar shows current/max (e.g., "100/100")
- ✅ Mana bar shows current/max (e.g., "50/50")
- ✅ Attributes show values (STR, INT, LUCK)

**Pass Criteria:**
- All character information displays
- Stats update when changed
- Progress bars reflect current values

---

### ✅ Test Case 8: Inventory Management

**Objective:** Verify inventory tracking works

**Steps:**
1. Play until GM mentions finding an item
2. Check System Status panel
3. Continue and find more items

**Expected Results:**
- ✅ Items appear in INVENTORY section
- ✅ Items are listed with `>` prefix
- ✅ Multiple items can be tracked
- ✅ Items persist across exchanges

**Pass Criteria:**
- Inventory updates when items are found
- Items remain in inventory
- Format is consistent

---

### ✅ Test Case 9: Dice Rolls & Mechanics

**Objective:** Verify game mechanics work

**Steps:**
1. Attempt a risky action (e.g., "I try to hack the door")
2. Observe GM response
3. Check if dice roll occurred

**Expected Results:**
- ✅ GM uses dice rolls for uncertain actions
- ✅ Outcomes vary (success/failure/partial)
- ✅ Results are described narratively
- ✅ Player attributes affect outcomes

**Pass Criteria:**
- Dice rolls occur for risky actions
- Outcomes are logical
- Attributes influence results

---

### ✅ Test Case 10: NPCs & Quests

**Objective:** Verify NPCs and quests are tracked

**Steps:**
1. Play until meeting an NPC
2. Receive a quest
3. Check System Status panel

**Expected Results:**
- ✅ NPCs appear in "KNOWN NPCS" section
- ✅ Quests appear in "ACTIVE QUESTS" section
- ✅ NPCs show name and role
- ✅ Quests show title

**Pass Criteria:**
- NPCs are tracked and displayed
- Quests are tracked and displayed
- Information persists

---

## UI/UX Testing

### ✅ Test Case 11: Cyberpunk Terminal Theme

**Objective:** Verify the terminal aesthetic

**Steps:**
1. Observe the UI
2. Check colors, fonts, effects

**Expected Results:**
- ✅ Background: Deep black (#050505) with grid pattern
- ✅ Text: Neon green (#00ff41) for primary text
- ✅ Accents: Amber (#ffb300) for labels
- ✅ Font: Monospace (Space Mono)
- ✅ Scanlines effect visible
- ✅ Glow effects on GM text
- ✅ Terminal borders on panels

**Pass Criteria:**
- All visual elements match cyberpunk theme
- Text is readable
- Effects enhance the aesthetic

---

### ✅ Test Case 12: Real-time Message Streaming

**Objective:** Verify messages appear as they're generated

**Steps:**
1. Start a conversation
2. Watch the Mainframe Log panel
3. Observe message appearance

**Expected Results:**
- ✅ Messages appear in real-time as agent speaks
- ✅ Streaming indicator (blinking cursor) shows during generation
- ✅ Messages update smoothly
- ✅ Auto-scroll works

**Pass Criteria:**
- Messages stream in real-time
- No lag or delay
- Smooth updates

---

### ✅ Test Case 13: Panel Scrolling

**Objective:** Verify scrolling works without visible scrollbars

**Steps:**
1. Generate many messages (10+)
2. Try to scroll in Mainframe Log
3. Try to scroll in System Status

**Expected Results:**
- ✅ Content scrolls with mouse wheel/trackpad
- ✅ No visible scrollbars
- ✅ Smooth scrolling
- ✅ Auto-scroll to bottom on new messages

**Pass Criteria:**
- Scrolling works
- No scrollbars visible
- Auto-scroll functions

---

### ✅ Test Case 14: Fixed Panel Sizes

**Objective:** Verify panels maintain fixed sizes

**Steps:**
1. Resize browser window
2. Observe panel behavior
3. Check spacing

**Expected Results:**
- ✅ Left panel: 300px fixed width
- ✅ Right panel: 300px fixed width
- ✅ Middle panel: Flexible (takes remaining space)
- ✅ All panels: Fixed height
- ✅ Proper spacing from control bar

**Pass Criteria:**
- Panels maintain sizes
- Layout is responsive
- No overlap

---

## World State Testing

### ✅ Test Case 15: XML Tag Parsing

**Objective:** Verify world state updates from XML tags

**Steps:**
1. Monitor browser console (F12)
2. Play the game
3. Check if world state updates

**Expected Results:**
- ✅ XML tags are parsed correctly
- ✅ World state updates in System Status
- ✅ No XML tags visible in chat
- ✅ Parsing handles various tag formats

**Pass Criteria:**
- World state updates automatically
- No parsing errors in console
- XML tags never appear in UI

---

### ✅ Test Case 16: World State Persistence

**Objective:** Verify world state persists across exchanges

**Steps:**
1. Play until inventory has items
2. Continue for 3+ more exchanges
3. Check System Status panel

**Expected Results:**
- ✅ Inventory persists
- ✅ Location persists
- ✅ Character stats persist
- ✅ NPCs persist
- ✅ Quests persist

**Pass Criteria:**
- All world state data persists
- No data loss between exchanges
- Updates accumulate correctly

---

## Edge Cases

### ✅ Test Case 17: Empty Messages

**Objective:** Verify handling of empty or invalid messages

**Steps:**
1. Wait for agent response
2. Check if empty messages are handled

**Expected Results:**
- ✅ Empty messages don't appear
- ✅ No errors in console
- ✅ UI remains stable

**Pass Criteria:**
- No empty message entries
- No crashes
- Graceful handling

---

### ✅ Test Case 18: Rapid Messages

**Objective:** Verify handling of rapid message updates

**Steps:**
1. Have a fast conversation
2. Observe message handling
3. Check for duplicates

**Expected Results:**
- ✅ No duplicate messages
- ✅ All messages appear
- ✅ Correct ordering
- ✅ No key errors

**Pass Criteria:**
- No duplicate messages
- Correct message order
- No React key warnings

---

### ✅ Test Case 19: Long Messages

**Objective:** Verify handling of very long GM messages

**Steps:**
1. Play until GM sends a long description
2. Check display
3. Verify scrolling

**Expected Results:**
- ✅ Long messages display correctly
- ✅ Text wraps properly
- ✅ Scrolling works
- ✅ No layout breaks

**Pass Criteria:**
- Long messages display fully
- Layout remains intact
- Scrolling functions

---

### ✅ Test Case 20: Special Characters

**Objective:** Verify handling of special characters

**Steps:**
1. Use special characters in responses
2. Check display
3. Verify parsing

**Expected Results:**
- ✅ Special characters display correctly
- ✅ XML parsing still works
- ✅ No encoding issues

**Pass Criteria:**
- All characters display correctly
- No parsing errors
- Encoding is correct

---

## Troubleshooting

### Issue: Messages not appearing

**Check:**
1. Is LiveKit Server running?
2. Is the backend agent connected?
3. Check browser console for errors
4. Verify microphone permissions

**Solution:**
- Restart all services
- Check `.env.local` files
- Clear browser cache

---

### Issue: World state not updating

**Check:**
1. Are XML tags being sent by agent?
2. Check browser console for parsing errors
3. Verify world state state updates

**Solution:**
- Check agent logs for tool calls
- Verify XML tag format
- Check React state updates

---

### Issue: UI not loading

**Check:**
1. Is frontend server running?
2. Check browser console for errors
3. Verify all dependencies installed

**Solution:**
- Run `pnpm install` in frontend
- Check Next.js build errors
- Verify port 3000 is available

---

### Issue: Audio not working

**Check:**
1. Microphone permissions
2. Audio device selection
3. Browser audio settings

**Solution:**
- Grant microphone permissions
- Select correct audio device
- Check browser audio settings

---

## Quick Test Checklist

Use this checklist for quick verification:

- [ ] Startup sequence displays
- [ ] Three panels visible (Neuro-Link, Mainframe, System Status)
- [ ] Voice visualizer shows activity
- [ ] GM messages appear in real-time
- [ ] Player messages appear correctly
- [ ] System Status shows default values
- [ ] World state updates when agent sends data
- [ ] No XML tags visible in chat
- [ ] Scrolling works without visible scrollbars
- [ ] Microphone toggle works
- [ ] End call button works
- [ ] Session lasts 8+ exchanges
- [ ] Story has continuity
- [ ] All UI elements styled correctly

---

## Performance Testing

### Test Case 21: Performance

**Objective:** Verify application performance

**Steps:**
1. Play for 20+ exchanges
2. Monitor browser performance
3. Check memory usage

**Expected Results:**
- ✅ No memory leaks
- ✅ Smooth scrolling
- ✅ Fast message updates
- ✅ No lag

**Pass Criteria:**
- Application remains responsive
- Memory usage stable
- No performance degradation

---

## Success Criteria

Your Day 8 agent is complete when:

✅ **Primary Goal:**
- GM persona is clear and consistent
- Interactive story works (8-15 exchanges)
- Continuity is maintained
- Basic UI displays correctly

✅ **Advanced Features (Optional but Recommended):**
- World state tracking works
- Character sheet displays
- Inventory management works
- NPCs and quests tracked
- Dice rolls implemented

✅ **UI/UX:**
- Cyberpunk theme applied correctly
- Real-time streaming works
- No visible scrollbars
- Fixed panel sizes
- All sections display

---

## Recording Your Demo

For the LinkedIn post, record a video showing:

1. **Startup sequence** (10 seconds)
2. **Voice interaction** (30-60 seconds)
   - Show yourself speaking
   - Show GM responses
   - Show world state updates
3. **System Status panel** (10 seconds)
   - Highlight character info
   - Show inventory
   - Show location
4. **Story progression** (30 seconds)
   - Show 3-5 exchanges
   - Show continuity
5. **Conclusion** (10 seconds)
   - Show session completion

**Total video length:** 1-2 minutes

---

## Notes

- Test in Chrome/Edge for best compatibility
- Use a good microphone for clear audio
- Record in a quiet environment
- Show the UI clearly in the video
- Mention Murf Falcon TTS in your post
- Use hashtags: #MurfAIVoiceAgentsChallenge #10DaysofAIVoiceAgents

Good luck with your testing! 🎮

